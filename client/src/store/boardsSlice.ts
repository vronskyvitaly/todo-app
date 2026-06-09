import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Board, Column } from "@/types/todo";

interface BoardsState {
  boards: Board[];
  columns: Column[];
  isLoading: boolean;
}

const initialState: BoardsState = {
  boards: [],
  columns: [],
  isLoading: true,
};

const boardsSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    setBoards(state, action: PayloadAction<Board[]>) {
      state.boards = action.payload;
      state.isLoading = false;
    },
    setColumns(state, action: PayloadAction<Column[]>) {
      state.columns = action.payload;
    },
    addBoard(state, action: PayloadAction<Board>) {
      state.boards.push(action.payload);
    },
    updateBoard(state, action: PayloadAction<Board>) {
      const idx = state.boards.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) state.boards[idx] = action.payload;
    },
    removeBoard(state, action: PayloadAction<string>) {
      state.boards = state.boards.filter((b) => b.id !== action.payload);
      state.columns = state.columns.filter((c) => c.boardId !== action.payload);
    },
    addColumn(state, action: PayloadAction<Column>) {
      state.columns.push(action.payload);
    },
    updateColumn(state, action: PayloadAction<Column>) {
      const idx = state.columns.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.columns[idx] = action.payload;
    },
    removeColumn(state, action: PayloadAction<string>) {
      state.columns = state.columns.filter((c) => c.id !== action.payload);
    },
  },
});

export const {
  setBoards,
  setColumns,
  addBoard,
  updateBoard,
  removeBoard,
  addColumn,
  updateColumn,
  removeColumn,
} = boardsSlice.actions;

export default boardsSlice.reducer;
