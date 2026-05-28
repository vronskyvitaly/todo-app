# TodoList — Real-time Todo App

Full-stack todo application with real-time sync via WebSocket, user authentication, and PostgreSQL persistence.

**Live:** https://todo.vronskyvitaly.ru

---

## Features

- Real-time sync across browser tabs via WebSocket
- JWT authentication (register / login)
- Create, edit, delete, and toggle tasks
- Priority levels: Low, Normal, High
- Mark tasks as Important
- Due dates with overdue highlighting
- Tags (comma-separated)
- Filter by: All, Active, Completed, Important
- Clear completed tasks in one click
- Persisted in PostgreSQL per user

---

## Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Client   | Next.js 14, Redux Toolkit, React Hook Form, Zod, Tailwind CSS |
| Server   | FastAPI, asyncpg, python-jose, bcrypt                   |
| Database | PostgreSQL                                              |
| Deploy   | Docker, Coolify, Traefik                                |

---

## WebSocket Protocol

```
Client → Server                               Server → Client (broadcast)
──────────────────────────────────────────    ────────────────────────────
{ type: "GET_TODOS" }                   →     { type: "TODOS_LIST",   payload: Todo[]  }
{ type: "CREATE_TODO", payload: {...} } →     { type: "TODO_CREATED", payload: Todo    }
{ type: "UPDATE_TODO", payload: {...} } →     { type: "TODO_UPDATED", payload: Todo    }
{ type: "DELETE_TODO", payload: {id} }  →     { type: "TODO_DELETED", payload: {id}    }
{ type: "TOGGLE_TODO", payload: {id} }  →     { type: "TODO_UPDATED", payload: Todo    }
```

### Todo object

```ts
{
  id:          string
  title:       string
  description: string
  completed:   boolean
  important:   boolean
  priority:    "low" | "normal" | "high"
  dueDate:     string | null   // ISO date, e.g. "2025-06-01"
  tags:        string[]
  createdAt:   string          // ISO datetime
}
```

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL running on `localhost:5432`

### Server

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todolist python main.py
```

### Client

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000

### Environment variables

| Variable       | Where  | Description                            | Default                                          |
|----------------|--------|----------------------------------------|--------------------------------------------------|
| `DATABASE_URL` | server | PostgreSQL connection string           | `postgresql://postgres:postgres@localhost:5432/todolist` |
| `SECRET_KEY`   | server | JWT signing secret                     | `change-me-in-production-super-secret-key`       |

---

## Docker

```bash
# Server
docker build -t todolist-server ./server

# Client
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com/ws \
  -t todolist-client ./client
```
