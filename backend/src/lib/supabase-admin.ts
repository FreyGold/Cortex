import { createClient } from "@supabase/supabase-js";
import { PostgrestClient } from "@supabase/postgrest-js";
import { getNeonAnonymousToken } from "./neon-auth-session";

function getNeonDataClient(accessToken?: string) {
  const url = process.env.NEON_DATA_API_URL;
  if (!url) return null;
  const endpoint = new URL(url);
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") {
    throw new Error("NEON_DATA_API_URL must use HTTPS.");
  }
  const client = new PostgrestClient(url.replace(/\/$/, ""), {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    fetch: accessToken ? undefined : async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${await getNeonAnonymousToken()}`);
      return fetch(input, { ...init, headers });
    },
  });
  return client as unknown as ReturnType<typeof createClient<any>>;
}

let cachedClient: ReturnType<typeof createClient<any>> | null = null;
let cachedAnonClient: ReturnType<typeof createClient<any>> | null = null;
// Cache for user clients
const userClientCache = new Map<string, { client: ReturnType<typeof createClient<any>>; expiry: number }>();
const CLIENT_CACHE_TTL = 60 * 1000; // 1 minute

export function getSupabaseAdmin() {
  if (process.env.NEON_DATA_API_URL) {
    throw new Error("Use the signed-in administrator's data client for Neon.");
  }
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing required environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  cachedClient = createClient<any>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return cachedClient;
}

export function getSupabaseAnonClient() {
  const neon = getNeonDataClient();
  if (neon) return neon;
  if (cachedAnonClient) {
    return cachedAnonClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration env vars.");
  }

  cachedAnonClient = createClient<any>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAnonClient;
}

export function getSupabaseUserClient(accessToken: string) {
  const neon = getNeonDataClient(accessToken);
  if (neon) return neon;
  // Check cache
  const cached = userClientCache.get(accessToken);
  if (cached && cached.expiry > Date.now()) {
    return cached.client;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration env vars.");
  }

  const client = createClient<any>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Performance: disable realtime and other unused features in backend
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  });

  // Save to cache
  userClientCache.set(accessToken, {
    client,
    expiry: Date.now() + CLIENT_CACHE_TTL,
  });

  return client;
}
