import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

/*
 * Resolve the signed-in user from the Supabase session cookie, on the
 * server. getUser() validates the JWT with Supabase Auth on every call
 * (it does not just decode the cookie), so the returned id can be
 * trusted. Server routes must use THIS id and never a userId, role,
 * price or status sent in a request body.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        /* Read-only in a route handler. */
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
