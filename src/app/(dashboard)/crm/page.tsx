import { getCustomers, getDeals } from "@/actions/crm";
import { CrmWorkspace } from "@/components/crm/crm-workspace";

export default async function CrmPage() {
  const [customers, deals] = await Promise.all([getCustomers(), getDeals()]);

  return (
    <section className="mx-auto max-w-7xl">
      <header className="mb-8 border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">CRM</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Clientes y ventas</h1>
        <p className="mt-3 text-slate-500">Gestiona relaciones comerciales y oportunidades reales.</p>
      </header>
      <CrmWorkspace customers={customers} deals={deals} />
    </section>
  );
}
