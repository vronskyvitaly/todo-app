import datetime
import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import timedelta, timezone

import asyncpg
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
import bcrypt as _bcrypt
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pywebpush import webpush, WebPushException

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

VAPID_PUBLIC_KEY  = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL       = os.getenv("VAPID_EMAIL", "mailto:admin@vronskyvitaly.ru")

# ---------------------------------------------------------------------------
# In-memory (WebSocket connections only — cannot be persisted)
# ---------------------------------------------------------------------------
connections: dict[str, set] = {}
pool: asyncpg.Pool | None = None
scheduler = AsyncIOScheduler(timezone="UTC")

# ---------------------------------------------------------------------------
# DB lifespan
# ---------------------------------------------------------------------------
TODO_COLS = (
    "id, title, description, completed, created_at, important, due_date, "
    "priority, tags, board_id, column_id, position, reminder_at, reminder_sent, "
    "recurring_days, recurring_time, recurring_count"
)
BOARD_COLS  = "id, user_id, name, description, created_at"
COLUMN_COLS = "id, board_id, name, position, created_at"


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
            CREATE TABLE IF NOT EXISTS boards (
                id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name        TEXT        NOT NULL,
                description TEXT        NOT NULL DEFAULT '',
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
            CREATE TABLE IF NOT EXISTS columns (
                id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                board_id    UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
                name        TEXT        NOT NULL,
                position    INTEGER     NOT NULL DEFAULT 0,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
            CREATE TABLE IF NOT EXISTS todos (
                id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title       TEXT        NOT NULL,
                description TEXT        NOT NULL DEFAULT '',
                completed   BOOLEAN     NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                endpoint   TEXT        UNIQUE NOT NULL,
                p256dh     TEXT        NOT NULL,
                auth       TEXT        NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
        """)
        # Idempotent column migrations
        await conn.execute("""
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS important      BOOLEAN   NOT NULL DEFAULT FALSE;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date       DATE;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority       TEXT      NOT NULL DEFAULT 'normal';
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS tags           TEXT[]    NOT NULL DEFAULT '{}';
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS board_id       UUID      REFERENCES boards(id) ON DELETE SET NULL;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS column_id      UUID      REFERENCES columns(id) ON DELETE SET NULL;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS position       INTEGER   NOT NULL DEFAULT 0;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS reminder_at      TIMESTAMPTZ;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS reminder_sent   BOOLEAN   NOT NULL DEFAULT FALSE;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_days       INTEGER[] NOT NULL DEFAULT '{}';
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_time       TEXT      NOT NULL DEFAULT '09:00';
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_count      INTEGER   NOT NULL DEFAULT 0;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_sent_count INTEGER   NOT NULL DEFAULT 0;
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_last_sent  DATE;
        """)

    scheduler.add_job(check_reminders, "interval", seconds=30, id="reminders")
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await pool.close()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    expire = datetime.datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if user_id is None:
        raise JWTError("Missing sub")
    return user_id


def row_to_todo(r: asyncpg.Record) -> dict:
    return {
        "id":           str(r["id"]),
        "title":        r["title"],
        "description":  r["description"],
        "completed":    r["completed"],
        "createdAt":    r["created_at"].isoformat(),
        "important":    r["important"],
        "dueDate":      r["due_date"].isoformat() if r["due_date"] else None,
        "priority":     r["priority"],
        "tags":         list(r["tags"]),
        "boardId":      str(r["board_id"])   if r["board_id"]   else None,
        "columnId":     str(r["column_id"])  if r["column_id"]  else None,
        "position":     r["position"],
        "reminderAt":      r["reminder_at"].isoformat() if r["reminder_at"] else None,
        "reminderSent":    r["reminder_sent"],
        "recurringDays":   list(r["recurring_days"]),
        "recurringTime":   r["recurring_time"],
        "recurringCount":  r["recurring_count"],
    }


def row_to_board(r: asyncpg.Record) -> dict:
    return {
        "id":          str(r["id"]),
        "userId":      str(r["user_id"]),
        "name":        r["name"],
        "description": r["description"],
        "createdAt":   r["created_at"].isoformat(),
    }


def row_to_column(r: asyncpg.Record) -> dict:
    return {
        "id":        str(r["id"]),
        "boardId":   str(r["board_id"]),
        "name":      r["name"],
        "position":  r["position"],
        "createdAt": r["created_at"].isoformat(),
    }


def parse_due_date(value) -> datetime.date | None:
    if not value:
        return None
    try:
        return datetime.date.fromisoformat(str(value))
    except ValueError:
        return None


def parse_reminder(value) -> datetime.datetime | None:
    if not value:
        return None
    try:
        return datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


async def broadcast_to_user(user_id: str, message: dict) -> None:
    data = json.dumps(message)
    dead: set = set()
    for ws in connections.get(user_id, set()):
        try:
            await ws.send_text(data)
        except Exception:
            dead.add(ws)
    connections[user_id] -= dead


async def check_reminders() -> None:
    """Runs every 30 s — sends push notifications for due reminders."""
    if not VAPID_PRIVATE_KEY or not pool:
        print("[reminders] skipped: no VAPID key or pool")
        return
    now = datetime.datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        # Debug: total subscriptions
        sub_count = await conn.fetchval("SELECT COUNT(*) FROM push_subscriptions")
        pending = await conn.fetchval(
            "SELECT COUNT(*) FROM todos WHERE reminder_at IS NOT NULL AND reminder_sent=FALSE AND completed=FALSE"
        )
        print(f"[reminders] tick subs={sub_count} pending_reminders={pending} now={now.isoformat()}")

        rows = await conn.fetch("""
            SELECT t.id, t.title, ps.endpoint, ps.p256dh, ps.auth
            FROM todos t
            JOIN push_subscriptions ps ON ps.user_id = t.user_id
            WHERE t.reminder_at <= $1
              AND t.reminder_sent = FALSE
              AND t.completed     = FALSE
        """, now)

        print(f"[reminders] due now: {len(rows)}")

        for row in rows:
            try:
                webpush(
                    subscription_info={
                        "endpoint": row["endpoint"],
                        "keys": {"p256dh": row["p256dh"], "auth": row["auth"]},
                    },
                    data=json.dumps({
                        "title": "📋 Task Reminder",
                        "body":  row["title"],
                        "url":   "/",
                    }),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_EMAIL},
                )
                print(f"[reminders] sent push for todo={row['id']}")
            except WebPushException as exc:
                print(f"[reminders] WebPushException todo={row['id']}: {exc} response={exc.response.status_code if exc.response else None}")
                # Subscription expired or invalid — remove it
                if exc.response and exc.response.status_code in (404, 410):
                    await conn.execute(
                        "DELETE FROM push_subscriptions WHERE endpoint = $1",
                        row["endpoint"],
                    )
            except Exception as exc:
                print(f"[reminders] Exception todo={row['id']}: {exc}")

            # Mark sent regardless (avoid re-sending on failure)
            await conn.execute(
                "UPDATE todos SET reminder_sent = TRUE WHERE id = $1",
                row["id"],
            )

        # --- Recurring reminders ---
        tz_offset = timedelta(hours=int(os.getenv("TZ_OFFSET_HOURS", "3")))  # UTC+3 Moscow by default
        now_local = datetime.datetime.now(timezone.utc).astimezone(timezone(tz_offset))
        current_dow  = now_local.weekday()          # 0=Mon … 6=Sun
        current_hhmm = now_local.strftime("%H:%M")

        recurring_rows = await conn.fetch("""
            SELECT t.id, t.title, t.recurring_count, t.recurring_sent_count,
                   ps.endpoint, ps.p256dh, ps.auth
            FROM todos t
            JOIN push_subscriptions ps ON ps.user_id = t.user_id
            WHERE $1 = ANY(t.recurring_days)
              AND t.recurring_time = $2
              AND (t.recurring_last_sent IS NULL OR t.recurring_last_sent < CURRENT_DATE)
              AND (t.recurring_count = 0 OR t.recurring_sent_count < t.recurring_count)
              AND cardinality(t.recurring_days) > 0
              AND t.completed = FALSE
        """, current_dow, current_hhmm)

        print(f"[recurring] dow={current_dow} time={current_hhmm} due={len(recurring_rows)}")

        for row in recurring_rows:
            try:
                webpush(
                    subscription_info={
                        "endpoint": row["endpoint"],
                        "keys": {"p256dh": row["p256dh"], "auth": row["auth"]},
                    },
                    data=json.dumps({
                        "title": "🔔 Напоминание",
                        "body":  row["title"],
                        "url":   "/",
                    }),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_EMAIL},
                )
                print(f"[recurring] sent push for todo={row['id']}")
            except WebPushException as exc:
                print(f"[recurring] WebPushException todo={row['id']}: {exc}")
                if exc.response and exc.response.status_code in (404, 410):
                    await conn.execute(
                        "DELETE FROM push_subscriptions WHERE endpoint = $1",
                        row["endpoint"],
                    )
            except Exception as exc:
                print(f"[recurring] Exception todo={row['id']}: {exc}")

            await conn.execute(
                """UPDATE todos
                   SET recurring_sent_count = recurring_sent_count + 1,
                       recurring_last_sent  = CURRENT_DATE
                   WHERE id = $1""",
                row["id"],
            )

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
        "http://localhost:3001",
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


@app.get("/api/push/vapid-key")
async def get_vapid_key():
    return {"publicKey": VAPID_PUBLIC_KEY}


@app.get("/api/push/debug")
async def debug_push(request: Request):
    """Temporary debug endpoint — shows subscription + reminder state."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        user_id = decode_token(auth_header[7:])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with pool.acquire() as conn:
        subs = await conn.fetchval(
            "SELECT COUNT(*) FROM push_subscriptions WHERE user_id = $1",
            uuid.UUID(user_id),
        )
        reminders = await conn.fetch(
            """SELECT id, title, reminder_at, reminder_sent, completed
               FROM todos WHERE user_id = $1 AND reminder_at IS NOT NULL
               ORDER BY reminder_at DESC LIMIT 10""",
            uuid.UUID(user_id),
        )
    return {
        "subscriptions": subs,
        "vapid_configured": bool(VAPID_PRIVATE_KEY),
        "reminders": [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "reminder_at": r["reminder_at"].isoformat() if r["reminder_at"] else None,
                "reminder_sent": r["reminder_sent"],
                "completed": r["completed"],
            }
            for r in reminders
        ],
    }


@app.post("/api/push/subscribe")
async def subscribe_push(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        user_id = decode_token(auth_header[7:])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    data = await request.json()
    endpoint = data.get("endpoint")
    keys     = data.get("keys", {})
    p256dh   = keys.get("p256dh")
    auth_key = keys.get("auth")

    if not endpoint or not p256dh or not auth_key:
        raise HTTPException(status_code=400, detail="Invalid subscription data")

    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id
        """, uuid.UUID(user_id), endpoint, p256dh, auth_key)

    return {"ok": True}


@app.delete("/api/push/unsubscribe")
async def unsubscribe_push(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        user_id = decode_token(auth_header[7:])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM push_subscriptions WHERE user_id = $1",
            uuid.UUID(user_id),
        )
    return {"ok": True}

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
            todo_rows = await conn.fetch(
                f"SELECT {TODO_COLS} FROM todos WHERE user_id = $1 ORDER BY created_at ASC",
                uuid.UUID(user_id),
            )
            board_rows = await conn.fetch(
                f"SELECT {BOARD_COLS} FROM boards WHERE user_id = $1 ORDER BY created_at ASC",
                uuid.UUID(user_id),
            )
            board_ids = [r["id"] for r in board_rows]
            column_rows = []
            if board_ids:
                column_rows = await conn.fetch(
                    f"SELECT {COLUMN_COLS} FROM columns WHERE board_id = ANY($1) ORDER BY position ASC",
                    board_ids,
                )

        await websocket.send_text(json.dumps({
            "type": "TODOS_LIST",
            "payload": [row_to_todo(r) for r in todo_rows],
        }))
        await websocket.send_text(json.dumps({
            "type": "BOARDS_DATA",
            "payload": {
                "boards":  [row_to_board(r)  for r in board_rows],
                "columns": [row_to_column(r) for r in column_rows],
            },
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
        data     = json.loads(raw)
        msg_type = data.get("type")
        payload  = data.get("payload", {})

        if msg_type == "GET_TODOS":
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    f"SELECT {TODO_COLS} FROM todos WHERE user_id = $1 ORDER BY created_at ASC",
                    uuid.UUID(user_id),
                )
            await websocket.send_text(json.dumps({
                "type": "TODOS_LIST",
                "payload": [row_to_todo(r) for r in rows],
            }))

        elif msg_type == "GET_BOARDS":
            async with pool.acquire() as conn:
                board_rows = await conn.fetch(
                    f"SELECT {BOARD_COLS} FROM boards WHERE user_id = $1 ORDER BY created_at ASC",
                    uuid.UUID(user_id),
                )
                board_ids = [r["id"] for r in board_rows]
                column_rows = []
                if board_ids:
                    column_rows = await conn.fetch(
                        f"SELECT {COLUMN_COLS} FROM columns WHERE board_id = ANY($1) ORDER BY position ASC",
                        board_ids,
                    )
            await websocket.send_text(json.dumps({
                "type": "BOARDS_DATA",
                "payload": {
                    "boards":  [row_to_board(r)  for r in board_rows],
                    "columns": [row_to_column(r) for r in column_rows],
                },
            }))

        elif msg_type == "CREATE_TODO":
            title = payload.get("title", "").strip()
            if not title:
                await websocket.send_text(json.dumps({
                    "type": "ERROR", "payload": {"message": "Title is required"},
                }))
                return
            description = payload.get("description", "").strip()
            important   = bool(payload.get("important", False))
            due_date    = parse_due_date(payload.get("dueDate"))
            priority    = payload.get("priority", "normal")
            if priority not in ("low", "normal", "high"):
                priority = "normal"
            tags        = [t for t in payload.get("tags", []) if t]
            board_id    = payload.get("boardId")
            column_id   = payload.get("columnId")
            position    = int(payload.get("position", 0))
            reminder_at = parse_reminder(payload.get("reminderAt"))

            board_uuid  = uuid.UUID(board_id)  if board_id  else None
            column_uuid = uuid.UUID(column_id) if column_id else None

            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    f"""INSERT INTO todos
                           (user_id, title, description, important, due_date, priority, tags,
                            board_id, column_id, position, reminder_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        RETURNING {TODO_COLS}""",
                    uuid.UUID(user_id), title, description,
                    important, due_date, priority, tags,
                    board_uuid, column_uuid, position, reminder_at,
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
            if "important" in payload:
                updates["important"] = bool(payload["important"])
            if "dueDate" in payload:
                updates["due_date"] = parse_due_date(payload["dueDate"])
            if "priority" in payload:
                p = payload["priority"]
                updates["priority"] = p if p in ("low", "normal", "high") else "normal"
            if "tags" in payload:
                updates["tags"] = [t for t in payload["tags"] if t]
            if "reminderAt" in payload:
                updates["reminder_at"]   = parse_reminder(payload["reminderAt"])
                updates["reminder_sent"] = False
            if "recurringDays" in payload:
                updates["recurring_days"] = [int(d) for d in payload["recurringDays"] if 0 <= int(d) <= 6]
            if "recurringTime" in payload:
                updates["recurring_time"] = str(payload["recurringTime"])[:5]
            if "recurringCount" in payload:
                updates["recurring_count"] = max(0, int(payload["recurringCount"]))
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
                f"RETURNING {TODO_COLS}"
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
                    f"""UPDATE todos SET completed = NOT completed
                        WHERE id = $1 AND user_id = $2
                        RETURNING {TODO_COLS}""",
                    uuid.UUID(todo_id), uuid.UUID(user_id),
                )
            if row:
                await broadcast_to_user(user_id, {"type": "TODO_UPDATED", "payload": row_to_todo(row)})

        elif msg_type == "CREATE_BOARD":
            name = payload.get("name", "").strip()
            if not name:
                await websocket.send_text(json.dumps({
                    "type": "ERROR", "payload": {"message": "Board name is required"},
                }))
                return
            description = payload.get("description", "").strip()

            async with pool.acquire() as conn:
                board_row = await conn.fetchrow(
                    f"""INSERT INTO boards (user_id, name, description)
                        VALUES ($1, $2, $3)
                        RETURNING {BOARD_COLS}""",
                    uuid.UUID(user_id), name, description,
                )
                board_id = board_row["id"]
                col_rows = []
                for i, col_name in enumerate(["To Do", "In Progress", "Done"]):
                    col_row = await conn.fetchrow(
                        f"""INSERT INTO columns (board_id, name, position)
                            VALUES ($1, $2, $3)
                            RETURNING {COLUMN_COLS}""",
                        board_id, col_name, i,
                    )
                    col_rows.append(col_row)

            await broadcast_to_user(user_id, {
                "type": "BOARD_CREATED",
                "payload": {
                    "board":   row_to_board(board_row),
                    "columns": [row_to_column(r) for r in col_rows],
                },
            })

        elif msg_type == "UPDATE_BOARD":
            board_id = payload.get("id")
            if not board_id:
                return
            updates: dict = {}
            if "name" in payload:
                name = payload["name"].strip()
                if not name:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR", "payload": {"message": "Board name cannot be empty"},
                    }))
                    return
                updates["name"] = name
            if "description" in payload:
                updates["description"] = payload["description"].strip()
            if not updates:
                return

            values: list = [uuid.UUID(board_id)]
            set_parts = []
            for i, (col, val) in enumerate(updates.items(), start=2):
                set_parts.append(f"{col} = ${i}")
                values.append(val)
            values.append(uuid.UUID(user_id))

            sql = (
                f"UPDATE boards SET {', '.join(set_parts)} "
                f"WHERE id = $1 AND user_id = ${len(values)} "
                f"RETURNING {BOARD_COLS}"
            )
            async with pool.acquire() as conn:
                row = await conn.fetchrow(sql, *values)

            if row:
                await broadcast_to_user(user_id, {"type": "BOARD_UPDATED", "payload": row_to_board(row)})

        elif msg_type == "DELETE_BOARD":
            board_id = payload.get("id")
            if not board_id:
                return
            async with pool.acquire() as conn:
                result = await conn.execute(
                    "DELETE FROM boards WHERE id = $1 AND user_id = $2",
                    uuid.UUID(board_id), uuid.UUID(user_id),
                )
            if result == "DELETE 1":
                await broadcast_to_user(user_id, {"type": "BOARD_DELETED", "payload": {"id": board_id}})

        elif msg_type == "CREATE_COLUMN":
            board_id = payload.get("boardId")
            name     = payload.get("name", "").strip()
            if not board_id or not name:
                await websocket.send_text(json.dumps({
                    "type": "ERROR", "payload": {"message": "boardId and name are required"},
                }))
                return
            position = int(payload.get("position", 0))

            async with pool.acquire() as conn:
                board = await conn.fetchrow(
                    "SELECT id FROM boards WHERE id = $1 AND user_id = $2",
                    uuid.UUID(board_id), uuid.UUID(user_id),
                )
                if not board:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR", "payload": {"message": "Board not found"},
                    }))
                    return
                row = await conn.fetchrow(
                    f"""INSERT INTO columns (board_id, name, position)
                        VALUES ($1, $2, $3)
                        RETURNING {COLUMN_COLS}""",
                    uuid.UUID(board_id), name, position,
                )
            await broadcast_to_user(user_id, {"type": "COLUMN_CREATED", "payload": row_to_column(row)})

        elif msg_type == "UPDATE_COLUMN":
            column_id = payload.get("id")
            if not column_id:
                return
            updates: dict = {}
            if "name" in payload:
                name = payload["name"].strip()
                if not name:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR", "payload": {"message": "Column name cannot be empty"},
                    }))
                    return
                updates["name"] = name
            if "position" in payload:
                updates["position"] = int(payload["position"])
            if not updates:
                return

            async with pool.acquire() as conn:
                col = await conn.fetchrow(
                    "SELECT c.id FROM columns c JOIN boards b ON b.id = c.board_id "
                    "WHERE c.id = $1 AND b.user_id = $2",
                    uuid.UUID(column_id), uuid.UUID(user_id),
                )
                if not col:
                    return

                values: list = [uuid.UUID(column_id)]
                set_parts = []
                for i, (db_col, val) in enumerate(updates.items(), start=2):
                    set_parts.append(f"{db_col} = ${i}")
                    values.append(val)

                sql = (
                    f"UPDATE columns SET {', '.join(set_parts)} "
                    f"WHERE id = $1 RETURNING {COLUMN_COLS}"
                )
                row = await conn.fetchrow(sql, *values)

            if row:
                await broadcast_to_user(user_id, {"type": "COLUMN_UPDATED", "payload": row_to_column(row)})

        elif msg_type == "DELETE_COLUMN":
            column_id = payload.get("id")
            if not column_id:
                return
            async with pool.acquire() as conn:
                col = await conn.fetchrow(
                    "SELECT c.id FROM columns c JOIN boards b ON b.id = c.board_id "
                    "WHERE c.id = $1 AND b.user_id = $2",
                    uuid.UUID(column_id), uuid.UUID(user_id),
                )
                if not col:
                    return
                result = await conn.execute(
                    "DELETE FROM columns WHERE id = $1", uuid.UUID(column_id),
                )
            if result == "DELETE 1":
                await broadcast_to_user(user_id, {"type": "COLUMN_DELETED", "payload": {"id": column_id}})

        elif msg_type == "MOVE_CARD":
            todo_id   = payload.get("id")
            column_id = payload.get("columnId")
            position  = int(payload.get("position", 0))
            if not todo_id or not column_id:
                return

            async with pool.acquire() as conn:
                col = await conn.fetchrow(
                    "SELECT c.id, c.board_id FROM columns c JOIN boards b ON b.id = c.board_id "
                    "WHERE c.id = $1 AND b.user_id = $2",
                    uuid.UUID(column_id), uuid.UUID(user_id),
                )
                if not col:
                    return
                last_col = await conn.fetchrow(
                    "SELECT id FROM columns WHERE board_id = $1 ORDER BY position DESC LIMIT 1",
                    col["board_id"],
                )
                is_last = last_col and last_col["id"] == uuid.UUID(column_id)
                if is_last:
                    row = await conn.fetchrow(
                        f"""UPDATE todos SET column_id = $2, board_id = $3, position = $4,
                            completed = true, due_date = CURRENT_DATE
                            WHERE id = $1 AND user_id = $5
                            RETURNING {TODO_COLS}""",
                        uuid.UUID(todo_id), uuid.UUID(column_id), col["board_id"],
                        position, uuid.UUID(user_id),
                    )
                else:
                    row = await conn.fetchrow(
                        f"""UPDATE todos SET column_id = $2, board_id = $3, position = $4,
                            completed = false
                            WHERE id = $1 AND user_id = $5
                            RETURNING {TODO_COLS}""",
                        uuid.UUID(todo_id), uuid.UUID(column_id), col["board_id"],
                        position, uuid.UUID(user_id),
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
