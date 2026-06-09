"use client";

import { useAppSelector } from "@/store";

export default function ConnectionStatus() {
  const connected = useAppSelector((s) => s.todos.connected);
  const isLoading = useAppSelector((s) => s.todos.isLoading);
  const error = useAppSelector((s) => s.todos.error);

  // connecting = socket opened but data not yet received
  const isConnecting = !connected && isLoading;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-300 shadow-sm
          ${connected ? "bg-emerald-400" : isConnecting ? "bg-amber-400 animate-pulse" : "bg-red-400"}`}
      />
      <span className="text-sm text-slate-400">
        {connected ? "Connected" : isConnecting ? "Connecting…" : "Disconnected"}
      </span>
      {error && !isConnecting && (
        <span className="ml-2 text-xs text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full">
          {error}
        </span>
      )}
    </div>
  );
}
