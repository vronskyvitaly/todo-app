"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { WS_SEND } from "@/store/wsMiddleware";

interface Props {
  params: { boardId: string };
}

export default function BoardNotesPage({ params }: Props) {
  const { boardId } = params;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const board = useAppSelector((s) => s.boards.boards.find((b) => b.id === boardId));
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(board?.notes ?? "");
  }, [board?.notes]);

  const save = useCallback((text: string) => {
    if (!board) return;
    dispatch({
      type: WS_SEND,
      payload: { type: "UPDATE_BOARD", payload: { id: board.id, notes: text } },
    });
    setSaved(true);
  }, [board, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNotes(text);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(text), 1500);
  };

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  return (
    <main className="h-[100dvh] flex flex-col bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">

      {/* NavBar */}
      <div className="flex-shrink-0 px-6 pt-6 pb-3">
        <div className="max-w-4xl mx-auto">
          <NavBar />
        </div>
      </div>

      {!board ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <p className="text-sm">Board not found.</p>
            <button onClick={() => router.push("/boards")} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              Back to Boards
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header: 3 rows */}
          <div className="flex-shrink-0 px-6 py-2 border-b border-slate-800/60">
            <div className="max-w-4xl mx-auto space-y-1.5">

              {/* Row 1: back + name + save indicator */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/boards")}
                  className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Back"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="flex-1 min-w-0 text-lg font-semibold text-slate-200 truncate">{board.name}</h2>
                <span className={`flex-shrink-0 text-xs transition-colors duration-300 ${saved ? "text-slate-600" : "text-indigo-400"}`}>
                  {saved ? "Сохранено" : "Сохранение..."}
                </span>
              </div>

              {/* Row 2: description */}
              {board.description && (
                <p className="pl-8 text-xs text-slate-400 truncate">{board.description}</p>
              )}

              {/* Row 3: tabs */}
              <div className="pl-8 flex items-center gap-1">
                <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-1">
                  <button
                    onClick={() => router.push(`/boards/${boardId}`)}
                    className="px-3 py-1 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Доска
                  </button>
                  <button
                    className="px-3 py-1 rounded-md text-sm font-medium bg-slate-700 text-slate-100 transition-colors"
                    aria-current="page"
                  >
                    Заметки
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Notes editor: overflow-y-auto so it scrolls independently.
              textarea uses min-h-[60svh] — svh doesn't change when keyboard
              opens, so the textarea stays stable and cursor never jumps. */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-5 pb-10">
            <div className="max-w-4xl mx-auto">
              <textarea
                value={notes}
                onChange={handleChange}
                onBlur={() => { if (!saved) save(notes); }}
                placeholder={"Начните писать заметки о проекте...\n\nЗдесь можно записывать:\n• Цели и задачи\n• Ссылки и ресурсы\n• Договорённости и решения"}
                className="w-full min-h-[60svh] bg-transparent text-base sm:text-sm text-slate-200
                  placeholder-slate-700 resize-none focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
