import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FilterType, Todo } from "@/types/todo";

interface TodosState {
  todos: Todo[];
  filter: FilterType;
  connected: boolean;
  error: string | null;
  editingId: string | null;
  isLoading: boolean;
}

const initialState: TodosState = {
  todos: [],
  filter: "all",
  connected: false,
  error: null,
  editingId: null,
  isLoading: true,
};

const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setTodos(state, action: PayloadAction<Todo[]>) {
      state.todos = action.payload;
      state.isLoading = false;
    },
    addTodo(state, action: PayloadAction<Todo>) {
      state.todos.push(action.payload);
    },
    updateTodo(state, action: PayloadAction<Todo>) {
      const idx = state.todos.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.todos[idx] = action.payload;
    },
    removeTodo(state, action: PayloadAction<string>) {
      state.todos = state.todos.filter((t) => t.id !== action.payload);
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
      if (action.payload) state.error = null;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setFilter(state, action: PayloadAction<FilterType>) {
      state.filter = action.payload;
    },
    setEditingId(state, action: PayloadAction<string | null>) {
      state.editingId = action.payload;
    },
  },
});

export const {
  setTodos,
  addTodo,
  updateTodo,
  removeTodo,
  setConnected,
  setError,
  setFilter,
  setEditingId,
} = todosSlice.actions;

export default todosSlice.reducer;
