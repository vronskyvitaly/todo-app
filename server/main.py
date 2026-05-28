import json
import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
import bcrypt as _bcrypt
from pydantic import BaseModel, EmailStr

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-super-secret-key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

# ---------------------------------------------------------------------------
# In-memory storage
# ---------------------------------------------------------------------------
users: dict[str, dict] = {}          # email → {id, email, hashed_password}
todos: dict[str, dict[str, dict]] = {}  # user_id → {todo_id → todo}
connections: dict[str, set] = {}     # user_id → set of WebSocket

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
    """Return user_id or raise JWTError."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if user_id is None:
        raise JWTError("Missing sub")
    return user_id


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
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    if email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_id = str(uuid.uuid4())
    users[email] = {
        "id": user_id,
        "email": email,
        "hashed_password": hash_password(body.password),
    }
    todos[user_id] = {}

    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "email": email}}


@app.post("/api/login")
async def login(body: LoginRequest):
    email = body.email.lower()
    user = users.get(email)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"]}}


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

    # Register connection
    if user_id not in connections:
        connections[user_id] = set()
    connections[user_id].add(websocket)

    # Ensure user todo bucket exists
    if user_id not in todos:
        todos[user_id] = {}

    print(f"[+] WS connected user={user_id}")

    try:
        # Send current todos
        await websocket.send_text(json.dumps({
            "type": "TODOS_LIST",
            "payload": list(todos[user_id].values()),
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
        user_todos = todos[user_id]

        if msg_type == "GET_TODOS":
            await websocket.send_text(json.dumps({
                "type": "TODOS_LIST",
                "payload": list(user_todos.values()),
            }))

        elif msg_type == "CREATE_TODO":
            title = payload.get("title", "").strip()
            if not title:
                await websocket.send_text(json.dumps({
                    "type": "ERROR",
                    "payload": {"message": "Title is required"},
                }))
                return
            todo_id = str(uuid.uuid4())
            todo = {
                "id": todo_id,
                "title": title,
                "description": payload.get("description", "").strip(),
                "completed": False,
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
            user_todos[todo_id] = todo
            await broadcast_to_user(user_id, {"type": "TODO_CREATED", "payload": todo})

        elif msg_type == "UPDATE_TODO":
            todo_id = payload.get("id")
            if todo_id not in user_todos:
                await websocket.send_text(json.dumps({
                    "type": "ERROR",
                    "payload": {"message": f"Todo '{todo_id}' not found"},
                }))
                return
            todo = user_todos[todo_id]
            if "title" in payload:
                title = payload["title"].strip()
                if not title:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "payload": {"message": "Title cannot be empty"},
                    }))
                    return
                todo["title"] = title
            if "description" in payload:
                todo["description"] = payload["description"].strip()
            if "completed" in payload:
                todo["completed"] = bool(payload["completed"])
            await broadcast_to_user(user_id, {"type": "TODO_UPDATED", "payload": todo})

        elif msg_type == "DELETE_TODO":
            todo_id = payload.get("id")
            if todo_id in user_todos:
                del user_todos[todo_id]
                await broadcast_to_user(user_id, {"type": "TODO_DELETED", "payload": {"id": todo_id}})

        elif msg_type == "TOGGLE_TODO":
            todo_id = payload.get("id")
            if todo_id in user_todos:
                user_todos[todo_id]["completed"] = not user_todos[todo_id]["completed"]
                await broadcast_to_user(user_id, {"type": "TODO_UPDATED", "payload": user_todos[todo_id]})

        else:
            await websocket.send_text(json.dumps({
                "type": "ERROR",
                "payload": {"message": f"Unknown message type: {msg_type}"},
            }))

    except json.JSONDecodeError:
        await websocket.send_text(json.dumps({
            "type": "ERROR",
            "payload": {"message": "Invalid JSON format"},
        }))
    except Exception as exc:
        await websocket.send_text(json.dumps({
            "type": "ERROR",
            "payload": {"message": str(exc)},
        }))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
