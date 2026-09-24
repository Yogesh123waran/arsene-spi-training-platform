import type { UserRole } from "@/types/user";

/**
 * Central role → route mapping. Keeps "where does this role land"
 * logic in one place instead of scattered redirect() calls.
 */
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  admin: "/admin",
  trainer: "/trainer",
  student: "/student",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Super Admin",
  trainer: "Trainer",
  student: "Student",
};

export function getHomeRouteForRole(role: UserRole): string {
  return ROLE_HOME_ROUTE[role];
}

/** Which portal (route prefix) a given pathname belongs to, if any. */
export function getPortalForPath(pathname: string): UserRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/trainer" || pathname.startsWith("/trainer/")) return "trainer";
  if (pathname === "/student" || pathname.startsWith("/student/")) return "student";
  return null;
}
