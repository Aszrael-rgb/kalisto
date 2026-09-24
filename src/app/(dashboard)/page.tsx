import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? "Usuario";
  const roleLabel = profile?.role === "admin" ? "Administrador" : "Usuario";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Kalisto ERP</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Panel de administración</h1>
            <p className="mt-3 text-slate-500">Resumen de tu espacio de trabajo.</p>
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
              Tus permisos se gestionan desde el perfil y las políticas RLS de Supabase.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
