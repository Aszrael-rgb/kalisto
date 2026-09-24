type SupabaseEnvironmentVariable =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function getRequiredEnvironmentVariable(
  name: SupabaseEnvironmentVariable,
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseEnvironment(): {
  url: string;
  anonKey: string;
} {
  return {
    url: getRequiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
