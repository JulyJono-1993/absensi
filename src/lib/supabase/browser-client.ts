import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "";

const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

let browserClient: SupabaseClient | null = null;

export function createBrowserClient() {
  if (!url || !key) {
    throw new Error("Missing Supabase env variables");
  }

  if (!browserClient) {
    browserClient = createClient(url, key);
  }

  return browserClient;
}
