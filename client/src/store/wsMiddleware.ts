import { Middleware } from "@reduxjs/toolkit";
import { addTodo, removeTodo, setConnected, setError, setTodos, updateTodo } from "./todosSlice";
import type { Todo, WsMessage } from "@/types/todo";

export const WS_CONNECT = "ws/connect";
export const WS_DISCONNECT = "ws/disconnect";
export const WS_SEND = "ws/send";

let socket: WebSocket | null = null;

export const wsMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const act = action as { type: string; payload?: unknown };

  if (act.type === WS_CONNECT) {
    if (socket) {
      socket.close();
    }

    const payload = act.payload as { token?: string } | undefined;
    const token = payload?.token ?? "";

    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    const apiHost = isLocal
      ? "localhost:8000"
      : `api.${host.split(".").slice(1).join(".")}`;
    const wsProto = isLocal ? "ws" : "wss";
    const baseUrl = `${wsProto}://${apiHost}/ws`;

    const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;

    socket = new WebSocket(url);

    socket.onopen = () => {
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
    };

    socket.onerror = () => {
      store.dispatch(setError("WebSocket connection error"));
      store.dispatch(setConnected(false));
    };
  }

  if (act.type === WS_DISCONNECT) {
    socket?.close();
    socket = null;
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
