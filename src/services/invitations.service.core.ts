/**
 * Invitations service (Phase 7 P3.4) — Super Admin invitation sending.
 *
 *   create_user_invitation()        caller's session  (who may invite whom; address rules)
 *        ↓
 *   begin_invitation_delivery()     caller's session  (scope, pending/unexpired, lock,
 *        ↓                                             60 s cooldown, ≤5 resends; returns the address)
 *   auth.admin.inviteUserByEmail()  service role      (address from the step above only)
 *        ↓
 *   record_invitation_delivery()    service role      (sent / failed, Auth-account binding)
 *
 * Identity comes from getCurrentUser (the server session); only an
 * active Super Admin may use this service in P3.4. The database decides
 * every rule; this service only sequences the calls and turns every
 * answer into one InvitationSendOutcome. It never retries an Auth invite
 * on its own and never writes invitation rows directly — in particular,
 * when Auth sent the email but recording failed, it reports
 * "sent_unrecorded" and leaves the database exactly as
 * begin_invitation_delivery left it.
 *
 * Observability: every delivery attempt that does not end in "sent"
 * writes exactly one server log line with the invitation id, the outcome
 * kind and safe codes (never an address, token or raw error).
 *
 * Factory without `server-only` so it can be tested with fakes and
 * against a local database; invitations.service.ts wires the real parts.
 */
import type { AuthUser } from "@/types/auth";
import type { InvitationCreateRefusal, InvitationDeliverRefusal, InvitationSendOutcome } from "@/types/user-management";
import { asCreateRefusal, asDeliverRefusal, buildInvitationPayload, type InviteUserInput } from "@/lib/user-management/invitations";
import { isUuid } from "@/lib/user-management/lifecycle";
import { InvitationsFunctionError, InvitationsRepositoryError, type InvitationsRepository } from "@/repositories/invitations.repository.core";
import type { AuthAdminDelivery, AuthAdminRepository } from "@/repositories/auth-admin.repository.core";

export class InvitationsAuthorizationError extends Error {
  constructor(message = "Only Super Admins can send invitations.") {
    super(message);
    this.name = "InvitationsAuthorizationError";
  }
}

/** Invalid input refused before any database call; the message is safe to show. */
export class InvitationsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationsInputError";
  }
}

export interface InvitationsServiceDeps {
  invitations: InvitationsRepository;
  authAdmin: AuthAdminRepository;
  getCurrentUser: () => Promise<AuthUser | null>;
  /** The confirmation redirect from configuration (null = not safely configured). */
  redirectUrl: () => string | null;
  isDemoMode?: () => boolean;
}

/** Raised database errors → a refusal reason, by SQLSTATE only. */
function raisedReason(err: unknown): "permission" | "invalid" | "already_invited" | null {
  if (!(err instanceof InvitationsFunctionError)) return null;
  if (err.code === "42501") return "permission";
  if (err.code === "23505") return "already_invited"; // concurrent create hit the one-pending-per-address index
  if (err.code === "22023" || err.code === "22P02" || err.code === "23514") return "invalid";
  return null;
}

/** One safe diagnostic line per non-success delivery: invitation id, outcome kind, codes. */
function logDelivery(invitationId: string, kind: string, fields: Record<string, string | boolean>) {
  const detail = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.error(`[invitations] delivery ${kind}: invitation=${invitationId} ${detail}`);
}

/** An unrecognised refusal code from the database is an error, never passed on as a reason. */
function unexpectedRefusal(stage: string, reason: string): never {
  console.error(`[invitations] unexpected ${stage} refusal code: ${reason}`);
  throw new InvitationsRepositoryError();
}

