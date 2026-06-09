"use client";

import { useState } from "react";
import { useAppDispatch } from "@/store";
import { WS_SEND } from "@/store/wsMiddleware";

interface Props {
  boardId: string;
  position: number;
  onCancel: () => void;
}

export default function ColumnForm({ boardId, position, onCancel }: Props) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({
      type: WS_SEND,
      payload: {
        type: "CREATE_COLUMN",
        payload: { boardId, name: trimmed, position },
      },
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder="Column name..."
        className="flex-1 rounded-xl bg-slate-900/70 border border-slate-700/60 px-3 py-2 text-sm text-slate-100
          placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      />
      <button
        type="submit"
        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 rounded-xl border border-slate-700/60 text-slate-400 hover:text-slate-200 text-sm transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
