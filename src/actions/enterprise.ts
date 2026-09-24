"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessDepartment, canManageApprovals, requireUser } from "@/lib/auth/authorization";
import type { CampaignStatus, InteractionType, Json, LeadStage, LeaveStatus, StockMovementType, TransactionType } from "@/lib/types/database.types";

type ActionResult = { success: boolean; error?: string };

export async function getSystemMetrics() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "administrador") throw new Error("Solo administradores pueden ver métricas globales.");
  const [income, expenses, users, projects, audit] = await Promise.all([
    supabase.from("finance_transactions").select("amount").eq("type", "ingreso"),
    supabase.from("finance_transactions").select("amount").eq("type", "gasto"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("ops_projects").select("id", { count: "exact", head: true }).in("status", ["planificacion", "en_progreso"]),
    supabase.from("system_audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  if (income.error || expenses.error || users.error || projects.error || audit.error) throw new Error("No se pudieron cargar las métricas.");
  return {
    totalIncome: income.data.reduce((sum, row) => sum + Number(row.amount), 0),
    totalExpenses: expenses.data.reduce((sum, row) => sum + Number(row.amount), 0),
    activeUsers: users.count ?? 0,
    activeProjects: projects.count ?? 0,
    audit: audit.data,
  };
}

export async function updateGlobalSettings(key: string, value: Json): Promise<ActionResult> {
  const parsed = z.object({ key: z.string().trim().min(1), value: z.custom<Json>() }).safeParse({ key, value });
  if (!parsed.success) return { success: false, error: "Configuración inválida." };
  try {
    const { supabase, profile } = await requireUser();
    if (profile.role !== "administrador") return { success: false, error: "Solo administradores pueden cambiar la configuración." };
    const { error } = await supabase.from("system_settings").upsert({ key: parsed.data.key, value: parsed.data.value });
    if (error) return { success: false, error: "No se pudo guardar la configuración." };
    await supabase.rpc("audit_change", { action_name: "update", entity_name: "system_settings", entity_uuid: null, details: { key } });
    revalidatePath("/admin"); return { success: true };
  } catch { return { success: false, error: "No se pudo guardar la configuración." }; }
}

export async function createLead(input: { name: string; email?: string; phone?: string; company?: string; stage?: LeadStage; source?: string }) {
  const parsed = z.object({ name: z.string().trim().min(1), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional(), company: z.string().optional(), stage: z.enum(["prospeccion", "negociacion", "cierre"]).optional(), source: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos del lead inválidos." };
  try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso a CRM." }; const { error } = await supabase.from("crm_leads").insert({ ...parsed.data, email: parsed.data.email || null, created_by: profile.id }); if (error) return { success: false, error: "No se pudo crear el lead." }; revalidatePath("/crm"); return { success: true }; } catch { return { success: false, error: "No se pudo crear el lead." }; }
}

export async function convertLeadToCustomer(leadId: string): Promise<ActionResult> {
  const valid = z.string().uuid().safeParse(leadId); if (!valid.success) return { success: false, error: "Lead inválido." };
  try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso a CRM." }; const { data: lead, error: readError } = await supabase.from("crm_leads").select("*").eq("id", valid.data).single(); if (readError || !lead) return { success: false, error: "Lead no encontrado." }; const { error } = await supabase.from("crm_customers").insert({ name: lead.name, email: lead.email, phone: lead.phone, company: lead.company, created_by: profile.id }); if (error) return { success: false, error: "No se pudo convertir el lead." }; await supabase.from("crm_leads").delete().eq("id", valid.data); revalidatePath("/crm"); return { success: true }; } catch { return { success: false, error: "No se pudo convertir el lead." }; }
}

export async function generateQuote(input: { customerId: string; quoteNumber: string; subtotal: number }): Promise<ActionResult> {
  const parsed = z.object({ customerId: z.string().uuid(), quoteNumber: z.string().min(1), subtotal: z.number().nonnegative() }).safeParse(input); if (!parsed.success) return { success: false, error: "Datos de cotización inválidos." }; const tax = Number((parsed.data.subtotal * 0.21).toFixed(2));
  try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso a CRM." }; const { error } = await supabase.from("crm_quotes").insert({ customer_id: parsed.data.customerId, quote_number: parsed.data.quoteNumber, subtotal: parsed.data.subtotal, tax_amount: tax, total: parsed.data.subtotal + tax, created_by: profile.id }); if (error) return { success: false, error: "No se pudo crear la cotización." }; revalidatePath("/crm"); return { success: true }; } catch { return { success: false, error: "No se pudo crear la cotización." }; }
}

export async function logInteraction(input: { customerId: string; type: InteractionType; notes: string }): Promise<ActionResult> {
  const parsed = z.object({ customerId: z.string().uuid(), type: z.enum(["llamada", "email", "reunion", "nota"]), notes: z.string().min(1) }).safeParse(input); if (!parsed.success) return { success: false, error: "Interacción inválida." };
  try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso a CRM." }; const { error } = await supabase.from("crm_interactions").insert({ customer_id: parsed.data.customerId, type: parsed.data.type, notes: parsed.data.notes, created_by: profile.id }); if (error) return { success: false, error: "No se pudo registrar la interacción." }; revalidatePath("/crm"); return { success: true }; } catch { return { success: false, error: "No se pudo registrar la interacción." }; }
}

export async function checkLowStock() { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "inventory")) throw new Error("Sin acceso a inventario."); const { data, error } = await supabase.from("inv_products").select("*").order("name"); if (error) throw new Error("No se pudo consultar el inventario."); return data.filter((product) => product.stock_actual <= product.stock_minimo); }

export async function registerStockMovement(input: { productId: string; type: StockMovementType; quantity: number; supplierId?: string | null; notes?: string }) {
  const parsed = z.object({ productId: z.string().uuid(), type: z.enum(["entrada", "salida"]), quantity: z.number().int().positive(), supplierId: z.string().uuid().nullable().optional(), notes: z.string().optional() }).safeParse(input); if (!parsed.success) return { success: false, error: "Movimiento inválido." };
  try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "inventory")) return { success: false, error: "Sin acceso a inventario." }; const { data: product } = await supabase.from("inv_products").select("stock_actual").eq("id", parsed.data.productId).single(); if (!product) return { success: false, error: "Producto no encontrado." }; const stock = parsed.data.type === "entrada" ? product.stock_actual + parsed.data.quantity : product.stock_actual - parsed.data.quantity; if (stock < 0) return { success: false, error: "El stock no puede ser negativo." }; const updated = await supabase.from("inv_products").update({ stock_actual: stock }).eq("id", parsed.data.productId); if (updated.error) return { success: false, error: "No se pudo actualizar el stock." }; const { error } = await supabase.from("inv_movements").insert({ product_id: parsed.data.productId, type: parsed.data.type, quantity: parsed.data.quantity, supplier_id: parsed.data.supplierId ?? null, notes: parsed.data.notes || null, created_by: profile.id }); if (error) return { success: false, error: "No se pudo registrar el movimiento." }; revalidatePath("/inventory"); return { success: true }; } catch { return { success: false, error: "No se pudo registrar el movimiento." }; }
}

