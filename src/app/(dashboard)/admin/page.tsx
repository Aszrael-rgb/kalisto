import { getSystemMetrics } from "@/actions/enterprise";
import { getUsers } from "@/actions/users";
import { RefreshUsersButton } from "@/components/admin/refresh-users-button";
import { UserAccessTable } from "@/components/admin/user-access-table";

export default async function AdminPage() {
  const [users, metrics] = await Promise.all([getUsers(), getSystemMetrics()]);

  return (
    <section className="mx-auto max-w-7xl">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Administración</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Gestión de usuarios</h1>
          <RefreshUsersButton />
        </div>
        <p className="mt-3 max-w-2xl text-slate-500">
          Asigna roles y departamentos para controlar el acceso a los módulos de Kalisto ERP.
        </p>
      </header>

      <div className="mt-8">
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            ["Ingresos", `€${metrics.totalIncome.toFixed(2)}`],
            ["Gastos", `€${metrics.totalExpenses.toFixed(2)}`],
            ["Usuarios activos", String(metrics.activeUsers)],
            ["Proyectos en curso", String(metrics.activeProjects)],
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-slate-200 bg-white p-5" key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
        <UserAccessTable users={users} />
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Auditoría reciente</h2>
          {metrics.audit.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No hay cambios críticos registrados.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {metrics.audit.map((entry) => (
                <li className="flex flex-wrap justify-between gap-3 py-3 text-sm" key={entry.id}>
                  <span className="text-slate-700">{entry.action} · {entry.entity}</span>
                  <time className="text-slate-500" dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString("es-ES")}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
