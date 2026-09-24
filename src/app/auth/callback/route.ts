import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback — completes the PKCE/email-link flow by
 * exchanging the one-time `code` for a session (writing the session
 * cookies via the server client's `setAll`), then redirects on:
 *   - email confirmation / magic link  -> `next` (defaults to "/")
 *   - password reset link              -> "/reset-password"
 *   - anything invalid/expired/missing -> "/login" with an error flag
 *
 * Only relevant when authConfig.mode === "supabase" — demo mode never
 * issues links that point here.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_callback`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth_not_configured`);
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=expired_callback`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[auth] callback exchangeCodeForSession failed unexpectedly:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${origin}/login?error=expired_callback`);
  }
}
