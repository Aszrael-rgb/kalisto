import { getProjects, getTasks } from "@/actions/ops";
import { OperationsWorkspace } from "@/components/operations/operations-workspace";

export default async function OpsPage() {
  const [projects, tasks] = await Promise.all([getProjects(), getTasks()]);

  return (
    <section className="mx-auto max-w-7xl">
      <header className="mb-8 border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Operaciones</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Proyectos y tareas</h1>
        <p className="mt-3 text-slate-500">Coordina el trabajo y visualiza el progreso real.</p>
      </header>
      <OperationsWorkspace projects={projects} tasks={tasks} />
    </section>
  );
}