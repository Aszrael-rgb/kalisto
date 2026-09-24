import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database.types";

export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseEnvironment();

  return createBrowserClient<Database>(url, anonKey);
}
