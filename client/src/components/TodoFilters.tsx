"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { setFilter } from "@/store/todosSlice";
import { FilterType } from "@/types/todo";
import { WS_SEND } from "@/store/wsMiddleware";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Important", value: "important" },
];

export default function TodoFilters() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.todos.filter);
  const todos = useAppSelector((s) => s.todos.todos);
  const connected = useAppSelector((s) => s.todos.connected);

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  const clearCompleted = () => {
    todos
      .filter((t) => t.completed)
      .forEach((t) =>
        dispatch({ type: WS_SEND, payload: { type: "DELETE_TODO", payload: { id: t.id } } })
      );
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => dispatch(setFilter(value))}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === value
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span>
          <span className="text-slate-200 font-medium">{activeCount}</span> active
        </span>
        <span>
          <span className="text-slate-200 font-medium">{completedCount}</span> done
        </span>
        {completedCount > 0 && connected && (
          <button
            onClick={clearCompleted}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>
    </div>
  );
}
