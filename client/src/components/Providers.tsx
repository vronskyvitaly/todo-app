"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { setCredentials } from "@/store/authSlice";
import { WS_CONNECT, WS_DISCONNECT } from "@/store/wsMiddleware";
import type { AuthUser } from "@/types/todo";
import PullToRefresh from "@/components/PullToRefresh";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Register service worker for push notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as AuthUser;
        dispatch(setCredentials({ token, user }));
        dispatch({ type: WS_CONNECT, payload: { token } });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    // Reconnect immediately when app comes back to foreground (iOS PWA)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const t = localStorage.getItem("token");
        if (t) dispatch({ type: WS_CONNECT, payload: { token: t } });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      dispatch({ type: WS_DISCONNECT });
    };
  }, [dispatch]);

  return <PullToRefresh>{children}</PullToRefresh>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}
