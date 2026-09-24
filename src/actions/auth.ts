"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Introduce un email válido."),
  password: z.string().min(1, "Introduce tu contraseña."),
});

export type LoginState = {
  error: string | null;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsedCredentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedCredentials.success) {
    return {
      error: parsedCredentials.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsedCredentials.data);

  if (error) {
    return {
      error: "El email o la contraseña no son válidos.",
    };
  }

  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
