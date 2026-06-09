import { Middleware } from "@reduxjs/toolkit";
import { addTodo, removeTodo, setConnected, setError, setTodos, updateTodo } from "./todosSlice";
import {
  setBoards,
  setColumns,
  addBoard,
  updateBoard,
  removeBoard,
  addColumn,
  updateColumn,
  removeColumn,
} from "./boardsSlice";
import type { Board, Column, Todo, WsMessage } from "@/types/todo";

export const WS_CONNECT = "ws/connect";
export const WS_DISCONNECT = "ws/disconnect";
export const WS_SEND = "ws/send";

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;      // starts at 1s, doubles each attempt, caps at 30s
let shouldReconnect = false;
let lastToken = "";

function clearReconnect() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function buildUrl(token: string): string {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const apiHost = isLocal
    ? "localhost:8000"
    : `api.${host.split(".").slice(1).join(".")}`;
  const proto = isLocal ? "ws" : "wss";
  const base = `${proto}://${apiHost}/ws`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export const wsMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const act = action as { type: string; payload?: unknown };

  if (act.type === WS_CONNECT) {
    clearReconnect();

    const payload = act.payload as { token?: string } | undefined;
    const token = payload?.token ?? lastToken;
    lastToken = token;
    shouldReconnect = true;

    if (socket) {
      socket.onclose = null; // prevent reconnect loop while closing old socket
      socket.close();
    }

    socket = new WebSocket(buildUrl(token));

    socket.onopen = () => {
      reconnectDelay = 1000; // reset backoff on success
      store.dispatch(setConnected(true));
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        switch (msg.type) {
          case "TODOS_LIST":
            store.dispatch(setTodos(msg.payload as Todo[]));
            break;
          case "TODO_CREATED":
            store.dispatch(addTodo(msg.payload as Todo));
            break;
          case "TODO_UPDATED":
            store.dispatch(updateTodo(msg.payload as Todo));
            break;
          case "TODO_DELETED":
            store.dispatch(removeTodo((msg.payload as { id: string }).id));
            break;
          case "BOARDS_DATA": {
            const p = msg.payload as { boards: Board[]; columns: Column[] };
            store.dispatch(setBoards(p.boards));
            store.dispatch(setColumns(p.columns));
            break;
          }
          case "BOARD_CREATED": {
            const p = msg.payload as { board: Board; columns: Column[] };
            store.dispatch(addBoard(p.board));
            p.columns.forEach((c) => store.dispatch(addColumn(c)));
            break;
          }
          case "BOARD_UPDATED":
            store.dispatch(updateBoard(msg.payload as Board));
            break;
          case "BOARD_DELETED":
            store.dispatch(removeBoard((msg.payload as { id: string }).id));
            break;
          case "COLUMN_CREATED":
            store.dispatch(addColumn(msg.payload as Column));
            break;
          case "COLUMN_UPDATED":
            store.dispatch(updateColumn(msg.payload as Column));
            break;
          case "COLUMN_DELETED":
            store.dispatch(removeColumn((msg.payload as { id: string }).id));
            break;
          case "ERROR":
            store.dispatch(setError((msg.payload as { message: string }).message));
            break;
        }
      } catch {
        store.dispatch(setError("Failed to parse server message"));
      }
    };

    socket.onclose = () => {
      store.dispatch(setConnected(false));
      if (shouldReconnect && lastToken) {
        reconnectTimer = setTimeout(() => {
          store.dispatch({ type: WS_CONNECT, payload: { token: lastToken } });
        }, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      }
    };

    socket.onerror = () => {
      store.dispatch(setError("WebSocket connection error"));
      store.dispatch(setConnected(false));
    };
  }

  if (act.type === WS_DISCONNECT) {
    shouldReconnect = false;
    clearReconnect();
    if (socket) {
      socket.onclose = null; // don't trigger reconnect
      socket.close();
      socket = null;
    }
    store.dispatch(setConnected(false));
  }

  if (act.type === WS_SEND) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(act.payload));
    } else {
      store.dispatch(setError("Not connected to server"));
    }
  }

  return next(action);
};
