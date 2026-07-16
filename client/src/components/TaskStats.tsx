"use client";

import { useAppSelector } from "@/store";

// Tiny inline skeleton chip
const Chip = () => (
  <span className="inline-block w-8 h-6 animate-pulse bg-slate-700/50 rounded-lg align-middle" />
);

export default function TaskStats() {
  const isLoading = useAppSelector((s) => s.todos.isLoading);
  const todos = useAppSelector((s) => s.todos.todos);

  const myTasks = todos.filter((t) => t.boardId === null && !t.archived);
  const total = myTasks.length;
  const completed = myTasks.filter((t) => t.completed).length;
  const active = total - completed;
  const important = myTasks.filter((t) => t.important).length;
  const highPriority = myTasks.filter((t) => t.priority === "high" && !t.completed).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueToday = myTasks.filter((t) => t.dueDate === todayStr && !t.completed).length;
  const overdue = myTasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    return t.dueDate < todayStr;
  }).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: "Today",
      value: dueToday,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      label: "Active",
      value: active,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      label: "Done",
      value: completed,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Important",
      value: important,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards — structure always visible, only numbers skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border ${s.border} rounded-2xl px-4 py-4 flex flex-col gap-2`}
          >
            <div className={`${s.color} opacity-80`}>{s.icon}</div>
            <div>
              <div className="h-8 flex items-center">
                {isLoading
                  ? <Chip />
                  : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar — always visible, skeleton on fill + text */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl px-5 py-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 font-medium">Completion</span>
          {isLoading
            ? <Chip />
            : <span className="text-slate-200 font-semibold">{progress}%</span>}
        </div>
        <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
          {isLoading
            ? <div className="h-full w-1/3 animate-pulse bg-slate-600/60 rounded-full" />
            : <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          {isLoading
            ? <span className="inline-block w-36 h-3 animate-pulse bg-slate-700/50 rounded" />
            : <span>{completed} of {total} tasks completed</span>}
          {!isLoading && (
            <div className="flex items-center gap-3">
              {highPriority > 0 && <span className="text-red-400 font-medium">↑ {highPriority} high</span>}
              {overdue > 0 && <span className="text-orange-400 font-medium">⚠ {overdue} overdue</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
