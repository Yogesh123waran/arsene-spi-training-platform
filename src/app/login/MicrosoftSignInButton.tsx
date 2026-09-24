"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/**
 * Presentational only — this build's authentication is demo-cookie or
 * Supabase email/password (see src/config/auth.ts). Wiring a real
 * Microsoft/OAuth provider is out of scope for this UI pass and would
 * touch the auth architecture, which this task explicitly preserves.
 */
export function MicrosoftSignInButton() {
  const { showToast } = useToast();

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={() =>
        showToast({
          variant: "info",
          title: "Not available in demo mode",
          description: "Microsoft sign-in will be enabled once SSO is configured.",
        })
      }
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <rect width="7" height="7" x="1" y="1" fill="#F25022" />
        <rect width="7" height="7" x="8" y="1" fill="#7FBA00" />
        <rect width="7" height="7" x="1" y="8" fill="#00A4EF" />
        <rect width="7" height="7" x="8" y="8" fill="#FFB900" />
      </svg>
      Continue with Microsoft
    </Button>
  );
}
