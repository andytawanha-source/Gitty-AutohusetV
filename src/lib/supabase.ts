import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true når der ikke er konfigureret et Supabase-projekt – appen kører så i demo-mode med lokale mockdata. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase er ikke konfigureret. Sæt VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY i .env (se .env.example)."
    );
  }
  if (!client) {
    client = createClient(url!, anonKey!);
  }
  return client;
}
