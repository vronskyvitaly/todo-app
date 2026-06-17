"use client";

import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import KanbanBoard from "@/components/boards/KanbanBoard";
import BoardForm from "@/components/boards/BoardForm";
import EditModal from "@/components/EditModal";
import { KanbanSkeleton } from "@/components/skeletons";
import { WS_SEND } from "@/store/wsMiddleware";

interface Props {
  params: { boardId: string };
}

export default function BoardPage({ params }: Props) {
  const { boardId } = params;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.boards.isLoading);
  const board = useAppSelector((s) => s.boards.boards.find((b) => b.id === boardId));
  const columns = useAppSelector((s) => s.boards.columns.filter((c) => c.boardId === boardId));
  const todos = useAppSelector((s) => s.todos.todos.filter((t) => t.boardId === boardId));
  const [editingBoard, setEditingBoard] = useState(false);
  const [notes, setNotes] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync notes from Redux when board loads/changes
  useEffect(() => {
    setNotes(board?.notes ?? "");
  }, [board?.notes]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [notes]);

  const saveNotes = () => {
    if (!board || notes === (board.notes ?? "")) return;
    dispatch({
      type: WS_SEND,
      payload: {
        type: "UPDATE_BOARD",
        payload: { id: board.id, notes },
      },
    });
  };

  return (
    <main className="h-[100dvh] flex flex-col bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 overflow-hidden">

      {/* Top bar: NavBar */}
      <div className="flex-shrink-0 px-6 pt-6 pb-3">
        <div className="max-w-4xl mx-auto">
          <NavBar />
        </div>
      </div>

      {!board ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <p className="text-sm">Board not found.</p>
            <button
              onClick={() => router.push("/boards")}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              Back to Boards
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Board header */}
          <div className="flex-shrink-0 px-6 py-2 border-b border-slate-800/60">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <button
                onClick={() => router.push("/boards")}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Back to boards"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-200 truncate">{board.name}</h2>
                {board.description && (
                  <p className="text-xs text-slate-400">{board.description}</p>
                )}
              </div>
              <button
                onClick={() => setEditingBoard(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors"
                aria-label="Edit board"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Project notes */}
          <div className="flex-shrink-0 px-6 border-b border-slate-800/40">
            <div className="max-w-4xl mx-auto py-2">
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Заметки о проекте..."
                rows={1}
                className="w-full bg-transparent text-base sm:text-sm text-slate-300 placeholder-slate-600
                  resize-none focus:outline-none leading-relaxed overflow-hidden"
              />
            </div>
          </div>

          {/* Kanban area — takes all remaining height */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
            {isLoading ? <KanbanSkeleton /> : <KanbanBoard board={board} columns={columns} todos={todos} />}
          </div>
        </>
      )}

      {editingBoard && (
        <BoardForm board={board ?? null} onClose={() => setEditingBoard(false)} />
      )}

      <EditModal />
    </main>
  );
}
