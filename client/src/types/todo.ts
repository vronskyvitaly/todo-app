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
  boardId: string | null;
  columnId: string | null;
  position: number;
  reminderAt: string | null;
  reminderSent: boolean;
  recurringDays: number[];
  recurringTime: string;
  recurringCount: number;
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
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
  | "GET_BOARDS"
  | "CREATE_BOARD"
  | "UPDATE_BOARD"
  | "DELETE_BOARD"
  | "CREATE_COLUMN"
  | "UPDATE_COLUMN"
  | "DELETE_COLUMN"
  | "MOVE_CARD"
  | "BOARDS_DATA"
  | "BOARD_CREATED"
  | "BOARD_UPDATED"
  | "BOARD_DELETED"
  | "COLUMN_CREATED"
  | "COLUMN_UPDATED"
  | "COLUMN_DELETED"
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
