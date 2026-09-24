import "server-only";
import { authService } from "./auth.service";
import { classesRepository, ClassRepositoryError, type ClassScope } from "@/repositories/classes.repository";
import { DEMO_STUDENT_BATCH_ID, DEMO_TRAINER_ID } from "@/lib/mock/classes.mock";
import { authConfig } from "@/config/auth";
import type {
  ClassFilters,
  ClassSummaryCounts,
  ClassValidationErrors,
  ClassWithRelations,
  CreateClassInput,
  UpdateClassInput,
} from "@/types/class";
import type { AuthUser } from "@/types/auth";

/**
 * Classes service — business rules, validation and authorization.
 *
 * Every exported function resolves the caller's identity server-side
 * via authService (never from a client-supplied argument) and derives
 * the data scope from it. UI code and Server Actions call this; they
 * never call classesRepository directly.
 */

export class ClassAuthorizationError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ClassAuthorizationError";
  }
}

export class ClassValidationError extends Error {
  readonly errors: ClassValidationErrors;
  constructor(errors: ClassValidationErrors) {
    super("The class details are invalid.");
    this.name = "ClassValidationError";
    this.errors = errors;
  }
}

// -------------------------------------------------------------------
// Scope resolution
// -------------------------------------------------------------------

/**
 * Maps the authenticated user to the slice of class data they may
 * see. Admin: everything. Trainer: their own classes. Student: their
 * enrolled batch's classes.
 *
 * NOTE (temporary, Phase 1): trainerId/batchId are taken from the
 * user's auth id, and in demo mode from the fixed demo identities.
 * The real mapping (trainer profile row, student→batch enrolment)
 * arrives with those tables in a later phase — at which point only
 * this function changes.
 */
function resolveScope(user: AuthUser): ClassScope {
  switch (user.role) {
    case "admin":
      return {};
    case "trainer":
      return { trainerId: authConfig.mode === "demo" ? DEMO_TRAINER_ID : user.id };
    case "student":
      return { batchId: authConfig.mode === "demo" ? DEMO_STUDENT_BATCH_ID : user.id };
    default:
      // Unknown role — fail closed with a scope that matches nothing.
      return { batchId: "__no_access__" };
  }
}

async function requireUser(): Promise<AuthUser> {
  const user = await authService.getCurrentUser();
  if (!user) throw new ClassAuthorizationError("You need to be signed in.");
  return user;
}

function canManage(user: AuthUser): boolean {
  return user.role === "admin" || user.role === "trainer";
}

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Shared by create (full input) and update (partial patch). */
export function validateClassInput(input: Partial<CreateClassInput>, requireAll: boolean): ClassValidationErrors {
  const errors: ClassValidationErrors = {};

  if (requireAll || input.courseId !== undefined) {
    if (!input.courseId?.trim()) errors.courseId = "Course is required.";
  }
  if (requireAll || input.batchId !== undefined) {
    if (!input.batchId?.trim()) errors.batchId = "Batch is required.";
  }
  if (requireAll || input.trainerId !== undefined) {
    if (!input.trainerId?.trim()) errors.trainerId = "Trainer is required.";
  }
  if (requireAll || input.title !== undefined) {
    if (!input.title?.trim()) errors.title = "Class title is required.";
    else if (input.title.trim().length > 200) errors.title = "Title must be 200 characters or fewer.";
  }
  if (requireAll || input.classDate !== undefined) {
    if (!input.classDate?.trim()) errors.classDate = "Date is required.";
    else if (!DATE_PATTERN.test(input.classDate)) errors.classDate = "Enter a valid date.";
  }
  if (requireAll || input.startTime !== undefined) {
    if (!input.startTime?.trim()) errors.startTime = "Start time is required.";
    else if (!TIME_PATTERN.test(input.startTime)) errors.startTime = "Enter a valid time (HH:MM).";
  }
  if (requireAll || input.endTime !== undefined) {
    if (!input.endTime?.trim()) errors.endTime = "End time is required.";
    else if (!TIME_PATTERN.test(input.endTime)) errors.endTime = "Enter a valid time (HH:MM).";
  }

  // End must be after start — only checkable when both are present and well-formed.
  if (
    input.startTime &&
    input.endTime &&
    TIME_PATTERN.test(input.startTime) &&
    TIME_PATTERN.test(input.endTime) &&
    input.endTime <= input.startTime
  ) {
    errors.endTime = "End time must be after the start time.";
  }

  if (input.teamsMeetingUrl != null && input.teamsMeetingUrl.trim() !== "") {
    if (!isValidHttpUrl(input.teamsMeetingUrl.trim())) {
      errors.teamsMeetingUrl = "Enter a valid meeting link starting with http:// or https://";
    }
  }

  return errors;
}

