import "server-only";
import { authService } from "./auth.service";
import { batchesRepository, BatchRepositoryError, type BatchScope } from "@/repositories/batches.repository";
import type { AuthUser } from "@/types/auth";
import type { BatchSummary } from "@/types/batch";

/**
 * Batches service — resolves the caller's identity server-side via
 * authService (never from a client-supplied argument) and derives the
 * data scope from it. Pages call this; they never call
 * batchesRepository directly. Read-only for now.
 */

export class BatchAuthorizationError extends Error {
  constructor(message = "You don't have permission to view batches.") {
    super(message);
    this.name = "BatchAuthorizationError";
  }
}

/**
 * Admin: every batch. Trainer: batches currently assigned to them
 * (trainers.id = the auth user id), in all statuses. Anyone else is
 * refused. RLS enforces the same boundaries in the database; this
 * scope is the second layer behind the portal RoleGuard/middleware.
 */
function resolveScope(user: AuthUser): BatchScope {
  switch (user.role) {
    case "admin":
      return { kind: "all" };
    case "trainer":
      return { kind: "trainer", trainerId: user.id };
    default:
      throw new BatchAuthorizationError();
  }
}

async function requireUser(): Promise<AuthUser> {
  const user = await authService.getCurrentUser();
  if (!user) throw new BatchAuthorizationError("You need to be signed in.");
  return user;
}

export const batchesService = {
  /** Batches visible to the current user, honouring their role scope. */
  async listBatches(): Promise<BatchSummary[]> {
    const user = await requireUser();
    return batchesRepository.findAll(resolveScope(user));
  },
};

export { BatchRepositoryError };
