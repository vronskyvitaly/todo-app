"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/store";
import { WS_CONNECT } from "@/store/wsMiddleware";

const THRESHOLD = 72; // px needed to trigger refresh

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [pullY, setPullY] = useState(0);       // visual pull distance
  const [refreshing, setRefreshing] = useState(false);

  const startYRef   = useRef(0);
  const currentYRef = useRef(0);
  const activeRef   = useRef(false);           // are we in a pull gesture?

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Only start pull when page is scrolled to the very top
      if (window.scrollY > 2) return;
      startYRef.current   = e.touches[0].clientY;
      currentYRef.current = e.touches[0].clientY;
      activeRef.current   = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!activeRef.current) return;
      currentYRef.current = e.touches[0].clientY;
      const dy = currentYRef.current - startYRef.current;

      // Ignore upward or sideways swipes
      if (dy <= 0 || window.scrollY > 2) {
        activeRef.current = false;
        setPullY(0);
        return;
      }

      // Rubber-band effect: slows down after threshold
      const clamped = Math.min(dy * 0.5, THRESHOLD * 1.2);
      setPullY(clamped);

      // Prevent native scroll/browser pull-to-reload
      if (dy > 4) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!activeRef.current) return;
      activeRef.current = false;

      const dy = currentYRef.current - startYRef.current;
      if (dy * 0.5 >= THRESHOLD) {
        // Trigger refresh
        setRefreshing(true);
        setPullY(THRESHOLD * 0.7); // snap to indicator height
        const token = localStorage.getItem("token");
        if (token) dispatch({ type: WS_CONNECT, payload: { token } });
        setTimeout(() => {
          setRefreshing(false);
          setPullY(0);
        }, 900);
      } else {
        setPullY(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: false });
    document.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove",  onTouchMove);
      document.removeEventListener("touchend",   onTouchEnd);
    };
  }, [dispatch]);

  const progress  = Math.min(pullY / THRESHOLD, 1);         // 0–1 for icon rotation
  const visible   = pullY > 2 || refreshing;
  const barHeight = refreshing ? 44 : pullY > 0 ? pullY * 0.9 : 0;

  return (
    <>
      {/* Pull indicator bar */}
      <div
        style={{ height: barHeight, transition: activeRef.current ? "none" : "height 0.25s ease" }}
        className="flex items-center justify-center overflow-hidden"
      >
        {visible && (
          <div
            style={{ opacity: refreshing ? 1 : progress, transform: `rotate(${progress * 360}deg)` }}
            className={`w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent ${refreshing ? "animate-spin" : ""}`}
          />
        )}
      </div>
      {children}
    </>
  );
}
