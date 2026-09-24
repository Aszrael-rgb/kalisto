"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createTask } from "@/actions/ops";

type Project = { id: string; name: string };

export function TaskForm({ projects }: { projects: Project[] }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [message, setMessage] = useState(""); const [isPending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await createTask({ projectId: String(form.get("projectId")), title: String(form.get("title")), priority: form.get("priority") as "baja" | "media" | "alta" | "urgente" }); setMessage(result.success ? "Tarea creada." : result.error ?? "No se pudo crear."); if (result.success) { setOpen(false); router.refresh(); } }); }
  return <>{message ? <p className="text-sm text-slate-600">{message}</p> : null}<button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-50" disabled={projects.length === 0} onClick={() => setOpen(true)} type="button">Nueva tarea</button>{open ? <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-6"><form className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6" onSubmit={submit}><h2 className="text-xl font-semibold">Nueva tarea</h2><select className="w-full rounded-lg border p-3" name="projectId" required><option value="">Selecciona proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><input className="w-full rounded-lg border p-3" name="title" placeholder="Título" required /><select className="w-full rounded-lg border p-3" name="priority"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select><div className="flex justify-end gap-2"><button className="rounded-lg border px-4 py-2" onClick={() => setOpen(false)} type="button">Cancelar</button><button className="rounded-lg bg-slate-950 px-4 py-2 text-white" disabled={isPending} type="submit">Guardar</button></div></form></div> : null}</>;
}
