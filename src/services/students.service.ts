import "server-only";
import { authService } from "./auth.service";
import { studentsRepository, StudentRepositoryError, type StudentScope } from "@/repositories/students.repository";
import type { AuthUser } from "@/types/auth";
import type { StudentSummary } from "@/types/student";

/**
 * Students service — resolves the caller's identity server-side via
 * authService (never from a client-supplied argument) and derives the
 * data scope from it. Pages call this; they never call
 * studentsRepository directly. Read-only for now: student
 * create/edit/remove is a separate future task.
 */

export class StudentAuthorizationError extends Error {
  constructor(message = "You don't have permission to view students.") {
    super(message);
    this.name = "StudentAuthorizationError";
  }
}

/**
 * Admin: every student. Trainer: students currently enrolled in the
 * batches they run (trainers.id = the auth user id). Anyone else is
 * refused. RLS enforces the same boundaries in the database; this
 * scope is the second layer behind the portal RoleGuard/middleware.
 */
function resolveScope(user: AuthUser): StudentScope {
  switch (user.role) {
    case "admin":
      return { kind: "all" };
    case "trainer":
      return { kind: "trainer", trainerId: user.id };
    default:
      throw new StudentAuthorizationError();
  }
}

async function requireUser(): Promise<AuthUser> {
  const user = await authService.getCurrentUser();
  if (!user) throw new StudentAuthorizationError("You need to be signed in.");
  return user;
}

export const studentsService = {
  /** Students visible to the current user, honouring their role scope. */
  async listStudents(): Promise<StudentSummary[]> {
    const user = await requireUser();
    return studentsRepository.findAll(resolveScope(user));
  },
};

export { StudentRepositoryError };
