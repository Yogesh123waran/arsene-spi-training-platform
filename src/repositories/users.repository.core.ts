/**
 * Users repository (Phase 7 P3.2 reads, P3.3 lifecycle actions):
 * public.profiles with each account's student/trainer record, contact
 * details (student_details / trainer_details) and batches, the account's
 * audit history (user_admin_events), and the 0017 Super Admin functions.
 *
 * Always the caller's own session (never the service role): RLS decides
 * every row read, and every change goes through a 0017 SECURITY DEFINER
 * function that checks the caller (active Super Admin), the target, the
 * transition, self-protection and the last-active-Super-Admin rule and
 * writes the audit row in the same transaction. Nothing here writes a
 * table directly. auth.users is never read — no sign-in data, no auth
 * email, no tokens.
 *
 * The list is one embedded read per page of profiles (keyset on
 * profiles.id), so the number of requests depends only on the number of
 * accounts / page size, never on records or batches per account (no N+1).
 *
 * Factory without `server-only` so it can be tested against a local
 * database; users.repository.ts wires the real server client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatusColumn, AppRoleColumn, Database, Json } from "@/lib/supabase/types";
import { KEYSET_PAGE_SIZE, readAllByKeyset } from "@/lib/supabase/paging";
import type { UserProfileRecord } from "@/lib/user-management/users";
import type { UserAuditRecord, UserDetailRecord } from "@/lib/user-management/lifecycle";

type Client = SupabaseClient<Database, "public">;

const GENERIC_DB_ERROR = "We couldn't load the users. Please try again.";

export class UsersRepositoryError extends Error {
  constructor(message: string = GENERIC_DB_ERROR) {
    super(message);
    this.name = "UsersRepositoryError";
  }
}

/** A database function raised an error; only its SQLSTATE is kept (to choose a safe message). */
export class UsersFunctionError extends UsersRepositoryError {
  constructor(public readonly code: string | null) {
    super("The change could not be made.");
    this.name = "UsersFunctionError";
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

/** One account for the detail panel: the list columns plus the editable contact fields. */
export const USER_DETAIL_SELECT = `
  id, role, account_status, account_status_changed_at, created_at, updated_at,
  students!students_id_fkey ( student_code, full_name, status,
    student_details ( email, phone, organization, designation ),
    batch_students ( enrollment_status, batches ( id, batch_code, name, status ) ) ),
  trainers!trainers_id_fkey ( trainer_code, full_name, status,
    trainer_details ( email, phone, specializations, bio ),
    batches ( id, batch_code, name, status ) )
`;

export const AUDIT_HISTORY_LIMIT = 25;

/** What a 0017 function answered: { ok: true, ... } or { ok: false, reason }. */
export interface UsersFunctionOutcome {
  ok: boolean;
  reason: string | null;
  /** A generated student/trainer code — present only when the function created a record (0020). */
  code?: string;
}

function logDbError(context: string, error: unknown) {
  const detail =
    error && typeof error === "object" && "message" in error
      ? `${(error as { code?: string }).code ?? ""} ${(error as { message: string }).message}`.trim()
      : error;
  console.error(`[users] ${context}:`, detail);
}

export function createUsersRepository(getClient: () => Promise<Client | null>, options: { pageSize?: number } = {}) {
  const pageSize = options.pageSize ?? KEYSET_PAGE_SIZE;

  async function client(context: string): Promise<Client> {
    let supabase: Client | null;
    try {
      supabase = await getClient();
    } catch (err) {
      logDbError(`${context} (client)`, err);
      throw new UsersRepositoryError();
    }
    if (!supabase) throw new UsersRepositoryError();
    return supabase;
  }

  async function read<T>(context: string, fn: (supabase: Client) => PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
    const supabase = await client(context);
    try {
      const { data, error } = await fn(supabase);
      if (error) throw error;
      return data;
    } catch (err) {
      logDbError(context, err);
      throw new UsersRepositoryError();
    }
  }

  async function call(context: string, fn: (supabase: Client) => PromiseLike<{ data: Json | null; error: unknown }>): Promise<UsersFunctionOutcome> {
    const supabase = await client(context);
    let result: { data: Json | null; error: unknown };
    try {
      result = await fn(supabase);
    } catch (err) {
      logDbError(context, err);
      throw new UsersRepositoryError("The change could not be made.");
    }
    if (result.error) {
      logDbError(context, result.error);
      const code = (result.error as { code?: unknown }).code;
      throw new UsersFunctionError(typeof code === "string" ? code : null);
    }
    const data = result.data;
    if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.ok !== "boolean") {
      logDbError(context, "unexpected function result");
      throw new UsersRepositoryError("The change could not be made.");
    }
    return { ok: data.ok, reason: typeof data.reason === "string" ? data.reason : null, ...(typeof data.code === "string" ? { code: data.code } : {}) };
  }

  return {
    /** Every profile the session may read, with its domain data (RLS-scoped). */
    async listProfiles(): Promise<UserProfileRecord[]> {
      const supabase = await client("listProfiles");
      try {
        return await readAllByKeyset<UserProfileRecord>((afterId, limit) => {
          let q = supabase.from("profiles").select(USER_PROFILE_SELECT);
          if (afterId) q = q.gt("id", afterId);
          return q.order("id").limit(limit);
        }, pageSize);
      } catch (err) {
        logDbError("listProfiles", err);
        throw new UsersRepositoryError();
      }
    },

    /** One profile with its contact details, or null when the session may not read it (RLS). */
    async getProfile(userId: string): Promise<UserDetailRecord | null> {
      return read<UserDetailRecord>("getProfile", (s) =>
        s.from("profiles").select(USER_DETAIL_SELECT).eq("id", userId).maybeSingle() as unknown as PromiseLike<{ data: UserDetailRecord | null; error: unknown }>
      );
    },

    /** The account's most recent user-management audit rows, newest first (Super Admin RLS). */
    async listAuditEvents(userId: string): Promise<UserAuditRecord[]> {
      const rows = await read<UserAuditRecord[]>("listAuditEvents", (s) =>
        s.from("user_admin_events").select("id, occurred_at, event_type, actor_id, detail").eq("target_user_id", userId).order("id", { ascending: false }).limit(AUDIT_HISTORY_LIMIT)
      );
      return rows ?? [];
    },

    /**
     * The account's most recent account-status audit row (or null) — the
     * same fact 0018 checks before a reactivation, read here only to avoid
     * offering an action the database will refuse.
     */
    async latestStatusChange(userId: string): Promise<{ detail: Json } | null> {
      const rows = await read<{ detail: Json }[]>("latestStatusChange", (s) =>
        s.from("user_admin_events").select("detail").eq("target_user_id", userId).eq("event_type", "account_status_changed").order("id", { ascending: false }).limit(1)
      );
      return rows?.[0] ?? null;
    },

    setAccountStatus(userId: string, status: AccountStatusColumn, reason: string | null): Promise<UsersFunctionOutcome> {
      return call("setAccountStatus", (s) => s.rpc("admin_set_account_status", { p_user_id: userId, p_status: status, p_reason: reason }));
    },

    setUserRole(userId: string, role: AppRoleColumn, details: Record<string, string>): Promise<UsersFunctionOutcome> {
      return call("setUserRole", (s) => s.rpc("admin_set_user_role", { p_user_id: userId, p_role: role, p_details: details }));
    },

    updateStudent(userId: string, patch: Record<string, Json>): Promise<UsersFunctionOutcome> {
      return call("updateStudent", (s) => s.rpc("admin_update_student", { p_student_id: userId, p: patch }));
    },

    updateTrainer(userId: string, patch: Record<string, Json>): Promise<UsersFunctionOutcome> {
      return call("updateTrainer", (s) => s.rpc("admin_update_trainer", { p_trainer_id: userId, p: patch }));
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
