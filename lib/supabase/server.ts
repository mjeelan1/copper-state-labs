import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/supabase/config";

export { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Returns null if Supabase isn't set up.
 */
export async function createClient() {
  const config = supabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies; safe to ignore until auth is added in a later module.
        }
      },
    },
  });
}

/**
 * Supabase client without cookies, for server code that runs outside a request
 * (for example, logging in lib/ai/call.ts). Returns null if Supabase isn't set up.
 */
export function createStatelessClient() {
  const config = supabaseConfig();
  return config
    ? createSupabaseClient(config.url, config.key, {
        auth: { persistSession: false },
      })
    : null;
}
