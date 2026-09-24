"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessDepartment, canManageApprovals, requireUser } from "@/lib/auth/authorization";
import type { LeaveStatus, LeaveType } from "@/lib/types/database.types";

export async function registerClockIn(notes?: string) {
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "hr", profile.id)) return { success: false, error: "Sin acceso a RRHH." };
    const { data: open } = await supabase.from("hr_attendance").select("id").eq("user_id", profile.id).is("clock_out", null).limit(1).maybeSingle();
    if (open) return { success: false, error: "Ya tienes un fichaje abierto." };
    const { error } = await supabase.from("hr_attendance").insert({ user_id: profile.id, clock_in: new Date().toISOString(), notes: notes || null });
    if (error) return { success: false, error: "No se pudo registrar la entrada." };
    revalidatePath("/hr"); return { success: true };
  } catch { return { success: false, error: "No se pudo registrar la entrada." }; }
}

export async function registerClockOut() {
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "hr", profile.id)) return { success: false, error: "Sin acceso a RRHH." };
    const { data: open } = await supabase.from("hr_attendance").select("id").eq("user_id", profile.id).is("clock_out", null).order("clock_in", { ascending: false }).limit(1).maybeSingle();
    if (!open) return { success: false, error: "No tienes un fichaje abierto." };
    const { error } = await supabase.from("hr_attendance").update({ clock_out: new Date().toISOString() }).eq("id", open.id);
    if (error) return { success: false, error: "No se pudo registrar la salida." };
    revalidatePath("/hr"); return { success: true };
  } catch { return { success: false, error: "No se pudo registrar la salida." }; }
}

export async function getTodayAttendance() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "hr", profile.id)) throw new Error("Sin acceso a RRHH.");
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from("hr_attendance").select("*").eq("user_id", profile.id).gte("clock_in", start.toISOString()).order("clock_in", { ascending: false });
  if (error) throw new Error("No se pudo cargar la asistencia."); return data;
}

export async function requestLeave(input: { type: LeaveType; startDate: string; endDate: string }) {
  const parsed = z.object({ type: z.enum(["vacaciones", "baja_medica", "personal"]), startDate: z.string(), endDate: z.string() }).refine((value) => value.endDate >= value.startDate, "El rango de fechas no es válido.").safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos de ausencia inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "hr", profile.id)) return { success: false, error: "Sin acceso a RRHH." };
    const { error } = await supabase.from("hr_leaves").insert({ user_id: profile.id, type: parsed.data.type, start_date: parsed.data.startDate, end_date: parsed.data.endDate });
    if (error) return { success: false, error: "No se pudo solicitar la ausencia." };
    revalidatePath("/hr"); return { success: true };
  } catch { return { success: false, error: "No se pudo solicitar la ausencia." }; }
}

export async function getLeaves() {
  const { supabase, profile } = await requireUser();
  const query = supabase.from("hr_leaves").select("*").order("start_date", { ascending: false });
  const { data, error } = canManageApprovals(profile) ? await query : await query.eq("user_id", profile.id);
  if (error) throw new Error("No se pudieron cargar las ausencias."); return data;
}

export async function updateLeaveStatus(id: string, status: LeaveStatus) {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["pendiente", "aprobado", "rechazado"]) }).safeParse({ id, status });
  if (!parsed.success) return { success: false, error: "Datos inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canManageApprovals(profile)) return { success: false, error: "Solo managers y administradores pueden aprobar ausencias." };
    const { error } = await supabase.from("hr_leaves").update({ status: parsed.data.status, reviewed_by: profile.id }).eq("id", parsed.data.id);
    if (error) return { success: false, error: "No se pudo actualizar la ausencia." };
    revalidatePath("/hr"); return { success: true };
  } catch { return { success: false, error: "No se pudo actualizar la ausencia." }; }
}
