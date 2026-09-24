"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessDepartment, requireUser } from "@/lib/auth/authorization";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types/database.types";

export async function getProjects() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "operations")) throw new Error("Sin acceso a operaciones.");
  const { data, error } = await supabase.from("ops_projects").select("*").order("name");
  if (error) throw new Error("No se pudieron cargar los proyectos."); return data;
}

export async function createProject(input: { name: string; description?: string; status?: ProjectStatus; startDate?: string; endDate?: string }) {
  const parsed = z.object({ name: z.string().trim().min(1), description: z.string().optional(), status: z.enum(["planificacion", "en_progreso", "pausado", "completado"]).optional(), startDate: z.string().optional(), endDate: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos de proyecto inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "operations")) return { success: false, error: "Sin acceso a operaciones." };
    const { error } = await supabase.from("ops_projects").insert({ name: parsed.data.name, description: parsed.data.description || null, status: parsed.data.status, start_date: parsed.data.startDate || null, end_date: parsed.data.endDate || null });
    if (error) return { success: false, error: "No se pudo crear el proyecto." };
    revalidatePath("/operations"); revalidatePath("/ops"); return { success: true };
  } catch { return { success: false, error: "No se pudo crear el proyecto." }; }
}

export async function getTasks() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "operations")) throw new Error("Sin acceso a operaciones.");
  const { data, error } = await supabase.from("ops_tasks").select("*").order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error("No se pudieron cargar las tareas."); return data;
}

export async function createTask(input: { projectId: string; title: string; description?: string; assignedTo?: string | null; priority?: TaskPriority; dueDate?: string }) {
  const parsed = z.object({ projectId: z.string().uuid(), title: z.string().trim().min(1), description: z.string().optional(), assignedTo: z.string().uuid().nullable().optional(), priority: z.enum(["baja", "media", "alta", "urgente"]).optional(), dueDate: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos de tarea inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "operations")) return { success: false, error: "Sin acceso a operaciones." };
    const { error } = await supabase.from("ops_tasks").insert({ project_id: parsed.data.projectId, title: parsed.data.title, description: parsed.data.description || null, assigned_to: parsed.data.assignedTo ?? null, priority: parsed.data.priority, due_date: parsed.data.dueDate || null });
    if (error) return { success: false, error: "No se pudo crear la tarea." };
    revalidatePath("/operations"); return { success: true };
  } catch { return { success: false, error: "No se pudo crear la tarea." }; }
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["pendiente", "en_progreso", "revision", "completado"]) }).safeParse({ id, status });
  if (!parsed.success) return { success: false, error: "Datos inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "operations")) return { success: false, error: "Sin acceso a operaciones." };
    const { error } = await supabase.from("ops_tasks").update({ status: parsed.data.status }).eq("id", parsed.data.id);
    if (error) return { success: false, error: "No se pudo actualizar la tarea." };
    revalidatePath("/operations"); return { success: true };
  } catch { return { success: false, error: "No se pudo actualizar la tarea." }; }
}
