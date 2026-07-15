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
  { label: "Archived", value: "archived" },
];

export default function TodoFilters() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.todos.filter);
  const todos = useAppSelector((s) => s.todos.todos);
  const connected = useAppSelector((s) => s.todos.connected);

  const myTasks = todos.filter((t) => t.boardId === null);
  const completedCount = myTasks.filter((t) => t.completed && !t.archived).length;

  const clearCompleted = () => {
    myTasks
      .filter((t) => t.completed && !t.archived)
      .forEach((t) =>
        dispatch({ type: WS_SEND, payload: { type: "DELETE_TODO", payload: { id: t.id } } })
      );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 min-w-max sm:min-w-0">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => dispatch(setFilter(value))}
              className={`flex-1 min-w-[4.5rem] px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {completedCount > 0 && connected && (
        <button
          onClick={clearCompleted}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Clear completed
        </button>
      )}
    </div>
  );
}
