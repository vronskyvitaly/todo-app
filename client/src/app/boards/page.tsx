"use client";

import { useState } from "react";
import { useAppSelector } from "@/store";
import NavBar from "@/components/NavBar";
import BoardCard from "@/components/boards/BoardCard";
import BoardForm from "@/components/boards/BoardForm";
import { Board } from "@/types/todo";
import { BoardGridSkeleton } from "@/components/skeletons";

export default function BoardsPage() {
  const boards = useAppSelector((s) => s.boards.boards);
  const columns = useAppSelector((s) => s.boards.columns);
  const isLoading = useAppSelector((s) => s.boards.isLoading);
  const [showForm, setShowForm] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBoard(null);
  };

  return (
    <main className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <NavBar />

        {/* Boards header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-200">Boards</h2>
          <button
            onClick={() => { setEditingBoard(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
              text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Board
          </button>
        </div>

        {isLoading ? (
          <BoardGridSkeleton />
        ) : boards.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <div className="text-5xl mb-4">🗂</div>
            <p className="text-sm">No boards yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                columns={columns.filter((c) => c.boardId === board.id)}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <BoardForm board={editingBoard} onClose={handleCloseForm} />
      )}
    </main>
  );
}
