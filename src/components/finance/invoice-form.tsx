"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createInvoice } from "@/actions/finance";

export function InvoiceForm() {
  const router = useRouter(); const [open, setOpen] = useState(false); const [message, setMessage] = useState(""); const [isPending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await createInvoice({ invoiceNumber: String(form.get("invoiceNumber")), dueDate: String(form.get("dueDate")), subtotal: Number(form.get("subtotal")) }); setMessage(result.success ? "Factura creada." : result.error ?? "No se pudo crear."); if (result.success) { setOpen(false); router.refresh(); } }); }
  return <>{message ? <p className="text-sm text-slate-600">{message}</p> : null}<button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold" onClick={() => setOpen(true)} type="button">Nueva factura</button>{open ? <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-6"><form className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6" onSubmit={submit}><h2 className="text-xl font-semibold">Nueva factura</h2><input className="w-full rounded-lg border p-3" name="invoiceNumber" placeholder="Número de factura" required /><input className="w-full rounded-lg border p-3" name="dueDate" type="date" required /><input className="w-full rounded-lg border p-3" name="subtotal" placeholder="Subtotal" min="0" step="0.01" type="number" required /><p className="text-sm text-slate-500">El IVA del 21% y el total se calculan automáticamente.</p><div className="flex justify-end gap-2"><button className="rounded-lg border px-4 py-2" onClick={() => setOpen(false)} type="button">Cancelar</button><button className="rounded-lg bg-slate-950 px-4 py-2 text-white" disabled={isPending} type="submit">Guardar</button></div></form></div> : null}</>;
}
