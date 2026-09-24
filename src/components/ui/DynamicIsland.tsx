"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type IslandStatus = "loading" | "success" | "error";
type IslandPayload = { message: string; status: IslandStatus };

export function notifyDynamicIsland(message: string, status: IslandStatus = "loading") {
  window.dispatchEvent(new CustomEvent<IslandPayload>("kalisto-notification", { detail: { message, status } }));
}

export function DynamicIsland() {
  const [notification, setNotification] = useState<IslandPayload | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleNotification(event: Event) {
      const detail = (event as CustomEvent<IslandPayload>).detail;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setNotification(detail);
      if (detail.status !== "loading") {
        hideTimer.current = setTimeout(() => setNotification(null), detail.status === "success" ? 1400 : 2600);
      }
    }

    window.addEventListener("kalisto-notification", handleNotification);
    return () => {
      window.removeEventListener("kalisto-notification", handleNotification);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const Icon = notification?.status === "success" ? Check : notification?.status === "error" ? X : LoaderCircle;
  return <div aria-live="polite" className={`fixed left-1/2 top-4 z-[60] -translate-x-1/2 overflow-hidden rounded-full border border-white/70 bg-slate-950/95 text-white shadow-xl shadow-slate-950/20 transition-all duration-300 ease-in-out ${notification ? "max-w-[calc(100vw-2rem)] opacity-100" : "pointer-events-none max-w-0 opacity-0"}`} role="status"><div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"><Icon className={`size-4 shrink-0 ${notification?.status === "success" ? "text-emerald-400" : notification?.status === "error" ? "text-rose-300" : "animate-spin text-indigo-300"}`} /><span className="truncate">{notification?.message}</span></div></div>;
}
