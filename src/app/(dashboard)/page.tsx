import { ArrowUpRight, BriefcaseBusiness, CircleDollarSign, ListTodo, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Department } from "@/lib/types/database.types";

const departmentLabels: Record<Department, string> = {
  crm: "CRM",
  inventory: "Inventario",
  finance: "Finanzas",
  hr: "Recursos Humanos",
  operations: "Operaciones",
  marketing: "Marketing",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role, department").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? "empleado";
  const departmentLabel = profile?.department ? departmentLabels[profile.department] : "Sin departamento asignado";
  const canSeeCrm = role !== "empleado" || profile?.department === "crm";
  const canSeeOperations = role !== "empleado" || profile?.department === "operations";
  const [customerCount, dealCount, taskCount] = await Promise.all([
    canSeeCrm ? supabase.from("crm_customers").select("id", { count: "exact", head: true }) : Promise.resolve({ count: null }),
    canSeeCrm ? supabase.from("crm_deals").select("id", { count: "exact", head: true }).neq("stage", "perdido") : Promise.resolve({ count: null }),
    canSeeOperations ? supabase.from("ops_tasks").select("id", { count: "exact", head: true }).neq("status", "completado") : Promise.resolve({ count: null }),
  ]);
  const displayName = profile?.full_name ?? "Usuario";
  const roleLabel = role === "administrador" ? "Administrador" : role === "manager" ? "Manager" : "Empleado";
  const quickLinks = role === "empleado" && profile?.department ? [{ href: `/${profile.department}`, label: `Abrir ${departmentLabel}`, icon: BriefcaseBusiness }] : [{ href: "/crm", label: "Revisar CRM", icon: Users }, { href: "/finance", label: "Ver finanzas", icon: CircleDollarSign }, { href: "/ops", label: "Añadir tarea", icon: ListTodo }];

  return <main className="mx-auto max-w-7xl"><header className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-600">Kalisto ERP</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Buenos días, {displayName}</h1><p className="mt-3 text-slate-500">{roleLabel} · {departmentLabel}</p></div><div className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-sm text-slate-500 shadow-sm">{user.email}</div></header>
  <section className="grid auto-rows-[minmax(150px,auto)] grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      <article className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-indigo-950/10 md:col-span-2 md:row-span-2"><div className="absolute -right-16 -top-16 size-48 rounded-full bg-indigo-500/20 blur-2xl" /><p className="relative text-sm font-medium text-indigo-200">Espacio de trabajo</p><h2 className="relative mt-12 max-w-md text-3xl font-semibold leading-tight">Una vista clara para mover el negocio.</h2><p className="relative mt-4 max-w-sm text-sm leading-6 text-slate-300">Tu acceso está configurado como {roleLabel.toLowerCase()} en {departmentLabel.toLowerCase()}.</p></article>
      <Link className="group rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg md:col-span-2" href="/crm"><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Users className="size-5" /></span><ArrowUpRight className="size-5 text-slate-300 transition group-hover:text-indigo-500" /></div><p className="mt-6 text-sm text-slate-500">Resumen CRM</p><p className="mt-1 text-3xl font-semibold text-slate-950">{customerCount.count ?? 0}</p><p className="mt-1 text-sm text-slate-500">clientes · {dealCount.count ?? 0} tratos activos</p></Link>
      <Link className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg" href="/ops"><span className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><ListTodo className="size-5" /></span><p className="mt-6 text-sm text-slate-500">Tareas pendientes</p><p className="mt-1 text-3xl font-semibold text-slate-950">{taskCount.count ?? 0}</p><p className="mt-1 text-sm text-slate-500">requieren atención</p></Link>
      <article className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-700">Atajos rápidos</p><div className="mt-5 space-y-2">{quickLinks.map(({ href, label, icon: Icon }) => <Link className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-indigo-700" href={href} key={href}><Icon className="size-4" />{label}<ArrowUpRight className="ml-auto size-4" /></Link>)}</div></article>
    </section>
  </main>;
}