export async function manageSuppliers(input: { name: string; email?: string; phone?: string }): Promise<ActionResult> { const parsed = z.object({ name: z.string().min(1), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional() }).safeParse(input); if (!parsed.success) return { success: false, error: "Proveedor inválido." }; try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "inventory")) return { success: false, error: "Sin acceso a inventario." }; const { error } = await supabase.from("inv_suppliers").insert({ ...parsed.data, email: parsed.data.email || null }); if (error) return { success: false, error: "No se pudo guardar el proveedor." }; revalidatePath("/inventory"); return { success: true }; } catch { return { success: false, error: "No se pudo guardar el proveedor." }; } }

export async function recordTransaction(input: { type: TransactionType; amount: number; category: string; description?: string }): Promise<ActionResult> { const parsed = z.object({ type: z.enum(["ingreso", "gasto"]), amount: z.number().positive(), category: z.string().min(1), description: z.string().optional() }).safeParse(input); if (!parsed.success) return { success: false, error: "Transacción inválida." }; try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "finance")) return { success: false, error: "Sin acceso a finanzas." }; const { error } = await supabase.from("fin_transactions").insert({ ...parsed.data, description: parsed.data.description || null, created_by: profile.id }); if (error) return { success: false, error: "No se pudo registrar la transacción." }; revalidatePath("/finance"); return { success: true }; } catch { return { success: false, error: "No se pudo registrar la transacción." }; } }

export async function generateInvoice(input: { customerId?: string | null; invoiceNumber: string; subtotal: number; dueDate: string }): Promise<ActionResult> { const parsed = z.object({ customerId: z.string().uuid().nullable().optional(), invoiceNumber: z.string().min(1), subtotal: z.number().nonnegative(), dueDate: z.string().min(1) }).safeParse(input); if (!parsed.success) return { success: false, error: "Factura inválida." }; const tax = Number((parsed.data.subtotal * 0.21).toFixed(2)); try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "finance")) return { success: false, error: "Sin acceso a finanzas." }; const { error } = await supabase.from("fin_invoices").insert({ customer_id: parsed.data.customerId ?? null, invoice_number: parsed.data.invoiceNumber, subtotal: parsed.data.subtotal, tax_amount: tax, total: parsed.data.subtotal + tax, due_date: parsed.data.dueDate, created_by: profile.id }); if (error) return { success: false, error: "No se pudo crear la factura." }; revalidatePath("/finance"); return { success: true }; } catch { return { success: false, error: "No se pudo crear la factura." }; } }

