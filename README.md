# TodoList

A real-time task manager with Kanban boards, built with Next.js and FastAPI. All state syncs instantly across browser tabs via WebSocket — no polling, no page refreshes.

**Live demo:** https://todo.vronskyvitaly.ru

---

## Features

**My Tasks**
- Create tasks with title, description, priority (low / normal / high), due date, tags, and importance flag
- Filter by All / Active / Completed / Important
- Analytics dashboard — completion rate, overdue count, high-priority count
- Real-time sync across tabs

**Kanban Boards**
- Create boards with name and description
- Drag & drop cards between columns via @dnd-kit
- Drag & drop columns to reorder them
- Click any column to instantly add a card inline
- Add, rename, and delete columns; rename and delete boards

**Board Notes**
- Each board has a dedicated Notes page (`/boards/:id/notes`)
- Full-screen textarea with auto-save (debounced 1.5s + on blur)
- Share notes publicly via a link — accessible without login (`/share/:id`)

**Push Notifications**
- Web Push API — works on iOS Safari after adding to Home Screen
- Per-task reminders: one-time or recurring (select days of week + time)
- Bell icon in navbar to subscribe/unsubscribe
- Server-side scheduler checks every 30 seconds via APScheduler + pywebpush

**General**
- JWT authentication — register and login
- All data persisted in PostgreSQL per user account
- Skeleton loaders on initial data fetch, no layout shift on reload
- Mobile-first: no zoom on input focus, fixed header, responsive layout

---

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router), Redux Toolkit, Tailwind CSS, @dnd-kit/core + @dnd-kit/sortable |
| Backend  | FastAPI, asyncpg, python-jose, bcrypt, APScheduler, pywebpush |
| Database | PostgreSQL |
| Deploy   | Docker, Coolify, Traefik |

---

## Local Development

**Prerequisites:** Node.js 20+, Python 3.12+, PostgreSQL

### 1. Database

```bash
brew services start postgresql@15   # macOS
createdb todolist
```

### 2. Server

```bash
cd server
pip3 install -r requirements.txt
DATABASE_URL="postgresql://$(whoami)@localhost:5432/todolist" python3 main.py
# → http://localhost:8000
```

Tables are created automatically on first startup.

### 3. Client

```bash
cd client
npm install
npm run dev
# → http://localhost:3000
```

### Environment variables

| Variable       | Service | Default |
|----------------|---------|---------|
| `DATABASE_URL` | server  | `postgresql://postgres:postgres@localhost:5432/todolist` |
| `SECRET_KEY`   | server  | `change-me-in-production-super-secret-key` |

---

## Docker

```bash
# Server
docker build -t todolist-server ./server

# Client
docker build -t todolist-client ./client
```

---

## Architecture

Every data operation goes through a single persistent WebSocket (`/ws?token=JWT`). HTTP is only used for `/api/register`, `/api/login`, and the public `/api/notes/:id` endpoint. The server broadcasts updates to **all open connections** for a user, so multiple tabs stay in sync automatically.

```
Browser tab 1 ──┐                          ┌── Browser tab 2
                 ├── WebSocket /ws?token ───┤
                 │                          │
             FastAPI server
                 │
             PostgreSQL
```

The Next.js client uses a custom Redux middleware (`wsMiddleware`) that owns the WebSocket singleton, translates outgoing Redux actions into WS messages, and dispatches Redux actions for incoming messages.

**WebSocket protocol**

```
Client → Server                                Server → Client
──────────────────────────────────────         ────────────────────────────────────────
{ type: "CREATE_TODO",   payload: {...} }  →   { type: "TODO_CREATED",    payload: Todo      }
{ type: "UPDATE_TODO",   payload: {...} }  →   { type: "TODO_UPDATED",    payload: Todo      }
{ type: "DELETE_TODO",   payload: {id}  }  →   { type: "TODO_DELETED",    payload: {id}      }
{ type: "TOGGLE_TODO",   payload: {id}  }  →   { type: "TODO_UPDATED",    payload: Todo      }
{ type: "MOVE_CARD",     payload: {...} }  →   { type: "TODO_UPDATED",    payload: Todo      }
{ type: "CREATE_BOARD",  payload: {...} }  →   { type: "BOARD_CREATED",   payload: {board, columns} }
{ type: "UPDATE_BOARD",  payload: {...} }  →   { type: "BOARD_UPDATED",   payload: Board     }
{ type: "DELETE_BOARD",  payload: {id}  }  →   { type: "BOARD_DELETED",   payload: {id}      }
{ type: "CREATE_COLUMN", payload: {...} }  →   { type: "COLUMN_CREATED",  payload: Column    }
{ type: "UPDATE_COLUMN", payload: {...} }  →   { type: "COLUMN_UPDATED",  payload: Column    }
{ type: "DELETE_COLUMN", payload: {id}  }  →   { type: "COLUMN_DELETED",  payload: {id}      }
```

On connect the server immediately sends `TODOS_LIST` + `BOARDS_DATA` to hydrate the client.
