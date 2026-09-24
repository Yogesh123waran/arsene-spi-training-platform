import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request that passes
 * through middleware, per the current @supabase/ssr Next.js pattern.
 * This keeps the access token from silently expiring between
 * requests — without it, a Server Component could see a valid-looking
 * but stale/expired session.
 *
 * Returns the (possibly cookie-updated) response plus the resolved
 * user, so the caller (middleware.ts) can also make routing decisions
 * without a second round trip.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return { response, user: null };
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { response, user };
  } catch (err) {
    // Supabase unreachable — fail closed (treat as unauthenticated)
    // rather than throwing inside middleware, which would 500 every
    // request. Route protection below then redirects to /login as
    // it would for any other unauthenticated visitor.
    console.error("[auth] middleware session refresh failed unexpectedly:", err instanceof Error ? err.message : err);
    return { response, user: null };
  }
}
