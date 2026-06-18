"use client";

import { useState } from "react";
import { Board, Column, Todo } from "@/types/todo";
import { useAppDispatch } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

interface Props {
  board: Board;
  columns: Column[];
  todos: Todo[];
}

export default function KanbanBoard({ board, columns, todos }: Props) {
  const dispatch = useAppDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const activeTodo = todos.find((t) => t.id === activeId) ?? null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const columnId = over.id as string;
    const position = (over.data.current?.count ?? 0) as number;
    dispatch({
      type: WS_SEND,
      payload: { type: "MOVE_CARD", payload: { id: active.id as string, columnId, position } },
    });
  };

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full items-start">
        {sortedColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            todos={todos.filter((t) => t.columnId === col.id)}
          />
        ))}

        {/* Add column button — always visible at end of scroll */}
        <div className="flex-shrink-0 w-[78vw] sm:w-72">
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

      {/* Ghost card that follows the pointer */}
      <DragOverlay dropAnimation={null}>
        {activeTodo ? <KanbanCard todo={activeTodo} isOverlay /> : null}
      </DragOverlay>

      {/* Add column modal — fixed, never clipped by scroll */}
      {addingColumn && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setAddingColumn(false); setNewColumnName(""); }}
        >
          <div
            className="w-full sm:max-w-sm bg-slate-800 border border-slate-700/60 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl sm:mx-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile bottom sheet */}
            <div className="sm:hidden w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
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
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700/60 px-4 py-2.5 text-base text-slate-100
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
    </DndContext>
  );
}
