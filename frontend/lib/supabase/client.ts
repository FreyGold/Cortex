import { createBrowserClient } from "@supabase/ssr";

function getSupabasePublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function getAccessToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
