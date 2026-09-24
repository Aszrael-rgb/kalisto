import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, Database, Department } from "@/lib/types/database.types";

export type ProtectedDepartment = Exclude<Department, never>;
export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type AuthorizedContext = {
  supabase: SupabaseClient<Database>;
  user: User;
  profile: CurrentProfile;
};

export async function requireUser(): Promise<AuthorizedContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, department, created_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("No se encontró el perfil del usuario.");
  }

  return { supabase, user, profile };
}

export function canAccessDepartment(
  profile: CurrentProfile,
  department: ProtectedDepartment,
  recordUserId?: string,
): boolean {
  if (profile.role === "administrador" || profile.role === "manager") {
    return true;
  }

  return profile.department === department
    && (recordUserId === undefined || recordUserId === profile.id);
}

export function canManageDepartment(
  profile: CurrentProfile,
  department: ProtectedDepartment,
): boolean {
  return profile.role === "administrador"
    || profile.role === "manager"
    || (profile.role === "empleado" && profile.department === department);
}

export function canManageApprovals(profile: CurrentProfile): boolean {
  return profile.role === "administrador" || profile.role === "manager";
}

export function isRole(value: string): value is AppRole {
  return value === "administrador" || value === "manager" || value === "empleado";
}
