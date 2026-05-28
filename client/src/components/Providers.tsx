"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { setCredentials } from "@/store/authSlice";
import { WS_CONNECT, WS_DISCONNECT } from "@/store/wsMiddleware";
import type { AuthUser } from "@/types/todo";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
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

    return () => {
      dispatch({ type: WS_DISCONNECT });
    };
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AppInitializer>{children}</AppInitializer>
    </Provider>
  );
}
