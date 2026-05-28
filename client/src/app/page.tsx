"use client";

import { useRouter } from "next/navigation";
import ConnectionStatus from "@/components/ConnectionStatus";
import EditModal from "@/components/EditModal";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { WS_DISCONNECT } from "@/store/wsMiddleware";

export default function Home() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch({ type: WS_DISCONNECT });
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // clear the cookie used by Next.js middleware
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              TodoList
            </h1>
            {user && (
              <p className="text-slate-400 text-sm mt-1">{user.email}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Form */}
        <TodoForm />

        {/* List */}
        <TodoList />
      </div>

      {/* Edit Modal */}
      <EditModal />
    </main>
  );
}
