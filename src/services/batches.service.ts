import "server-only";
import { authService } from "./auth.service";
import { batchesRepository, BatchRepositoryError, type BatchScope } from "@/repositories/batches.repository";
import { getClassFilterOptions } from "@/lib/classes/filter-options";
import {
  BatchCreateAuthorizationError,
  BatchCreateValidationError,
  classifyBatchInsertError,
  createBatchWith,
} from "@/lib/batches/create-batch";
import type { AuthUser } from "@/types/auth";
import type { BatchFormOptions, BatchSummary, CreateBatchInput } from "@/types/batch";

/**
 * Batches service — resolves the caller's identity server-side via
 * authService (never from a client-supplied argument) and derives the
 * data scope from it. Pages call this; they never call
 * batchesRepository directly. Lists batches, and creates them (Super
 * Admin only); View/Edit are not implemented yet.
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

/**
 * Course and trainer choices for the Add Batch form — the same lists the
 * Classes form uses (published courses, active trainers), read with the
 * caller's own session.
 */
async function loadBatchFormOptions(): Promise<BatchFormOptions> {
  const options = await getClassFilterOptions();
  return { courses: options.courses, trainers: options.trainers };
}

export const batchesService = {
  /** Batches visible to the current user, honouring their role scope. */
  async listBatches(): Promise<BatchSummary[]> {
    const user = await requireUser();
    return batchesRepository.findAll(resolveScope(user));
  },

  /** Options for the Add Batch form (Super Admin only). */
  async getCreateBatchOptions(): Promise<BatchFormOptions> {
    const user = await requireUser();
    if (user.role !== "admin") throw new BatchCreateAuthorizationError();
    return loadBatchFormOptions();
  },

  /**
   * Create a batch (Super Admin only), always as "upcoming". Validates
   * code, name, course, optional trainer, dates and seats; the database
   * (RLS + constraints) remains the final authority.
   */
  async createBatch(input: CreateBatchInput): Promise<{ id: string }> {
    return createBatchWith(
      {
        getCurrentUser: () => authService.getCurrentUser(),
        getOptions: loadBatchFormOptions,
        insert: (clean, createdBy) => batchesRepository.create(clean, createdBy),
        classify: classifyBatchInsertError,
      },
      input
    );
  },
};

export { BatchRepositoryError, BatchCreateAuthorizationError, BatchCreateValidationError };
