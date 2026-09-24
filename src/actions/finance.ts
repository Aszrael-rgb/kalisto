"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessDepartment, requireUser } from "@/lib/auth/authorization";
import type { InvoiceStatus, TransactionType } from "@/lib/types/database.types";

export async function getTransactions() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "finance")) throw new Error("Sin acceso a finanzas.");
  const { data, error } = await supabase.from("finance_transactions").select("*").order("date", { ascending: false });
  if (error) throw new Error("No se pudieron cargar las transacciones."); return data;
}

export async function createTransaction(input: { type: TransactionType; amount: number; category: string; description?: string; date?: string }) {
  const parsed = z.object({ type: z.enum(["ingreso", "gasto"]), amount: z.coerce.number().positive(), category: z.string().trim().min(1), description: z.string().optional(), date: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos de transacción inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "finance")) return { success: false, error: "Sin acceso a finanzas." };
    const { error } = await supabase.from("finance_transactions").insert({ ...parsed.data, description: parsed.data.description || null, created_by: profile.id });
    if (error) return { success: false, error: "No se pudo crear la transacción." };
    revalidatePath("/finance"); return { success: true };
  } catch { return { success: false, error: "No se pudo crear la transacción." }; }
}

export async function getInvoices() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "finance")) throw new Error("Sin acceso a finanzas.");
  const { data, error } = await supabase.from("finance_invoices").select("*").order("issue_date", { ascending: false });
  if (error) throw new Error("No se pudieron cargar las facturas."); return data;
}

export async function createInvoice(input: { invoiceNumber: string; customerId?: string | null; dueDate: string; subtotal: number }) {
  const parsed = z.object({ invoiceNumber: z.string().trim().min(1), customerId: z.string().uuid().nullable().optional(), dueDate: z.string().min(1), subtotal: z.coerce.number().min(0) }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos de factura inválidos." };
  const taxAmount = Number((parsed.data.subtotal * 0.21).toFixed(2));
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "finance")) return { success: false, error: "Sin acceso a finanzas." };
    const { error } = await supabase.from("finance_invoices").insert({ invoice_number: parsed.data.invoiceNumber, customer_id: parsed.data.customerId ?? null, due_date: parsed.data.dueDate, subtotal: parsed.data.subtotal, tax_amount: taxAmount, total: parsed.data.subtotal + taxAmount });
    if (error) return { success: false, error: "No se pudo crear la factura." };
    revalidatePath("/finance"); return { success: true };
  } catch { return { success: false, error: "No se pudo crear la factura." }; }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["borrador", "emitida", "pagada", "vencida"]) }).safeParse({ id, status });
  if (!parsed.success) return { success: false, error: "Datos inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "finance")) return { success: false, error: "Sin acceso a finanzas." };
    const { error } = await supabase.from("finance_invoices").update({ status: parsed.data.status }).eq("id", parsed.data.id);
    if (error) return { success: false, error: "No se pudo actualizar la factura." };
    revalidatePath("/finance"); return { success: true };
  } catch { return { success: false, error: "No se pudo actualizar la factura." }; }
}