export async function calculateCashFlow() { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "finance")) throw new Error("Sin acceso a finanzas."); const start = new Date(); start.setDate(1); const { data, error } = await supabase.from("fin_transactions").select("type, amount").gte("transaction_date", start.toISOString().slice(0, 10)); if (error) throw new Error("No se pudo calcular el flujo de caja."); return data.reduce((result, row) => { result[row.type] += Number(row.amount); return result; }, { ingreso: 0, gasto: 0 }); }

export async function clockIn(): Promise<ActionResult> { try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "hr", profile.id)) return { success: false, error: "Sin acceso a RRHH." }; const { error } = await supabase.from("hr_attendance").insert({ user_id: profile.id, clock_in: new Date().toISOString() }); if (error) return { success: false, error: "No se pudo fichar la entrada." }; revalidatePath("/hr"); return { success: true }; } catch { return { success: false, error: "No se pudo fichar la entrada." }; } }
export async function clockOut(): Promise<ActionResult> { try { const { supabase, profile } = await requireUser(); const { data: open } = await supabase.from("hr_attendance").select("id").eq("user_id", profile.id).is("clock_out", null).order("clock_in", { ascending: false }).limit(1).maybeSingle(); if (!open) return { success: false, error: "No hay un fichaje abierto." }; const { error } = await supabase.from("hr_attendance").update({ clock_out: new Date().toISOString() }).eq("id", open.id); if (error) return { success: false, error: "No se pudo fichar la salida." }; revalidatePath("/hr"); return { success: true }; } catch { return { success: false, error: "No se pudo fichar la salida." }; } }
export async function approveLeave(id: string, status: LeaveStatus): Promise<ActionResult> { const parsed = z.object({ id: z.string().uuid(), status: z.enum(["pendiente", "aprobado", "rechazado"]) }).safeParse({ id, status }); if (!parsed.success) return { success: false, error: "Solicitud inválida." }; try { const { supabase, profile } = await requireUser(); if (!canManageApprovals(profile)) return { success: false, error: "Sin permisos de aprobación." }; const { error } = await supabase.from("hr_leaves").update({ status: parsed.data.status, reviewed_by: profile.id }).eq("id", parsed.data.id); if (error) return { success: false, error: "No se pudo actualizar la solicitud." }; revalidatePath("/hr"); return { success: true }; } catch { return { success: false, error: "No se pudo actualizar la solicitud." }; } }

export async function createCampaign(input: { name: string; budget: number; platform: string; status?: CampaignStatus }): Promise<ActionResult> { const parsed = z.object({ name: z.string().min(1), budget: z.number().nonnegative(), platform: z.string().min(1), status: z.enum(["borrador", "activa", "pausada", "finalizada"]).optional() }).safeParse(input); if (!parsed.success) return { success: false, error: "Campaña inválida." }; try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso a marketing." }; const { error } = await supabase.from("mkt_campaigns").insert({ ...parsed.data, created_by: profile.id }); if (error) return { success: false, error: "No se pudo crear la campaña." }; revalidatePath("/marketing"); return { success: true }; } catch { return { success: false, error: "No se pudo crear la campaña." }; } }
export async function updateCampaignMetrics(input: { campaignId: string; leadsCount: number; conversionsCount: number; spend: number }): Promise<ActionResult> { const parsed = z.object({ campaignId: z.string().uuid(), leadsCount: z.number().int().nonnegative(), conversionsCount: z.number().int().nonnegative(), spend: z.number().nonnegative() }).safeParse(input); if (!parsed.success) return { success: false, error: "Métricas inválidas." }; try { const { supabase, profile } = await requireUser(); if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso a marketing." }; const { error } = await supabase.from("mkt_performance").insert({ campaign_id: parsed.data.campaignId, leads_count: parsed.data.leadsCount, conversions_count: parsed.data.conversionsCount, spend: parsed.data.spend }); if (error) return { success: false, error: "No se pudieron guardar las métricas." }; revalidatePath("/marketing"); return { success: true }; } catch { return { success: false, error: "No se pudieron guardar las métricas." }; } }