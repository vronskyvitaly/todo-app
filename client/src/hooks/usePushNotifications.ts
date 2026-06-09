"use client";

import { useEffect, useState } from "react";

function getApiUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8000";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8000";
  return `https://api.${host.split(".").slice(1).join(".")}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = async () => {
    // Добавьте эту проверку в начало функции
    if (typeof window === "undefined") return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!("serviceWorker" in navigator) || !vapidKey) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });

    const token = getToken(); // Используйте безопасную функцию
    await fetch(`${getApiUrl()}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
    setSubscribed(true);
  };

  const unsubscribe = async () => {
    // Добавьте эту проверку в начало функции
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await sub.unsubscribe();
    const token = getToken(); // Используйте безопасную функцию
    await fetch(`${getApiUrl()}/api/push/unsubscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    setSubscribed(false);
  };

  return { permission, subscribed, subscribe, unsubscribe };
}