import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import todosReducer from "./todosSlice";
import authReducer from "./authSlice";
import boardsReducer from "./boardsSlice";
import { wsMiddleware } from "./wsMiddleware";

export const store = configureStore({
  reducer: {
    todos: todosReducer,
    auth: authReducer,
    boards: boardsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(wsMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
