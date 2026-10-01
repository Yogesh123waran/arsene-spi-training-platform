/**
 * Users repository (Phase 7 P3.2) — READ-ONLY view of accounts:
 * public.profiles with each account's student/trainer record, contact
 * email (student_details / trainer_details) and batches.
 *
 * Always the caller's own session (never the service role): RLS decides
 * every row. A Super Admin reads every profile; anyone else reads only
 * their own profile row, and inactive (invited/suspended) callers read
 * nothing (0016). auth.users is never read — no last sign-in, no auth
 * email, no tokens. Nothing here writes.
 *
 * One embedded read per page of profiles (keyset on profiles.id), so the
 * number of requests depends only on the number of accounts / page size,
 * never on how many records or batches each account has (no N+1).
 *
 * Factory without `server-only` so it can be tested against a local
 * database; users.repository.ts wires the real server client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { KEYSET_PAGE_SIZE, readAllByKeyset } from "@/lib/supabase/paging";
import type { UserProfileRecord } from "@/lib/user-management/users";

type Client = SupabaseClient<Database, "public">;

const GENERIC_DB_ERROR = "We couldn't load the users. Please try again.";

export class UsersRepositoryError extends Error {
  constructor(message: string = GENERIC_DB_ERROR) {
    super(message);
    this.name = "UsersRepositoryError";
  }
}

/**
 * Exactly the columns the Users view shows — nothing secret exists in
 * these tables, and nothing else is selected. The profile → record embeds
 * name their foreign key (students.id / trainers.id → profiles.id) so the
 * read stays unambiguous if other profile ↔ record links are ever added.
 */
export const USER_PROFILE_SELECT = `
  id, role, account_status, account_status_changed_at, created_at, updated_at,
  students!students_id_fkey ( student_code, full_name, status,
    student_details ( email ),
    batch_students ( enrollment_status, batches ( id, batch_code, name, status ) ) ),
  trainers!trainers_id_fkey ( trainer_code, full_name, status,
    trainer_details ( email ),
    batches ( id, batch_code, name, status ) )
`;

function logDbError(context: string, error: unknown) {
  const detail =
    error && typeof error === "object" && "message" in error
      ? `${(error as { code?: string }).code ?? ""} ${(error as { message: string }).message}`.trim()
      : error;
  console.error(`[users] ${context}:`, detail);
}

export function createUsersRepository(getClient: () => Promise<Client | null>, options: { pageSize?: number } = {}) {
  const pageSize = options.pageSize ?? KEYSET_PAGE_SIZE;

  return {
    /** Every profile the session may read, with its domain data (RLS-scoped). */
    async listProfiles(): Promise<UserProfileRecord[]> {
      let supabase: Client | null;
      try {
        supabase = await getClient();
      } catch (err) {
        logDbError("listProfiles (client)", err);
        throw new UsersRepositoryError();
      }
      if (!supabase) throw new UsersRepositoryError();
      const client = supabase;
      try {
        return await readAllByKeyset<UserProfileRecord>((afterId, limit) => {
          let q = client.from("profiles").select(USER_PROFILE_SELECT);
          if (afterId) q = q.gt("id", afterId);
          return q.order("id").limit(limit);
        }, pageSize);
      } catch (err) {
        logDbError("listProfiles", err);
        throw new UsersRepositoryError();
      }
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
