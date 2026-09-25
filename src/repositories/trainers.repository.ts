import "server-only";
import { authConfig } from "@/config/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { trainerTableRows } from "@/lib/mock/trainers-table.mock";
import type { TrainerSummary } from "@/types/trainer";

/**
 * Trainers repository — the only module that knows where trainer data
 * lives. Two isolated implementations behind one interface, matching
 * classes.repository.ts / courses.repository.ts:
 *
 *   - Demo mode  (authConfig.mode === "demo"): the existing demo rows.
 *   - Supabase mode: public.trainers + trainer_details + batches →
 *     courses / batch_students (0003_core_training_model.sql), read
 *     with the caller's session.
 *
 * Read-only for now (Add/Edit/Remove are a separate future task).
 * Services call this; UI components never do. RLS is the authoritative
 * boundary: trainer_details (email) is readable only by super_admin
 * and the trainer themselves, and the service only calls this for
 * admins.
 */

const GENERIC_DB_ERROR = "We couldn't reach the database. Please try again.";

export class TrainerRepositoryError extends Error {
  constructor(message: string = GENERIC_DB_ERROR) {
    super(message);
    this.name = "TrainerRepositoryError";
  }
}

function logDbError(context: string, error: unknown) {
  console.error(`[trainers] ${context}:`, error instanceof Error ? error.message : error);
}

/**
 * One round trip: each trainer with their contact email and their
 * batches (with each batch's course and enrolments).
 */
const TRAINER_LIST_SELECT = `
  id, full_name, status,
  trainer_details ( email ),
  batches ( name, status, courses ( title ), batch_students ( student_id, enrollment_status ) )
`;

/** Sorted, de-duplicated, non-empty strings. */
function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort();
}

export const trainersRepository = {
  /** Every trainer (active, invited and inactive), for the admin table. */
  async findAll(): Promise<TrainerSummary[]> {
    if (authConfig.mode === "demo") {
      return trainerTableRows;
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new TrainerRepositoryError();

    try {
      const { data, error } = await supabase.from("trainers").select(TRAINER_LIST_SELECT).order("full_name");
      if (error) throw error;

      return (data ?? []).map((row) => {
        // Assigned = the trainer's batches except cancelled ones.
        const activeBatches = row.batches.filter((b) => b.status !== "cancelled");

        // Distinct students currently enrolled in those batches
        // (completed and withdrawn enrolments are not counted).
        const enrolledStudents = new Set(
          activeBatches.flatMap((b) =>
            b.batch_students.filter((bs) => bs.enrollment_status === "enrolled").map((bs) => bs.student_id)
          )
        );

        return {
          id: row.id,
          name: row.full_name,
          email: row.trainer_details?.email ?? "",
          courses: uniqueSorted(activeBatches.map((b) => b.courses?.title)),
          batches: uniqueSorted(activeBatches.map((b) => b.name)),
          students: enrolledStudents.size,
          status: row.status,
        };
      });
    } catch (err) {
      logDbError("findAll failed", err);
      throw new TrainerRepositoryError();
    }
  },
};
