"use client";

import { Board, Column } from "@/types/todo";
import { useAppDispatch } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";
import Link from "next/link";

interface Props {
  board: Board;
  columns: Column[];
  onEdit: (board: Board) => void;
}

export default function BoardCard({ board, columns, onEdit }: Props) {
  const dispatch = useAppDispatch();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm(`Delete board "${board.name}"? All columns will be removed.`)) {
      dispatch({
        type: WS_SEND,
        payload: { type: "DELETE_BOARD", payload: { id: board.id } },
      });
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit(board);
  };

  return (
    <Link href={`/boards/${board.id}`}>
      <div className="group relative bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-4 hover:border-slate-600/60 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-100 truncate">{board.name}</h3>
            {board.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{board.description}</p>
            )}
            <p className="text-xs text-slate-600 mt-2">
              {columns.length} {columns.length === 1 ? "column" : "columns"}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={handleEdit}
              aria-label="Edit board"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete board"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
