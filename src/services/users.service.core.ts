/**
 * Users service (Phase 7 P3.2) — the read-only Users view for Super
 * Admins.
 *
 * Identity always comes from getCurrentUser (the server session), never
 * from a client argument. Only an active Super Admin ("admin") may list
 * users; everyone else is refused here, in addition to the admin
 * portal's middleware/RoleGuard, and RLS still decides every row the
 * repository returns. URL filters are validated against fixed
 * whitelists and can only narrow the rows already authorized.
 *
 * Factory without `server-only` so it can be tested against a local
 * database; users.service.ts wires the real session.
 */
import type { AuthUser } from "@/types/auth";
import type { UserListPage } from "@/types/user-management";
import { USERS_PAGE_SIZE, buildUserListPage, parseUserListFilters } from "@/lib/user-management/users";
import type { UsersRepository } from "@/repositories/users.repository.core";

export class UsersAuthorizationError extends Error {
  constructor(message = "Only Super Admins can view users.") {
    super(message);
    this.name = "UsersAuthorizationError";
  }
}

export interface UsersServiceDeps {
  repository: UsersRepository;
  getCurrentUser: () => Promise<AuthUser | null>;
  /** Demo mode has no profiles: the view is empty rather than invented. */
  isDemoMode?: () => boolean;
  pageSize?: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function createUsersService(deps: UsersServiceDeps) {
  async function requireSuperAdmin(): Promise<AuthUser> {
    const user = await deps.getCurrentUser();
    if (!user) throw new UsersAuthorizationError("You need to be signed in.");
    // "admin" is the application name for the super_admin profile role.
    if (user.role !== "admin") throw new UsersAuthorizationError();
    return user;
  }

  return {
    /** One page of users for the given URL search params. */
    async listUsers(searchParams: SearchParams | null | undefined): Promise<UserListPage> {
      await requireSuperAdmin();
      const filters = parseUserListFilters(searchParams);
      const records = deps.isDemoMode?.() ? [] : await deps.repository.listProfiles();
      return buildUserListPage(records, filters, deps.pageSize ?? USERS_PAGE_SIZE);
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
