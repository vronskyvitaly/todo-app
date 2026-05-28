import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
import bcrypt as _bcrypt

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-super-secret-key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/todolist",
).replace("postgres://", "postgresql://")

# ---------------------------------------------------------------------------
# In-memory (WebSocket connections only — cannot be persisted)
# ---------------------------------------------------------------------------
connections: dict[str, set] = {}  # user_id → set of WebSocket
pool: asyncpg.Pool | None = None

# ---------------------------------------------------------------------------
# DB lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email           TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS todos (
                id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title       TEXT        NOT NULL,
                description TEXT        NOT NULL DEFAULT '',
                completed   BOOLEAN     NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
        """)
    yield
    await pool.close()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if user_id is None:
        raise JWTError("Missing sub")
    return user_id


def row_to_todo(r: asyncpg.Record) -> dict:
    return {
        "id": str(r["id"]),
        "title": r["title"],
        "description": r["description"],
        "completed": r["completed"],
        "createdAt": r["created_at"].isoformat(),
    }


async def broadcast_to_user(user_id: str, message: dict) -> None:
    data = json.dumps(message)
    dead: set = set()
    for ws in connections.get(user_id, set()):
        try:
            await ws.send_text(data)
        except Exception:
            dead.add(ws)
    connections[user_id] -= dead

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://todo.vronskyvitaly.ru",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# HTTP endpoints
# ---------------------------------------------------------------------------
@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    email = body.email.lower()
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed = hash_password(body.password)
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "INSERT INTO users (email, hashed_password) VALUES ($1, $2) RETURNING id, email",
                email, hashed,
            )
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(row["id"])
    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "email": row["email"]}}


@app.post("/api/login")
async def login(body: LoginRequest):
    email = body.email.lower()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, hashed_password FROM users WHERE email = $1",
            email,
        )
    if not row or not verify_password(body.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(row["id"])
    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "email": row["email"]}}

# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token", "")
    try:
        user_id = decode_token(token)
    except JWTError:
        await websocket.close(code=4001)
        return

    await websocket.accept()

    if user_id not in connections:
        connections[user_id] = set()
    connections[user_id].add(websocket)

    print(f"[+] WS connected user={user_id}")

    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, title, description, completed, created_at FROM todos WHERE user_id = $1 ORDER BY created_at ASC",
                uuid.UUID(user_id),
            )
        await websocket.send_text(json.dumps({
            "type": "TODOS_LIST",
            "payload": [row_to_todo(r) for r in rows],
        }))

        async for raw in websocket.iter_text():
            await handle_message(websocket, user_id, raw)

    except WebSocketDisconnect:
        pass
    finally:
        connections[user_id].discard(websocket)
        print(f"[-] WS disconnected user={user_id}")


async def handle_message(websocket: WebSocket, user_id: str, raw: str) -> None:
    try:
        data = json.loads(raw)
        msg_type = data.get("type")
        payload = data.get("payload", {})

        if msg_type == "GET_TODOS":
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT id, title, description, completed, created_at FROM todos WHERE user_id = $1 ORDER BY created_at ASC",
                    uuid.UUID(user_id),
                )
            await websocket.send_text(json.dumps({
                "type": "TODOS_LIST",
                "payload": [row_to_todo(r) for r in rows],
            }))

        elif msg_type == "CREATE_TODO":
            title = payload.get("title", "").strip()
            if not title:
                await websocket.send_text(json.dumps({
                    "type": "ERROR", "payload": {"message": "Title is required"},
                }))
                return
            description = payload.get("description", "").strip()
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    """INSERT INTO todos (user_id, title, description)
                       VALUES ($1, $2, $3)
                       RETURNING id, title, description, completed, created_at""",
                    uuid.UUID(user_id), title, description,
                )
            await broadcast_to_user(user_id, {"type": "TODO_CREATED", "payload": row_to_todo(row)})

        elif msg_type == "UPDATE_TODO":
            todo_id = payload.get("id")
            if not todo_id:
                return
            updates: dict = {}
            if "title" in payload:
                title = payload["title"].strip()
                if not title:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR", "payload": {"message": "Title cannot be empty"},
                    }))
                    return
                updates["title"] = title
            if "description" in payload:
                updates["description"] = payload["description"].strip()
            if "completed" in payload:
                updates["completed"] = bool(payload["completed"])
            if not updates:
                return

            values: list = [uuid.UUID(todo_id)]
            set_parts = []
            for i, (col, val) in enumerate(updates.items(), start=2):
                set_parts.append(f"{col} = ${i}")
                values.append(val)
            values.append(uuid.UUID(user_id))

            sql = (
                f"UPDATE todos SET {', '.join(set_parts)} "
                f"WHERE id = $1 AND user_id = ${len(values)} "
                f"RETURNING id, title, description, completed, created_at"
            )
            async with pool.acquire() as conn:
                row = await conn.fetchrow(sql, *values)

            if row is None:
                await websocket.send_text(json.dumps({
                    "type": "ERROR", "payload": {"message": f"Todo '{todo_id}' not found"},
                }))
                return
            await broadcast_to_user(user_id, {"type": "TODO_UPDATED", "payload": row_to_todo(row)})

        elif msg_type == "DELETE_TODO":
            todo_id = payload.get("id")
            if not todo_id:
                return
            async with pool.acquire() as conn:
                result = await conn.execute(
                    "DELETE FROM todos WHERE id = $1 AND user_id = $2",
                    uuid.UUID(todo_id), uuid.UUID(user_id),
                )
            if result == "DELETE 1":
                await broadcast_to_user(user_id, {"type": "TODO_DELETED", "payload": {"id": todo_id}})

        elif msg_type == "TOGGLE_TODO":
            todo_id = payload.get("id")
            if not todo_id:
                return
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    """UPDATE todos SET completed = NOT completed
                       WHERE id = $1 AND user_id = $2
                       RETURNING id, title, description, completed, created_at""",
                    uuid.UUID(todo_id), uuid.UUID(user_id),
                )
            if row:
                await broadcast_to_user(user_id, {"type": "TODO_UPDATED", "payload": row_to_todo(row)})

        else:
            await websocket.send_text(json.dumps({
                "type": "ERROR", "payload": {"message": f"Unknown message type: {msg_type}"},
            }))

    except json.JSONDecodeError:
        await websocket.send_text(json.dumps({
            "type": "ERROR", "payload": {"message": "Invalid JSON format"},
        }))
    except Exception as exc:
        await websocket.send_text(json.dumps({
            "type": "ERROR", "payload": {"message": str(exc)},
        }))

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
