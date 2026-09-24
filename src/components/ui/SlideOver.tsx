"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type SlideOverProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function SlideOver({ open, title, description, onClose, children }: SlideOverProps) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return <div aria-hidden={!open} className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}><button aria-label="Cerrar panel" className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-sm" onClick={onClose} type="button" /><aside aria-labelledby="slide-over-title" aria-modal="true" className={`absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`} role="dialog"><header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-xl font-semibold text-slate-900" id="slide-over-title">{title}</h2>{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}</div><button aria-label="Cerrar panel" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button></header><div className="flex-1 overflow-y-auto px-6 py-6">{children}</div></aside></div>;
}
