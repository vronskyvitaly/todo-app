"use client";

import { useState, useRef } from "react";
import { Column, Todo } from "@/types/todo";
import { useAppDispatch } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";
import KanbanCard from "./KanbanCard";

interface Props {
  column: Column;
  todos: Todo[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (columnId: string, position: number) => void;
}

export default function KanbanColumn({ column, todos, draggingId, onDragStart, onDrop }: Props) {
  const dispatch = useAppDispatch();
  const [isOver, setIsOver] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };
  const handleDragLeave = () => setIsOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    onDrop(column.id, todos.length);
  };

  const openAddCard = () => {
    setAddingCard(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newCardTitle.trim();
    if (!title) { setAddingCard(false); return; }
    dispatch({
      type: WS_SEND,
      payload: {
        type: "CREATE_TODO",
        payload: { title, boardId: column.boardId, columnId: column.id, position: todos.length },
      },
    });
    setNewCardTitle("");
    setAddingCard(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setNewCardTitle(""); setAddingCard(false); }
  };

  const handleRenameColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const name = columnName.trim();
    if (!name) return;
    dispatch({ type: WS_SEND, payload: { type: "UPDATE_COLUMN", payload: { id: column.id, name } } });
    setEditingName(false);
  };

  const handleDeleteColumn = () => {
    if (confirm(`Delete column "${column.name}"?`)) {
      dispatch({ type: WS_SEND, payload: { type: "DELETE_COLUMN", payload: { id: column.id } } });
    }
  };

  const sorted = [...todos].sort((a, b) => a.position - b.position);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 w-72 flex flex-col rounded-2xl bg-slate-800/40 border transition-colors duration-150 self-stretch
        ${isOver ? "border-indigo-500/60 bg-slate-700/40" : "border-slate-700/30"}`}
    >
      {/* Header */}
      <div className="group flex items-center justify-between px-4 pt-4 pb-2">
        {editingName ? (
          <form onSubmit={handleRenameColumn} className="flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              autoFocus
              onBlur={() => { setColumnName(column.name); setEditingName(false); }}
              className="w-full rounded-lg bg-slate-900/70 border border-slate-600 px-2 py-1 text-sm text-slate-100
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        ) : (
          <>
            <button
              onClick={() => { setColumnName(column.name); setEditingName(true); }}
              className="font-semibold text-slate-200 text-sm hover:text-indigo-400 transition-colors text-left"
            >
              {column.name}
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded-md">
                {todos.length}
              </span>
              <button
                onClick={handleDeleteColumn}
                aria-label="Delete column"
                className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-slate-700/50 transition-colors
                  opacity-0 group-hover:opacity-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cards + clickable empty area */}
      <div
        className="flex-1 px-3 pb-2 space-y-2 min-h-[4rem] cursor-pointer"
        onClick={(e) => {
          // Only trigger if clicking the area itself, not a card
          if (e.target === e.currentTarget) openAddCard();
        }}
      >
        {sorted.map((todo) => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            onDragStart={onDragStart}
            dragging={draggingId === todo.id}
          />
        ))}
      </div>

      {/* Inline add card form / button */}
      <div className="px-3 pb-3">
        {addingCard ? (
          <form onSubmit={handleAddCard} className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!newCardTitle.trim()) setAddingCard(false); }}
              placeholder="Card title…"
              className="w-full rounded-xl bg-slate-900/80 border border-indigo-500/50 px-3 py-2 text-sm text-slate-100
                placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-1.5 transition-colors"
              >
                Add card
              </button>
              <button
                type="button"
                onMouseDown={() => { setAddingCard(false); setNewCardTitle(""); }}
                className="px-3 rounded-xl border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                Esc
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={openAddCard}
            className="w-full flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300
              hover:bg-slate-700/40 rounded-xl px-3 py-2 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add card
          </button>
        )}
      </div>
    </div>
  );
}
