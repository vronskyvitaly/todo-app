"use client";

import { useState } from "react";
import { Board, Column, Todo } from "@/types/todo";
import { useAppDispatch } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";
import KanbanColumn from "./KanbanColumn";

interface Props {
  board: Board;
  columns: Column[];
  todos: Todo[];
}

export default function KanbanBoard({ board, columns, todos }: Props) {
  const dispatch = useAppDispatch();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDrop = (columnId: string, position: number) => {
    if (!draggingId) return;
    dispatch({
      type: WS_SEND,
      payload: {
        type: "MOVE_CARD",
        payload: { id: draggingId, columnId, position },
      },
    });
    setDraggingId(null);
  };

  const handleDragEnd = () => setDraggingId(null);

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newColumnName.trim();
    if (!name) return;
    dispatch({
      type: WS_SEND,
      payload: {
        type: "CREATE_COLUMN",
        payload: { boardId: board.id, name, position: columns.length },
      },
    });
    setNewColumnName("");
    setAddingColumn(false);
  };

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <>
      <div
        onDragEnd={handleDragEnd}
        className="flex gap-4 h-full items-start"
      >
        {sortedColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            todos={todos.filter((t) => t.columnId === col.id)}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onTouchDragEnd={handleDragEnd}
          />
        ))}

        {/* Add column button — always visible at end of scroll */}
        <div className="flex-shrink-0 w-72">
          <button
            onClick={() => setAddingColumn(true)}
            className="w-full flex items-center gap-2 bg-slate-800/30 border border-dashed border-slate-700/50
              hover:border-indigo-500/50 hover:bg-slate-800/50 rounded-2xl px-4 py-3 text-sm text-slate-500
              hover:text-slate-300 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add column
          </button>
        </div>
      </div>

      {/* Add column modal — fixed, never clipped by scroll */}
      {addingColumn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setAddingColumn(false); setNewColumnName(""); }}
        >
          <div
            className="w-full max-w-sm bg-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-200">New Column</h2>
              <button
                onClick={() => { setAddingColumn(false); setNewColumnName(""); }}
                className="text-slate-400 hover:text-slate-200 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                autoFocus
                placeholder="Column name…"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2.5 text-slate-100
                  placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAddingColumn(false); setNewColumnName(""); }}
                  className="flex-1 rounded-xl border border-slate-700/60 text-slate-300 hover:bg-slate-700/50
                    py-2.5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white
                    py-2.5 text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
