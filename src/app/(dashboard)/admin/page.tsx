import { getUsers } from "@/actions/users";
import { UserAccessTable } from "@/components/admin/user-access-table";

export default async function AdminPage() {
  const users = await getUsers();

  return (
    <section className="mx-auto max-w-7xl">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Administración</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Gestión de usuarios</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Asigna roles y departamentos para controlar el acceso a los módulos de Kalisto ERP.
        </p>
      </header>

      <div className="mt-8">
        <UserAccessTable users={users} />
      </div>
    </section>
  );
}
