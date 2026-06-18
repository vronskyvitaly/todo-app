"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import EditModal from "@/components/EditModal";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import TaskStats from "@/components/TaskStats";

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
      <div className="flex-shrink-0 pt-6 pb-3">
        <div className="max-w-4xl mx-auto px-6">
          <NavBar />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-6 pb-12 space-y-6">
        {/* Analytics */}
        <TaskStats />

        {/* Add task button — full width */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
            bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
            text-white text-sm font-semibold tracking-wide transition-colors shadow-lg shadow-indigo-900/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>

        <TodoList />
      </div>

      {showForm && <TodoForm onClose={() => setShowForm(false)} />}
      <EditModal />
    </main>
  );
}
