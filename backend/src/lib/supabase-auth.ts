import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseAuth() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing required environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  cachedClient = createClient<any>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
