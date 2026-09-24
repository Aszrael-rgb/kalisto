"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshUsersButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      aria-label="Actualizar lista de usuarios"
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={handleRefresh}
      type="button"
    >
      <RefreshCw aria-hidden="true" className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Actualizando..." : "Refrescar"}
    </button>
  );
}
