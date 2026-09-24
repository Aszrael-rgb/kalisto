import { getInvoices, getTransactions } from "@/actions/finance";
import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { InvoiceForm } from "@/components/finance/invoice-form";

export default async function FinancePage() {
  const [transactions, invoices] = await Promise.all([getTransactions(), getInvoices()]);
  return <section className="mx-auto max-w-7xl"><header className="mb-8 border-b border-slate-200 pb-8"><p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Finanzas</p><h1 className="mt-3 text-4xl font-semibold text-slate-950">Control financiero</h1><p className="mt-3 text-slate-500">Consulta el balance y gestiona transacciones y facturas.</p></header><div className="mb-6 flex justify-end"><InvoiceForm /></div><FinanceWorkspace transactions={transactions} invoices={invoices} /></section>;
}
