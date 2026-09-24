"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type {
  AppRole,
  Database,
  Department,
} from "@/lib/types/database.types";

export type UserProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "role" | "department"
>;

export type UpdateUserAccessResult =
  | { success: true }
  | { success: false; error: string };

const roleSchema = z.enum(["administrador", "manager", "empleado"]);
const departmentSchema = z.enum([
  "crm",
  "inventory",
  "finance",
  "hr",
  "operations",
]);

async function requireAdministrator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "administrador") {
    throw new Error("No tienes permisos para gestionar usuarios.");
  }

  return supabase;
}

export async function getUsers(): Promise<UserProfile[]> {
  const supabase = await requireAdministrator();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department")
    .order("full_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error("No se pudieron cargar los usuarios.");
  }

  return data;
}

export async function updateUserAccess(
  userId: string,
  role: AppRole,
  department: Department | null,
): Promise<UpdateUserAccessResult> {
  const parsedUserId = z.string().uuid().safeParse(userId);
  const parsedRole = roleSchema.safeParse(role);
  const parsedDepartment = departmentSchema.nullable().safeParse(department);

  if (!parsedUserId.success || !parsedRole.success || !parsedDepartment.success) {
    return { success: false, error: "Los datos de acceso no son válidos." };
  }

  try {
    const supabase = await requireAdministrator();
    const { error } = await supabase
      .from("profiles")
      .update({
        role: parsedRole.data,
        department: parsedDepartment.data,
      })
      .eq("id", parsedUserId.data);

    if (error) {
      return { success: false, error: "No se pudo actualizar el acceso." };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "No tienes permisos para gestionar usuarios." };
  }
}