"use client";

import { useState } from "react";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import KanbanBoard from "@/components/boards/KanbanBoard";
import BoardForm from "@/components/boards/BoardForm";
import BoardDescription from "@/components/boards/BoardDescription";
import EditModal from "@/components/EditModal";
import { KanbanSkeleton } from "@/components/skeletons";

interface Props {
  params: { boardId: string };
}

export default function BoardPage({ params }: Props) {
  const { boardId } = params;
  const router = useRouter();
  const isLoading = useAppSelector((s) => s.boards.isLoading);
  const board = useAppSelector((s) => s.boards.boards.find((b) => b.id === boardId));
  const columns = useAppSelector((s) => s.boards.columns.filter((c) => c.boardId === boardId));
  const todos = useAppSelector((s) => s.todos.todos.filter((t) => t.boardId === boardId));
  const [editingBoard, setEditingBoard] = useState(false);

  return (
    <main className="h-[100dvh] flex flex-col bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 overflow-hidden">

      <div className="flex-shrink-0 pt-6 pb-3">
        <div className="max-w-4xl mx-auto px-6">
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
          {/* Sub-header — identical structure to notes page for stable height */}
          <div className="flex-shrink-0 py-1 border-b border-slate-800/60">
            <div className="max-w-4xl mx-auto px-6 space-y-1">

              {/* Row 1: back · name · description · edit */}
              <div className="flex items-center gap-2">
                <button onClick={() => router.push("/boards")} className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Back">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="flex-1 min-w-0 text-base font-semibold text-slate-200 truncate">{board.name}</h2>
                {board.description && (
                  <BoardDescription name={board.name} description={board.description} />
                )}
                {/* Same fixed-size action area as notes page */}
                <button
                  onClick={() => setEditingBoard(true)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors"
                  aria-label="Edit board"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>

              {/* Row 2: tabs centered */}
              <div className="flex justify-center">
                <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-1">
                  <button className="px-4 py-1 rounded-md text-sm font-medium bg-slate-700 text-slate-100 transition-colors" aria-current="page">
                    Board
                  </button>
                  <button
                    onClick={() => router.push(`/boards/${boardId}/notes`)}
                    className="px-4 py-1 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Notes
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Kanban area */}
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-4 py-4">
            {isLoading ? <KanbanSkeleton /> : <KanbanBoard board={board} columns={columns} todos={todos} />}
          </div>
        </>
      )}

      {editingBoard && <BoardForm board={board ?? null} onClose={() => setEditingBoard(false)} />}
      <EditModal />
    </main>
  );
}
