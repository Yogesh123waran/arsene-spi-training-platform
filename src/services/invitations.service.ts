import "server-only";
import { authConfig } from "@/config/auth";
import { authService } from "./auth.service";
import { invitationsRepository } from "@/repositories/invitations.repository";
import { authAdminRepository } from "@/repositories/auth-admin.repository";
import { invitationRedirectUrl } from "@/lib/user-management/invitations";
import { createInvitationsService } from "./invitations.service.core";

/**
 * The invitations service bound to the real session (authService), the
 * caller's own Supabase client for the database decisions, and the
 * server-only Auth Admin repository for sending. The confirmation
 * redirect comes from NEXT_PUBLIC_APP_URL only.
 */
export const invitationsService = createInvitationsService({
  invitations: invitationsRepository,
  authAdmin: authAdminRepository,
  getCurrentUser: () => authService.getCurrentUser(),
  redirectUrl: () => invitationRedirectUrl(process.env.NEXT_PUBLIC_APP_URL),
  isDemoMode: () => authConfig.mode === "demo",
});

export { InvitationsAuthorizationError, InvitationsInputError } from "./invitations.service.core";
export { InvitationsRepositoryError } from "@/repositories/invitations.repository";
