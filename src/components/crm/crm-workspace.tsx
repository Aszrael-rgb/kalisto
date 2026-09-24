"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createCustomer, createDeal, updateDealStage } from "@/actions/crm";
import type { CustomerStatus, DealStage } from "@/lib/types/database.types";

type Customer = { id: string; name: string; email: string | null; company: string | null; status: CustomerStatus };
type Deal = { id: string; customer_id: string; title: string; value: number; stage: DealStage; expected_close_date: string | null };

const stages: DealStage[] = ["prospeccion", "propuesta", "ganado", "perdido"];
const stageLabels: Record<DealStage, string> = { prospeccion: "Prospección", propuesta: "Propuesta", ganado: "Ganado", perdido: "Perdido" };

export function CrmWorkspace({ customers, deals }: { customers: Customer[]; deals: Deal[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "todos">("todos");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const filteredCustomers = useMemo(() => customers.filter((customer) => (
    (status === "todos" || customer.status === status)
    && `${customer.name} ${customer.email ?? ""} ${customer.company ?? ""}`.toLowerCase().includes(query.toLowerCase())
  )), [customers, query, status]);
  const wonValue = deals.filter((deal) => deal.stage === "ganado").reduce((sum, deal) => sum + Number(deal.value), 0);
  const pipelineValue = deals.filter((deal) => deal.stage !== "perdido").reduce((sum, deal) => sum + Number(deal.value), 0);

  function refreshAfter(action: Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action;
      setMessage(result.success ? "Cambios guardados." : result.error ?? "No se pudo guardar.");
      if (result.success) { setShowCustomerForm(false); setShowDealForm(false); router.refresh(); }
    });
  }

  return <div className="space-y-8">
    <div className="grid gap-4 md:grid-cols-3">
      {[["Clientes activos", customers.filter((customer) => customer.status === "cliente").length.toString()], ["Tratos ganados", `€${wonValue.toFixed(2)}`], ["Valor del pipeline", `€${pipelineValue.toFixed(2)}`]].map(([label, value]) => <div className="rounded-2xl border border-slate-200 bg-white p-6" key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p></div>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-3"><input className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar clientes" value={query} /><select className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm" onChange={(event) => setStatus(event.target.value as CustomerStatus | "todos")} value={status}><option value="todos">Todos los estados</option><option value="lead">Lead</option><option value="cliente">Cliente</option><option value="inactivo">Inactivo</option></select></div><div className="flex gap-2"><button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold" onClick={() => setShowCustomerForm(true)} type="button">Nuevo cliente</button><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={customers.length === 0} onClick={() => setShowDealForm(true)} type="button">Nuevo trato</button></div></div>
    {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    {filteredCustomers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No hay clientes que mostrar. Usa “Nuevo cliente” para crear el primero.</div> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Empresa</th><th className="px-6 py-4">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredCustomers.map((customer) => <tr key={customer.id}><td className="px-6 py-4 font-medium">{customer.name}</td><td className="px-6 py-4 text-slate-500">{customer.email ?? "Sin email"}</td><td className="px-6 py-4 text-slate-500">{customer.company ?? "Sin empresa"}</td><td className="px-6 py-4">{customer.status}</td></tr>)}</tbody></table></div>}
    <section><h2 className="mb-4 text-xl font-semibold">Tratos</h2>{deals.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No hay tratos registrados. Crea uno después de registrar un cliente.</div> : <div className="space-y-3">{deals.map((deal) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5" key={deal.id}><div><p className="font-semibold">{deal.title}</p><p className="text-sm text-slate-500">€{Number(deal.value).toFixed(2)}</p></div><select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" disabled={isPending} onChange={(event) => refreshAfter(updateDealStage(deal.id, event.target.value as DealStage))} value={deal.stage}>{stages.map((item) => <option key={item} value={item}>{stageLabels[item]}</option>)}</select></div>)}</div>}</section>
    {showCustomerForm ? <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-6"><form className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); refreshAfter(createCustomer({ name: String(form.get("name")), email: String(form.get("email")), company: String(form.get("company")), status: "lead" })); }}><h2 className="text-xl font-semibold">Nuevo cliente</h2><input className="w-full rounded-lg border p-3" name="name" placeholder="Nombre" required /><input className="w-full rounded-lg border p-3" name="email" placeholder="Email" type="email" /><input className="w-full rounded-lg border p-3" name="company" placeholder="Empresa" /><div className="flex justify-end gap-2"><button className="rounded-lg border px-4 py-2" onClick={() => setShowCustomerForm(false)} type="button">Cancelar</button><button className="rounded-lg bg-slate-950 px-4 py-2 text-white" disabled={isPending} type="submit">Guardar</button></div></form></div> : null}
    {showDealForm ? <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-6"><form className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); refreshAfter(createDeal({ customerId: String(form.get("customerId")), title: String(form.get("title")), value: Number(form.get("value")) })); }}><h2 className="text-xl font-semibold">Nuevo trato</h2><select className="w-full rounded-lg border p-3" name="customerId" required><option value="">Selecciona cliente</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select><input className="w-full rounded-lg border p-3" name="title" placeholder="Título" required /><input className="w-full rounded-lg border p-3" name="value" min="0" placeholder="Valor" step="0.01" type="number" required /><div className="flex justify-end gap-2"><button className="rounded-lg border px-4 py-2" onClick={() => setShowDealForm(false)} type="button">Cancelar</button><button className="rounded-lg bg-slate-950 px-4 py-2 text-white" disabled={isPending} type="submit">Guardar</button></div></form></div> : null}
  </div>;
}
