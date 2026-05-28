"use client";

import { Todo } from "@/types/todo";
import { useAppDispatch, useAppSelector } from "@/store";
import { setEditingId } from "@/store/todosSlice";
import { WS_SEND } from "@/store/wsMiddleware";

interface Props {
  todo: Todo;
}

export default function TodoItem({ todo }: Props) {
  const dispatch = useAppDispatch();
  const connected = useAppSelector((s) => s.todos.connected);

  const toggle = () =>
    dispatch({
      type: WS_SEND,
      payload: { type: "TOGGLE_TODO", payload: { id: todo.id } },
    });

  const remove = () =>
    dispatch({
      type: WS_SEND,
      payload: { type: "DELETE_TODO", payload: { id: todo.id } },
    });

  const edit = () => dispatch(setEditingId(todo.id));

  return (
    <div
      className={`group flex items-start gap-4 rounded-xl border px-5 py-4 transition-all duration-200 animate-fade-in
        ${
          todo.completed
            ? "bg-slate-800/30 border-slate-700/30 opacity-60"
            : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60"
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={toggle}
        disabled={!connected}
        aria-label="Toggle complete"
        className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors
          disabled:cursor-not-allowed
          ${
            todo.completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-slate-600 hover:border-indigo-400"
          }`}
      >
        {todo.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`font-medium text-sm leading-snug break-words ${
              todo.completed ? "line-through text-slate-500" : "text-slate-100"
            }`}
          >
            {todo.title}
          </p>
          {todo.important && (
            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          {todo.priority !== "normal" && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
              todo.priority === "high"
                ? "bg-red-500/20 text-red-400"
                : "bg-slate-700/60 text-slate-400"
            }`}>
              {todo.priority === "high" ? "↑ High" : "↓ Low"}
            </span>
          )}
        </div>
        {todo.description && (
          <p className="mt-1 text-xs text-slate-400 break-words leading-relaxed">
            {todo.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {todo.dueDate && (
            <span className={`text-xs ${
              !todo.completed && todo.dueDate < new Date().toISOString().slice(0, 10)
                ? "text-red-400"
                : "text-slate-500"
            }`}>
              Due {todo.dueDate}
            </span>
          )}
          {todo.tags.map((tag) => (
            <span key={tag} className="text-xs bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-600">
          {new Date(todo.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={edit}
          disabled={!connected}
          aria-label="Edit task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 transition-colors disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={remove}
          disabled={!connected}
          aria-label="Delete task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
