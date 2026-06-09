"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { WS_DISCONNECT } from "@/store/wsMiddleware";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NavBar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);

  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications();

  const handleLogout = () => {
    dispatch({ type: WS_DISCONNECT });
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Logo + actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight leading-none">
              <span className="animate-gradient bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Todo
              </span>
              <span className="text-slate-100">List</span>
            </h1>
            <p suppressHydrationWarning className="text-xs text-slate-500 mt-0.5 truncate">
              {user ? user.email : "Manage your tasks"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ConnectionStatus />
          {/* Push notification bell */}
          {permission !== "unsupported" && (
            <button
              onClick={subscribed ? unsubscribe : subscribe}
              title={subscribed ? "Disable notifications" : "Enable notifications"}
              className={`p-1.5 rounded-lg border transition-colors ${
                subscribed
                  ? "border-indigo-500/50 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                  : permission === "denied"
                  ? "border-slate-700 text-slate-600 cursor-not-allowed"
                  : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
              }`}
              disabled={permission === "denied"}
            >
              {subscribed ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 sm:px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Row 2: Nav links */}
      <nav className="flex items-center gap-1">
        <Link
          href="/"
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
            pathname === "/"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          My Tasks
        </Link>
        <Link
          href="/boards"
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
            pathname.startsWith("/boards")
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Boards
        </Link>
      </nav>
    </div>
  );
}
