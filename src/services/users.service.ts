import "server-only";
import { authConfig } from "@/config/auth";
import { authService } from "./auth.service";
import { usersRepository } from "@/repositories/users.repository";
import { createUsersService } from "./users.service.core";

/**
 * The Users service bound to the real session (authService) and the
 * caller's own Supabase client (RLS applies; changes go through the
 * 0017 database functions).
 */
export const usersService = createUsersService({
  repository: usersRepository,
  getCurrentUser: () => authService.getCurrentUser(),
  isDemoMode: () => authConfig.mode === "demo",
});

export { UsersActionError, UsersAuthorizationError } from "./users.service.core";
export { UsersRepositoryError } from "@/repositories/users.repository";
