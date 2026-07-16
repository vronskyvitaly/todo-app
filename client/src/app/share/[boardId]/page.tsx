"use client";

import { useEffect, useState } from "react";

interface Props {
  params: { boardId: string };
}

function getApiBase() {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return isLocal ? "http://localhost:8000" : `https://api.${host.split(".").slice(1).join(".")}`;
}

export default function ShareNotesPage({ params }: Props) {
  const { boardId } = params;
  const [data, setData] = useState<{ name: string; notes: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/api/notes/${boardId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [boardId]);

  return (
    <main className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs text-slate-500 uppercase tracking-widest">Project Notes</span>
          </div>
          {error ? (
            <p className="text-slate-400">Notes not found or access is restricted.</p>
          ) : !data ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-8 bg-slate-700/40 rounded-lg w-1/2" />
              <div className="h-4 bg-slate-700/40 rounded w-3/4" />
              <div className="h-4 bg-slate-700/40 rounded w-2/3" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-100 mb-6">{data.name}</h1>
              {data.notes ? (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {data.notes}
                </div>
              ) : (
                <p className="text-slate-600 italic">No notes added yet.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-800/60">
          <p className="text-xs text-slate-600">
            Made with{" "}
            <a href="/" className="text-indigo-500 hover:text-indigo-400 transition-colors">
              Todo App
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}
