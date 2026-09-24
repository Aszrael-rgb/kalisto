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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, department")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? "Usuario";
  const role = profile?.role ?? "empleado";
  const roleLabels = {
    administrador: "Administrador",
    manager: "Manager",
    empleado: "Empleado",
  } as const;
  const roleLabel = roleLabels[role];
  const departmentLabel = profile?.department
    ? departmentLabels[profile.department]
    : "Sin departamento asignado";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Kalisto ERP</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              {role === "administrador" ? "Panel maestro" : role === "manager" ? "Panel táctico" : "Mi espacio de trabajo"}
            </h1>
            <p className="mt-3 text-slate-500">
              {role === "administrador"
                ? "Control general de la operación y la configuración del sistema."
                : role === "manager"
                  ? "Visión consolidada de todos los departamentos."
                  : `Accesos rápidos para ${departmentLabel}.`}
            </p>
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
            <p className="text-sm text-cyan-300">Sesión activa</p>
            <h2 className="mt-6 text-3xl font-semibold">Hola, {displayName}</h2>
            <p className="mt-3 break-all text-slate-400">{user.email}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-slate-500">Rol asignado</p>
            <p className="mt-4 text-2xl font-semibold">{roleLabel}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Departamento: {departmentLabel}.
            </p>
          </div>
        </section>

        {role === "administrador" ? (
          <section className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Control maestro</p>
            <h2 className="mt-3 text-2xl font-semibold">Configuración y permisos</h2>
            <p className="mt-2 text-slate-600">Administra roles, departamentos y reglas globales del ERP.</p>
            <a className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800" href="/admin">
              Abrir administración
            </a>
          </section>
        ) : null}

        {role === "manager" ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(departmentLabels).map(([department, label]) => (
              <a
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-sm"
                href={`/${department}`}
                key={department}
              >
                <p className="text-sm text-slate-500">Departamento</p>
                <p className="mt-2 font-semibold">{label}</p>
              </a>
            ))}
          </section>
        ) : null}

        {role === "empleado" && profile?.department ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-slate-500">Acceso rápido</p>
            <h2 className="mt-3 text-2xl font-semibold">Ir a {departmentLabel}</h2>
            <a className="mt-6 inline-flex rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200" href={`/${profile.department}`}>
              Abrir módulo
            </a>
          </section>
        ) : null}
      </div>
    </main>
  );
}
