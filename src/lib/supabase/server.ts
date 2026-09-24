import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database.types";

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnvironment();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components pueden no permitir modificar cookies.
        }
      },
    },
  });
}
