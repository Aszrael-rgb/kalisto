"use client";

import { FilePlus2, ListTodo, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CommandItem = {
  label: string;
  hint: string;
  href: string;
  icon: typeof Users;
};

const commands: CommandItem[] = [
  { label: "Ir a CRM", hint: "Clientes y ventas", href: "/crm", icon: Users },
  { label: "Nueva Factura", hint: "Abrir Finanzas", href: "/finance", icon: FilePlus2 },
  { label: "Añadir Tarea", hint: "Abrir Operaciones", href: "/ops", icon: ListTodo },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const visibleCommands = commands.filter((command) =>
    `${command.label} ${command.hint}`.toLowerCase().includes(query.toLowerCase()),
  );

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Search aria-hidden="true" className="size-5 text-slate-400" />
          <input autoFocus className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar una acción..." value={query} />
          <kbd className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">ESC</kbd>
        </div>
        <div className="p-2">
          {visibleCommands.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No hay comandos disponibles.</p> : visibleCommands.map(({ label, hint, href, icon: Icon }) => <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50" key={href} onClick={() => navigate(href)} type="button"><span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon aria-hidden="true" className="size-4" /></span><span className="flex-1"><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="block text-xs text-slate-400">{hint}</span></span><span className="text-xs text-slate-300">↵</span></button>)}
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Usa <kbd className="font-semibold text-slate-600">Ctrl K</kbd> o <kbd className="font-semibold text-slate-600">⌘ K</kbd> para abrir esta paleta.</div>
      </div>
    </div>
  );
}
