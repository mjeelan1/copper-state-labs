import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/supabase/config";

export { isSupabaseConfigured } from "@/lib/supabase/config";

/** Supabase client for Client Components. Returns null if Supabase isn't set up. */
export function createClient() {
  const config = supabaseConfig();
  return config ? createBrowserClient(config.url, config.key) : null;
}
