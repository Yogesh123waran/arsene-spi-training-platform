"use server";

/**
 * Server Actions — the RPC boundary the Add Student / Add Trainer
 * dialogs call (Phase 7 P3.4). Each action delegates to
 * invitationsService, which resolves the caller from the authenticated
 * session (Super Admin only) and lets the database decide every rule.
 *
 * The ROLE is fixed here, per action — never taken from the browser:
 * inviteStudentAction always invites a student, inviteTrainerAction a
 * trainer, and only the fields of that kind are copied from the input
 * (anything else the browser sends, including a role, is dropped).
 * Results are plain and safe: an InvitationSendOutcome with its message,
 * or a fixed error sentence. Raw database/Auth errors never leave the
 * server, and nothing personal is logged.
 */

import { revalidatePath } from "next/cache";
import { invitationsService, InvitationsAuthorizationError, InvitationsInputError } from "./invitations.service";
import { GENERIC_INVITATION_ERROR, invitationOutcomeMessage } from "@/lib/user-management/invitations";
import type {
  InvitationActionResult,
  InvitationSendOutcome,
  StudentInvitationInput,
  TrainerInvitationInput,
} from "@/types/user-management";

const asObject = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Pages showing accounts or their status after any operation that may have changed an invitation. */
function revalidateUserPages() {
  revalidatePath("/admin/students");
  revalidatePath("/admin/trainers");
  revalidatePath("/admin/users");
}

async function run(context: string, fn: () => Promise<InvitationSendOutcome>): Promise<InvitationActionResult> {
  try {
    const outcome = await fn();
    // Anything past "refused before creation" / "not configured" touched the database.
    if (!(outcome.kind === "unavailable" || (outcome.kind === "refused" && outcome.stage === "create"))) revalidateUserPages();
    return { status: "outcome", outcome, message: invitationOutcomeMessage(outcome) };
  } catch (err) {
    // These carry messages written to be shown to users.
    if (err instanceof InvitationsAuthorizationError || err instanceof InvitationsInputError) return { status: "error", error: err.message };
    // Error name only: messages of unexpected errors could contain personal data.
    console.error(`[invitations.actions] ${context}:`, err instanceof Error ? err.name : "unknown error");
    return { status: "error", error: GENERIC_INVITATION_ERROR };
  }
}

/** Invite a student (role fixed to student). */
export async function inviteStudentAction(input: StudentInvitationInput): Promise<InvitationActionResult> {
  const s = asObject(input);
  return run("inviteStudent", () =>
    invitationsService.inviteUser({
      role: "student",
      email: s.email,
      fullName: s.fullName,
      phone: s.phone,
      organization: s.organization,
      designation: s.designation,
      batchId: s.batchId,
    })
  );
}

/** Invite a trainer (role fixed to trainer). */
export async function inviteTrainerAction(input: TrainerInvitationInput): Promise<InvitationActionResult> {
  const t = asObject(input);
  return run("inviteTrainer", () =>
    invitationsService.inviteUser({
      role: "trainer",
      email: t.email,
      fullName: t.fullName,
      phone: t.phone,
      specializations: t.specializations,
    })
  );
}

/** Resend the invitation the dialog just created (the database enforces cooldown, cap and expiry). */
export async function resendInvitationAction(invitationId: string): Promise<InvitationActionResult> {
  return run("resendInvitation", () => invitationsService.resendInvitation(invitationId));
}
