"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessDepartment, requireUser } from "@/lib/auth/authorization";
import type { CustomerStatus, DealStage } from "@/lib/types/database.types";

const customerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  email: z.string().trim().email("El email no es válido.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  status: z.enum(["lead", "cliente", "inactivo"]),
});
const dealSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().trim().min(1),
  value: z.coerce.number().min(0),
  expectedCloseDate: z.string().optional(),
});

export async function getCustomers() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "crm")) throw new Error("Sin acceso al CRM.");
  const { data, error } = await supabase.from("crm_customers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("No se pudieron cargar los clientes.");
  return data;
}

export async function createCustomer(input: {
  name: string; email?: string; phone?: string; company?: string; status?: CustomerStatus;
}) {
  const parsed = customerSchema.safeParse({ status: "lead", ...input });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso al CRM." };
    const { error } = await supabase.from("crm_customers").insert({
      ...parsed.data, email: parsed.data.email || null, phone: parsed.data.phone || null, company: parsed.data.company || null, created_by: profile.id,
    });
    if (error) return { success: false, error: "No se pudo crear el cliente." };
    revalidatePath("/crm");
    return { success: true };
  } catch { return { success: false, error: "No se pudo crear el cliente." }; }
}

export async function updateCustomer(id: string, input: { name?: string; email?: string; phone?: string; company?: string; status?: CustomerStatus }) {
  const parsedId = z.string().uuid().safeParse(id);
  const parsed = customerSchema.partial().safeParse(input);
  if (!parsedId.success || !parsed.success) return { success: false, error: "Datos inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso al CRM." };
    const { error } = await supabase.from("crm_customers").update(parsed.data).eq("id", parsedId.data);
    if (error) return { success: false, error: "No se pudo actualizar el cliente." };
    revalidatePath("/crm"); return { success: true };
  } catch { return { success: false, error: "No se pudo actualizar el cliente." }; }
}

export async function deleteCustomer(id: string) {
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { success: false, error: "Identificador inválido." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso al CRM." };
    const { error } = await supabase.from("crm_customers").delete().eq("id", parsedId.data);
    if (error) return { success: false, error: "No se pudo eliminar el cliente." };
    revalidatePath("/crm"); return { success: true };
  } catch { return { success: false, error: "No se pudo eliminar el cliente." }; }
}

export async function getDeals() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "crm")) throw new Error("Sin acceso al CRM.");
  const { data, error } = await supabase.from("crm_deals").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("No se pudieron cargar los tratos."); return data;
}

export async function createDeal(input: { customerId: string; title: string; value: number; expectedCloseDate?: string }) {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos del trato inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso al CRM." };
    const { error } = await supabase.from("crm_deals").insert({ customer_id: parsed.data.customerId, title: parsed.data.title, value: parsed.data.value, expected_close_date: parsed.data.expectedCloseDate || null });
    if (error) return { success: false, error: "No se pudo crear el trato." };
    revalidatePath("/crm"); return { success: true };
  } catch { return { success: false, error: "No se pudo crear el trato." }; }
}

export async function updateDealStage(id: string, stage: DealStage) {
  const parsed = z.object({ id: z.string().uuid(), stage: z.enum(["prospeccion", "propuesta", "ganado", "perdido"]) }).safeParse({ id, stage });
  if (!parsed.success) return { success: false, error: "Datos inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "crm")) return { success: false, error: "Sin acceso al CRM." };
    const { error } = await supabase.from("crm_deals").update({ stage: parsed.data.stage }).eq("id", parsed.data.id);
    if (error) return { success: false, error: "No se pudo actualizar el trato." };
    revalidatePath("/crm"); return { success: true };
  } catch { return { success: false, error: "No se pudo actualizar el trato." }; }
}
