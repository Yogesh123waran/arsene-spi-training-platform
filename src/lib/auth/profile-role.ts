import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRoleColumn, Database } from "@/lib/supabase/types";
import type { UserRole } from "@/types/user";

/**
 * Production (Supabase) role resolution — the ONLY place the app
 * derives a role for a Supabase user.
 *
 * The role comes exclusively from public.profiles.role (see
 * supabase/migrations/0002_profiles_roles.sql), read through the
 * caller's own RLS-scoped client. `user_metadata` is user-writable
 * (supabase.auth.updateUser / signUp) and is never consulted here.
 *
 * Fails closed: any error, missing profile or unrecognised value
 * yields `null`, which every caller treats as "not authorized".
 * There is no default role.
 *
 * Kept free of `server-only` / `next/headers` so the same logic runs
 * in the Edge middleware and in server components/actions.
 *
 * Demo mode never calls this — it has its own, separate cookie-based
 * identity (src/lib/auth/session.ts).
 */

/**
 * Database role -> application role. The database uses the explicit
 * name `super_admin`; the application has always called that role
 * `admin` (routes under /admin, labelled "Super Admin" in the UI via
 * ROLE_LABEL). Mapping here, at the boundary, keeps every existing
 * route, guard and permission unchanged.
 */
const DB_ROLE_TO_USER_ROLE: Record<AppRoleColumn, UserRole> = {
  super_admin: "admin",
  trainer: "trainer",
  student: "student",
};

function isAppRole(value: unknown): value is AppRoleColumn {
  return value === "super_admin" || value === "trainer" || value === "student";
}

export function mapProfileRole(value: unknown): UserRole | null {
  return isAppRole(value) ? DB_ROLE_TO_USER_ROLE[value] : null;
}

export async function fetchProfileRole(
  supabase: SupabaseClient<Database, "public">,
  userId: string
): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

    if (error) {
      console.error("[auth] profile role lookup failed:", error.message);
      return null;
    }

    if (!data) {
      console.warn(`[auth] Supabase user ${userId} has no profile; access denied.`);
      return null;
    }

    const role = mapProfileRole(data.role);
    if (!role) {
      console.warn(`[auth] Supabase user ${userId} has an unrecognised profile role; access denied.`);
    }
    return role;
  } catch (err) {
    console.error("[auth] profile role lookup failed unexpectedly:", err instanceof Error ? err.message : err);
    return null;
  }
}
