import "server-only";
import { authService } from "./auth.service";
import { coursesRepository, CourseRepositoryError, type CourseScope } from "@/repositories/courses.repository";
import type { AuthUser } from "@/types/auth";
import type { CourseDetail, CourseSummary } from "@/types/course";

/**
 * Courses service — resolves the caller's identity server-side via
 * authService (never from a client-supplied argument) and derives the
 * data scope from it. Pages call this; they never call
 * coursesRepository directly. Read-only for now: course create/edit is
 * a separate future task (writes are admin-only in the database).
 */

export class CourseAuthorizationError extends Error {
  constructor(message = "You need to be signed in.") {
    super(message);
    this.name = "CourseAuthorizationError";
  }
}

/**
 * Admin: the whole catalog. Trainer: courses of batches they run.
 * Student: courses of batches they're enrolled in (or completed).
 * trainers.id = students.id = the auth user id. RLS enforces the same
 * boundaries in the database; this scope is the second layer.
 */
function resolveScope(user: AuthUser): CourseScope {
  switch (user.role) {
    case "admin":
      return { kind: "all" };
    case "trainer":
      return { kind: "trainer", trainerId: user.id };
    case "student":
      return { kind: "student", studentId: user.id };
    default:
      // Unknown role — fail closed.
      return { kind: "none" };
  }
}

async function requireUser(): Promise<AuthUser> {
  const user = await authService.getCurrentUser();
  if (!user) throw new CourseAuthorizationError();
  return user;
}

export const coursesService = {
  /** Courses the current user may see, honouring their role scope. */
  async listCourses(): Promise<CourseSummary[]> {
    const user = await requireUser();
    return coursesRepository.findAll(resolveScope(user));
  },

  /** A single course, or null if it doesn't exist, is invalid, *or* is out of the caller's scope. */
  async getCourse(id: string): Promise<CourseDetail | null> {
    const user = await requireUser();
    return coursesRepository.findById(id, resolveScope(user));
  },
};

export { CourseRepositoryError };