export function createInvitationsService(deps: InvitationsServiceDeps) {
  async function requireSuperAdmin(): Promise<AuthUser> {
    const user = await deps.getCurrentUser();
    if (!user) throw new InvitationsAuthorizationError("You need to be signed in.");
    if (user.role !== "admin") throw new InvitationsAuthorizationError();
    return user;
  }

  /** The safe redirect plus one service-role client for this operation — or null when sending isn't configured. */
  function openSending(): { redirectTo: string; delivery: AuthAdminDelivery } | null {
    if (deps.isDemoMode?.()) return null;
    const redirectTo = deps.redirectUrl();
    if (!redirectTo) return null;
    const delivery = deps.authAdmin.openDelivery();
    return delivery ? { redirectTo, delivery } : null;
  }

  async function deliver(invitationId: string, sending: { redirectTo: string; delivery: AuthAdminDelivery }): Promise<InvitationSendOutcome> {
    // 1. Database authorization of this attempt (caller's session).
    let begun;
    try {
      begun = await deps.invitations.beginDelivery(invitationId);
    } catch (err) {
      const reason = raisedReason(err);
      if (reason === "permission" || reason === "invalid") return { kind: "refused", stage: "deliver", reason, invitationId };
      throw err;
    }
    if (!begun.ok) {
      const reason: InvitationDeliverRefusal = asDeliverRefusal(begun.reason) ?? unexpectedRefusal("delivery", begun.reason);
      return {
        kind: "refused",
        stage: "deliver",
        reason,
        invitationId,
        ...(begun.retryAfterSeconds !== undefined ? { retryAfterSeconds: begun.retryAfterSeconds } : {}),
      };
    }

    // 2. Auth Admin, with the database-owned address only.
    const sent = await sending.delivery.inviteUserByEmail(begun.email, sending.redirectTo);

    if (sent.kind === "unknown") {
      // No definite answer: nothing is recorded (the email may have gone out).
      logDelivery(invitationId, "delivery_unknown", { auth: sent.diagnostic });
      return { kind: "delivery_unknown", invitationId };
    }
    if (sent.kind === "refused") {
      const recorded = await sending.delivery.recordDelivery(invitationId, false, null);
      logDelivery(invitationId, "delivery_failed", {
        reason: sent.failure,
        auth: sent.diagnostic,
        recorded: recorded.ok,
        ...(recorded.ok ? {} : { record: recorded.reason }),
      });
      return { kind: "delivery_failed", invitationId, reason: sent.failure, recorded: recorded.ok };
    }

    // 3. Auth sent it: record the outcome and the Auth account (service role, same client).
    const recorded = await sending.delivery.recordDelivery(invitationId, true, sent.authUserId);
    if (!recorded.ok) {
      // Distinct from a delivery failure: the email went out. No second invite, no compensating write.
      logDelivery(invitationId, "sent_unrecorded", { record: recorded.reason });
      return { kind: "sent_unrecorded", invitationId };
    }
    return { kind: "sent", invitationId, attempt: begun.attempt };
  }

  return {
    /** Create an invitation (database rules) and send it. */
    async inviteUser(input: InviteUserInput | null | undefined): Promise<InvitationSendOutcome> {
      await requireSuperAdmin();
      const sending = openSending();
      if (!sending) return { kind: "unavailable", invitationId: null, reason: "not_configured" };
      const payload = buildInvitationPayload(input);
      if (!payload.ok) throw new InvitationsInputError(payload.error);

      let created;
      try {
        created = await deps.invitations.createInvitation(payload.value);
      } catch (err) {
        const reason = raisedReason(err);
        if (reason) return { kind: "refused", stage: "create", reason, invitationId: null };
        throw err;
      }
      if (!created.ok) {
        const reason: InvitationCreateRefusal = asCreateRefusal(created.reason) ?? unexpectedRefusal("create", created.reason);
        return { kind: "refused", stage: "create", reason, invitationId: null };
      }
      return deliver(created.invitationId, sending);
    },

    /** Resend a pending invitation (the database enforces cooldown, cap and expiry). */
    async resendInvitation(invitationId: unknown): Promise<InvitationSendOutcome> {
      await requireSuperAdmin();
      if (!isUuid(invitationId)) return { kind: "refused", stage: "deliver", reason: "not_found", invitationId: null };
      const sending = openSending();
      if (!sending) return { kind: "unavailable", invitationId, reason: "not_configured" };
      return deliver(invitationId, sending);
    },
  };
}

export type InvitationsService = ReturnType<typeof createInvitationsService>;
