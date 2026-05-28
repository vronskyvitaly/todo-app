export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  important: boolean;
  dueDate: string | null;
  priority: "low" | "normal" | "high";
  tags: string[];
}

export type WsMessageType =
  | "GET_TODOS"
  | "CREATE_TODO"
  | "UPDATE_TODO"
  | "DELETE_TODO"
  | "TOGGLE_TODO"
  | "TODOS_LIST"
  | "TODO_CREATED"
  | "TODO_UPDATED"
  | "TODO_DELETED"
  | "ERROR";

export interface WsMessage {
  type: WsMessageType;
  payload?: unknown;
}

export type FilterType = "all" | "active" | "completed" | "important";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}
