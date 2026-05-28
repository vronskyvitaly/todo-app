"use client";

import { useAppSelector } from "@/store";

export default function ConnectionStatus() {
  const connected = useAppSelector((s) => s.todos.connected);
  const error = useAppSelector((s) => s.todos.error);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
          connected ? "bg-emerald-400" : "bg-red-400"
        } shadow-sm`}
      />
      <span className="text-sm text-slate-400">
        {connected ? "Connected" : "Disconnected"}
      </span>
      {error && (
        <span className="ml-2 text-xs text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full">
          {error}
        </span>
      )}
    </div>
  );
}