/** Trim strings and normalise empty optional fields to null before persisting. */
function normalise(input: CreateClassInput): CreateClassInput {
  const trimOrNull = (v: string | null) => {
    const t = v?.trim();
    return t ? t : null;
  };

  return {
    ...input,
    courseId: input.courseId.trim(),
    moduleId: trimOrNull(input.moduleId),
    batchId: input.batchId.trim(),
    trainerId: input.trainerId.trim(),
    title: input.title.trim(),
    description: trimOrNull(input.description),
    teamsMeetingUrl: trimOrNull(input.teamsMeetingUrl),
    notes: trimOrNull(input.notes),
  };
}

// -------------------------------------------------------------------
// Service
// -------------------------------------------------------------------

export const classesService = {
  /** Classes visible to the current user, honouring their role scope. */
  async listClasses(filters: ClassFilters = {}): Promise<ClassWithRelations[]> {
    const user = await requireUser();
    return classesRepository.findAll(filters, resolveScope(user));
  },

  /** A single class, or null if it doesn't exist *or* is out of the caller's scope. */
  async getClass(id: string): Promise<ClassWithRelations | null> {
    const user = await requireUser();
    return classesRepository.findById(id, resolveScope(user));
  },

  /** Counts for the dashboard/summary cards, computed from the caller's own scope. */
  async getSummary(): Promise<ClassSummaryCounts> {
    const user = await requireUser();
    const all = await classesRepository.findAll({}, resolveScope(user));
    const today = new Date().toISOString().slice(0, 10);

    return {
      today: all.filter((c) => c.classDate === today && c.status !== "cancelled").length,
      upcoming: all.filter((c) => c.classDate > today && c.status !== "cancelled").length,
      completed: all.filter((c) => c.status === "completed").length,
      cancelled: all.filter((c) => c.status === "cancelled").length,
    };
  },

  async createClass(input: CreateClassInput): Promise<ClassWithRelations> {
    const user = await requireUser();
    if (!canManage(user)) throw new ClassAuthorizationError("Only admins and trainers can create classes.");

    const errors = validateClassInput(input, true);
    if (Object.keys(errors).length > 0) throw new ClassValidationError(errors);

    const clean = normalise(input);

    // A trainer may only ever create classes assigned to themselves —
    // enforced here as well as by RLS, so a forged trainerId in the
    // form payload can't reassign the class.
    if (user.role === "trainer") {
      const ownId = authConfig.mode === "demo" ? DEMO_TRAINER_ID : user.id;
      clean.trainerId = ownId;
    }

    return classesRepository.create(clean, user.id);
  },

  async updateClass(id: string, patch: UpdateClassInput): Promise<ClassWithRelations> {
    const user = await requireUser();
    if (!canManage(user)) throw new ClassAuthorizationError("Only admins and trainers can edit classes.");

    const errors = validateClassInput(patch, false);

    // A partial patch can still break the time range against values
    // already stored, so re-validate against the persisted row.
    if (patch.startTime || patch.endTime) {
      const existing = await classesRepository.findById(id, resolveScope(user));
      if (!existing) throw new ClassAuthorizationError("That class doesn't exist or isn't available to you.");
      const start = patch.startTime ?? existing.startTime;
      const end = patch.endTime ?? existing.endTime;
      if (end <= start) errors.endTime = "End time must be after the start time.";
    }

    if (Object.keys(errors).length > 0) throw new ClassValidationError(errors);

    const scope = resolveScope(user);
    // Trainers can't reassign a class to someone else.
    if (user.role === "trainer") delete patch.trainerId;

    return classesRepository.update(id, patch, scope);
  },

  /** Cancelling is a status change, not a delete — history is preserved. */
  async cancelClass(id: string): Promise<ClassWithRelations> {
    const user = await requireUser();
    if (!canManage(user)) throw new ClassAuthorizationError("Only admins and trainers can cancel classes.");
    return classesRepository.update(id, { status: "cancelled" }, resolveScope(user));
  },

  /**
   * Hard delete. Admin-only, and refused for classes that already
   * happened so historical/attendance records can't be silently
   * destroyed — cancel those instead.
   */
  async deleteClass(id: string): Promise<void> {
    const user = await requireUser();
    if (user.role !== "admin") throw new ClassAuthorizationError("Only admins can delete classes.");

    const existing = await classesRepository.findById(id);
    if (!existing) return;

    if (existing.status === "completed") {
      throw new ClassAuthorizationError("Completed classes can't be deleted. Cancel or archive it instead.");
    }

    return classesRepository.remove(id);
  },
};

export { ClassRepositoryError };
