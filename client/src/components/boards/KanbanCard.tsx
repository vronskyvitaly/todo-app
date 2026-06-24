"use client";

import { Todo } from "@/types/todo";
import { useAppDispatch } from "@/store";
import { setEditingId } from "@/store/todosSlice";
import { WS_SEND } from "@/store/wsMiddleware";
import { useDraggable } from "@dnd-kit/core";

interface Props {
  todo: Todo;
  isOverlay?: boolean;
}

export default function KanbanCard({ todo, isOverlay = false }: Props) {
  const dispatch = useAppDispatch();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: todo.id,
    disabled: isOverlay,
  });

  const handleEdit = () => dispatch(setEditingId(todo.id));

  const handleDelete = () => {
    if (confirm(`Delete "${todo.title}"?`)) {
      dispatch({
        type: WS_SEND,
        payload: { type: "DELETE_TODO", payload: { id: todo.id } },
      });
    }
  };

  const handleToggle = () => {
    dispatch({
      type: WS_SEND,
      payload: { type: "TOGGLE_TODO", payload: { id: todo.id } },
    });
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group rounded-xl px-2 py-1.5 select-none
        ${todo.important && !todo.completed
          ? "bg-amber-500/[0.04] border border-amber-500/30 border-l-[3px] border-l-amber-400"
          : "bg-slate-800/60 border border-slate-700/50"
        }
        ${isOverlay
          ? "cursor-grabbing rotate-1 shadow-2xl scale-105 opacity-90"
          : "cursor-grab active:cursor-grabbing transition-all duration-150 hover:border-slate-600/60"
        }
        ${isDragging ? "opacity-30 scale-95" : ""}`}
    >
      {/* Top row: toggle + title + actions */}
      <div className="flex items-start gap-2">
        <button
          onClick={handleToggle}
          aria-label="Toggle complete"
          className={`mt-0.5 flex-shrink-0 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center transition-colors
            ${todo.completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-slate-600 hover:border-indigo-400"
            }`}
        >
          {todo.completed && (
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <p className={`flex-1 min-w-0 text-[11px] font-medium leading-snug break-anywhere
          ${todo.completed ? "line-through text-slate-500" : "text-slate-100"}`}>
          {todo.title}
        </p>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={handleEdit} aria-label="Edit"
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={handleDelete} aria-label="Delete"
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom row: description + meta (only if present) */}
      {(todo.description || todo.dueDate || (todo.tags?.length ?? 0) > 0 || todo.important || todo.priority !== "normal" || (todo.recurringDays?.length ?? 0) > 0) && (
        <div className="mt-1 ml-5 flex items-center gap-1 flex-wrap">
          {todo.description && (
            <span className="text-[10px] text-slate-500 w-full break-anywhere">{todo.description}</span>
          )}
          {todo.important && (
            <svg className="w-3 h-3 text-amber-400 flex-shrink-0 drop-shadow-[0_0_3px_rgba(251,191,36,0.7)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          {todo.priority !== "normal" && (
            <span className={`text-[10px] font-medium px-1 rounded ${
              todo.priority === "high" ? "text-red-400" : "text-slate-500"
            }`}>
              {todo.priority === "high" ? "↑" : "↓"}
            </span>
          )}
          {todo.dueDate && (
            <span className={`text-[10px] ${
              !todo.completed && todo.dueDate < new Date().toISOString().slice(0, 10)
                ? "text-red-400" : "text-slate-500"
            }`}>
              {new Date(todo.dueDate + "T00:00:00").toLocaleDateString("ru-RU")}
            </span>
          )}
          {(todo.recurringDays?.length ?? 0) > 0 && (
            <button onClick={handleEdit} className="flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {todo.recurringTime} · {[...(todo.recurringDays ?? [])].sort().map(d => ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][d]).join(", ")}
            </button>
          )}
          {(todo.tags ?? []).map((tag) => (
            <span key={tag} className="text-[10px] bg-indigo-500/15 text-indigo-400 px-1 rounded">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
