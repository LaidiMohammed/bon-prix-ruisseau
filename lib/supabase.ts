import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Frontend-only for now: no backend calls. Client is ready for later.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = () => supabase !== null;
