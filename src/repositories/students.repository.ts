import "server-only";
import { authConfig } from "@/config/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStudentsForBatches, studentTableRows } from "@/lib/mock/students-table.mock";
import type { StudentSummary } from "@/types/student";

/**
 * Students repository — the only module that knows where student data
 * lives. Two isolated implementations behind one interface, matching
 * the Classes / Courses / Trainers repositories:
 *
 *   - Demo mode  (authConfig.mode === "demo"): the existing demo rows.
 *   - Supabase mode: public.students + student_details +
 *     batch_students → batches → courses (0003_core_training_model.sql),
 *     read with the caller's session.
 *
 * Read-only for now (Add/Edit/Remove are a separate future task).
 * Services call this; UI components never do. RLS is the authoritative
 * boundary: student_details (email) is readable only by super_admin and
 * the student themselves, and trainers only see students in their own
 * batches. The scope below is the second layer.
 */

const GENERIC_DB_ERROR = "We couldn't reach the database. Please try again.";

/** Shown in the Batch/Course columns when there is no current enrolment. */
export const NO_CURRENT_ENROLMENT = "—";

export class StudentRepositoryError extends Error {
  constructor(message: string = GENERIC_DB_ERROR) {
    super(message);
    this.name = "StudentRepositoryError";
  }
}

function logDbError(context: string, error: unknown) {
  console.error(`[students] ${context}:`, error instanceof Error ? error.message : error);
}

/** Which students the caller's page lists. */
export type StudentScope = { kind: "all" } | { kind: "trainer"; trainerId: string } | { kind: "none" };

/** Demo mapping: the demo trainer (as in Classes) runs Batch A. */
const DEMO_TRAINER_BATCHES = ["Batch A"];

/**
 * One round trip: each student with their contact email and their
 * enrolments (batch name/status/trainer and course). For trainers,
 * student_details comes back null under RLS and batch_students only
 * includes their own batches' non-withdrawn rows.
 */
const STUDENT_LIST_SELECT = `
  id, full_name, status,
  student_details ( email ),
  batch_students ( enrollment_status, batches ( name, status, trainer_id, courses ( title ) ) )
`;

/** Sorted, de-duplicated, non-empty strings joined for display — or "—". */
function joinOrDash(values: (string | null | undefined)[]): string {
  const unique = Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort();
  return unique.length > 0 ? unique.join(", ") : NO_CURRENT_ENROLMENT;
}

export const studentsRepository = {
  async findAll(scope: StudentScope): Promise<StudentSummary[]> {
    if (authConfig.mode === "demo") {
      if (scope.kind === "all") return studentTableRows;
      if (scope.kind === "trainer") return getStudentsForBatches(DEMO_TRAINER_BATCHES);
      return [];
    }

    if (scope.kind === "none") return [];

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new StudentRepositoryError();

    try {
      const { data, error } = await supabase.from("students").select(STUDENT_LIST_SELECT).order("full_name");
      if (error) throw error;

      const rows: StudentSummary[] = [];

      for (const row of data ?? []) {
        // Current enrolments: enrolled, in a non-cancelled batch — and,
        // for a trainer, only batches that trainer runs.
        const current = row.batch_students
          .map((bs) => (bs.enrollment_status === "enrolled" ? bs.batches : null))
          .filter((batch): batch is NonNullable<typeof batch> => batch !== null && batch.status !== "cancelled")
          .filter((batch) => scope.kind !== "trainer" || batch.trainer_id === scope.trainerId);

        // Trainers only list students currently enrolled in their batches.
        if (scope.kind === "trainer" && current.length === 0) continue;

        rows.push({
          id: row.id,
          name: row.full_name,
          email: row.student_details?.email ?? "",
          batch: joinOrDash(current.map((b) => b.name)),
          course: joinOrDash(current.map((b) => b.courses?.title)),
          // attendance / performance: no data source yet — left undefined ("—").
          status: row.status,
        });
      }

      return rows;
    } catch (err) {
      logDbError("findAll failed", err);
      throw new StudentRepositoryError();
    }
  },
};
