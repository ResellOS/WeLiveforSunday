/**
 * Supabase client helpers.
 *
 * - `supabase` is the browser/anon client (safe to use in Client Components).
 * - `getSupabaseAdmin()` returns a service-role client for privileged,
 *   SERVER-ONLY work (never import this into a Client Component).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface misconfiguration early rather than failing on first query.
  // (During `next build` with no env set this will warn; fill in .env.local.)
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.local.example to .env.local and fill them in.",
  );
}

/** Anonymous (public) client — respects Row Level Security. */
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
);

let adminClient: SupabaseClient | null = null;

/**
 * Service-role client. SERVER ONLY — bypasses Row Level Security.
 * Do not import this from any code that ships to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseAdmin() must never be called in the browser — it uses the service role key.",
    );
  }

  if (adminClient) return adminClient;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for the admin client.",
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
