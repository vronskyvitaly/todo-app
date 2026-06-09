"use client";

import { useRef, useEffect } from "react";
import { Todo } from "@/types/todo";
import { useAppDispatch } from "@/store";
import { setEditingId } from "@/store/todosSlice";
import { WS_SEND } from "@/store/wsMiddleware";

interface Props {
  todo: Todo;
  onDragStart: (id: string) => void;
  onTouchDragEnd: () => void;
  dragging: boolean;
}

export default function KanbanCard({ todo, onDragStart, onTouchDragEnd, dragging }: Props) {
  const dispatch = useAppDispatch();
  const cardRef = useRef<HTMLDivElement>(null);

  // Always-fresh ref so event listeners (attached once) see latest props/dispatch
  const cbRef = useRef({ onDragStart, onTouchDragEnd, dispatch, todoId: todo.id });
  cbRef.current = { onDragStart, onTouchDragEnd, dispatch, todoId: todo.id };

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    let ghost: HTMLDivElement | null = null;
    let lastCol: Element | null = null;
    let touchStart = { x: 0, y: 0 };
    let touchOffset = { x: 0, y: 0 };
    let hasMoved = false;

    const cleanup = () => {
      if (ghost) { document.body.removeChild(ghost); ghost = null; }
      lastCol?.classList.remove("touch-drag-over");
      lastCol = null;
      hasMoved = false;
      cbRef.current.onTouchDragEnd();
    };

    const onTouchStart = (e: TouchEvent) => {
      // Don't hijack taps on interactive buttons
      if ((e.target as HTMLElement).closest("button")) return;
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect();
      touchStart = { x: touch.clientX, y: touch.clientY };
      touchOffset = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      hasMoved = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;

      // Wait until finger has moved ≥8px before starting drag (allow taps)
      if (!hasMoved && Math.sqrt(dx * dx + dy * dy) < 8) return;

      e.preventDefault(); // block page scroll while dragging

      if (!hasMoved) {
        hasMoved = true;
        cbRef.current.onDragStart(cbRef.current.todoId);

        // Create visual ghost that follows the finger
        const rect = el.getBoundingClientRect();
        ghost = el.cloneNode(true) as HTMLDivElement;
        Object.assign(ghost.style, {
          position: "fixed",
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          pointerEvents: "none",
          zIndex: "9999",
          opacity: "0.85",
          transform: "scale(1.05) rotate(1.5deg)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          transition: "none",
          borderRadius: "0.75rem",
        });
        document.body.appendChild(ghost);
      }

      // Move ghost to finger position
      if (ghost) {
        ghost.style.left = `${touch.clientX - touchOffset.x}px`;
        ghost.style.top = `${touch.clientY - touchOffset.y}px`;
      }

      // Detect which column is under the finger
      if (ghost) ghost.style.visibility = "hidden";
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (ghost) ghost.style.visibility = "";

      const col = target?.closest("[data-column-id]") ?? null;
      if (col !== lastCol) {
        lastCol?.classList.remove("touch-drag-over");
        col?.classList.add("touch-drag-over");
        lastCol = col;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!hasMoved) return; // pure tap — let click events fire normally

      const touch = e.changedTouches[0];

      // Remove ghost and highlight before hit-test
      if (ghost) { document.body.removeChild(ghost); ghost = null; }
      lastCol?.classList.remove("touch-drag-over");
      lastCol = null;

      cbRef.current.onTouchDragEnd(); // clears draggingId in Board

      // Find column under finger
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const colEl = target?.closest("[data-column-id]");
      if (colEl) {
        const columnId = colEl.getAttribute("data-column-id")!;
        const count = parseInt(colEl.getAttribute("data-column-count") || "0");
        cbRef.current.dispatch({
          type: WS_SEND,
          payload: { type: "MOVE_CARD", payload: { id: cbRef.current.todoId, columnId, position: count } },
        });
      }

      hasMoved = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", cleanup, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", cleanup);
    };
  }, []);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(todo.id);
  };

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
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      className={`group bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-150 hover:border-slate-600/60
        ${dragging ? "opacity-40 scale-95" : ""}`}
    >
      <div className="flex items-start gap-2">
        {/* Toggle */}
        <button
          onClick={handleToggle}
          aria-label="Toggle complete"
          className={`mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors
            ${todo.completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-slate-600 hover:border-indigo-400"
            }`}
        >
          {todo.completed && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`text-sm font-medium leading-snug break-words ${todo.completed ? "line-through text-slate-500" : "text-slate-100"}`}>
              {todo.title}
            </p>
            {todo.important && (
              <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
            {todo.priority !== "normal" && (
              <span className={`text-xs font-medium px-1 py-0.5 rounded-md ${
                todo.priority === "high" ? "bg-red-500/20 text-red-400" : "bg-slate-700/60 text-slate-400"
              }`}>
                {todo.priority === "high" ? "↑" : "↓"}
              </span>
            )}
          </div>
          {todo.description && (
            <p className="mt-0.5 text-xs text-slate-400 break-words leading-relaxed line-clamp-2">{todo.description}</p>
          )}
          {(todo.dueDate || todo.tags.length > 0) && (
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {todo.dueDate && (
                <span className={`text-xs ${
                  !todo.completed && todo.dueDate < new Date().toISOString().slice(0, 10)
                    ? "text-red-400" : "text-slate-500"
                }`}>
                  {todo.dueDate}
                </span>
              )}
              {todo.tags.map((tag) => (
                <span key={tag} className="text-xs bg-indigo-500/15 text-indigo-400 px-1 py-0.5 rounded-md">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={handleEdit}
            aria-label="Edit"
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            aria-label="Delete"
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
