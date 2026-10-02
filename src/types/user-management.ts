import type { UserRole } from "./user";

/**
 * Advanced User Management — read-only Users view (Phase 7 P3.2).
 *
 * Two different statuses, never merged:
 *   - AccountStatus: public.profiles.account_status (0016) — whether the
 *     account may sign in at all (only "active" has a usable role).
 *   - PersonStatus:  public.students.status / public.trainers.status —
 *     the state of the person's domain record. Same values as the older
 *     UserStatus, kept as its own name so the two cannot be confused.
 */
export type AccountStatus = "invited" | "active" | "suspended";

export type PersonStatus = "active" | "inactive" | "invited";

export type DomainRecordKind = "student" | "trainer";

/**
 * The domain record the account's CURRENT role needs:
 *   present         — the matching students/trainers row exists
 *   missing         — a student/trainer account without its record
 *   not_applicable  — Super Admins have no domain record
 */
export type DomainRecordState = "present" | "missing" | "not_applicable";

export interface DomainRecordSummary {
  kind: DomainRecordKind;
  code: string;
  status: PersonStatus;
}

/** One batch as shown next to a user (code + name + lifecycle status). */
export interface UserBatchRef {
  id: string;
  code: string;
  name: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
}

/** Students: their enrolments. Trainers: the batches assigned to them. */
export interface UserBatchSummary {
  /** Student: enrolled (non-cancelled batch). Trainer: assigned upcoming/ongoing batches. */
  current: UserBatchRef[];
  /** Student: completed enrolments. Trainer: assigned completed batches. */
  completed: number;
  /** Student: withdrawn enrolments. Always 0 for trainers. */
  withdrawn: number;
}

export interface UserSummary {
  /** profiles.id (= the auth user id). */
  id: string;
  /** Domain record full name; null when the account has no domain record. */
  name: string | null;
  /** From student_details / trainer_details only; null when none is readable. */
  email: string | null;
  /** Application role (super_admin → "admin"); null only for an unrecognised value. */
  role: UserRole | null;
  accountStatus: AccountStatus;
  accountStatusChangedAt: string;
  recordState: DomainRecordState;
  /** The record for the current role (null unless recordState is "present"). */
  record: DomainRecordSummary | null;
  /** A record of another kind left behind by an earlier role (e.g. after a role change). */
  otherRecord: DomainRecordSummary | null;
  /** Null when the role has no batches (Super Admin, or no record). */
  batches: UserBatchSummary | null;
  createdAt: string;
  updatedAt: string;
}

export type UserRoleFilter = "all" | UserRole;
export type AccountStatusFilter = "all" | AccountStatus;
/** Record filter: a person status, or accounts missing the record their role needs. */
export type DomainRecordFilter = "all" | PersonStatus | "missing";

/** Validated filters (only whitelisted values ever reach this shape). */
export interface UserListFilters {
  q: string;
  role: UserRoleFilter;
  status: AccountStatusFilter;
  record: DomainRecordFilter;
  page: number;
}

export interface UserListTotals {
  /** Every account the viewer may read (before filters). */
  all: number;
  byStatus: Record<AccountStatus, number>;
  /** Student/trainer accounts without the record their role needs. */
  missingRecord: number;
}

/** One page of the Users view — the only rows sent to the browser. */
export interface UserListPage {
  rows: UserSummary[];
  filters: UserListFilters;
  /** Rows matching the filters (all pages). */
  matching: number;
  page: number;
  pageCount: number;
  pageSize: number;
  totals: UserListTotals;
}

// -------------------------------------------------------------------
// Lifecycle actions (Phase 7 P3.3)
// -------------------------------------------------------------------

/** Contact/profile fields of the current role's record, as editable by a Super Admin. */
export interface StudentDetailFields {
  fullName: string;
  phone: string | null;
  organization: string | null;
  designation: string | null;
}

export interface TrainerDetailFields {
  fullName: string;
  phone: string | null;
  specializations: string[];
  bio: string | null;
}

export type UserContactDetails =
  | { kind: "student"; fields: StudentDetailFields }
  | { kind: "trainer"; fields: TrainerDetailFields };

/** One entry of the account's audit history (public.user_admin_events, newest first). */
export interface UserAuditEntry {
  id: number;
  occurredAt: string;
  /** Plain-language description built from the event type and its detail. */
  summary: string;
  /** "you" when the viewer performed it; otherwise the actor's id, or null for system changes. */
  actor: string | null;
}

/**
 * Which controls the panel offers. A presentation hint only — derived
 * from the same rules the database enforces, which still decides every
 * action (self-protection, last Super Admin, transitions, scope).
 */
export interface UserActionAvailability {
  suspend: boolean;
  reactivate: boolean;
  changeRole: boolean;
  editDetails: boolean;
  /** Why status/role controls are unavailable (e.g. your own account), when they are. */
  note: string | null;
}

export interface UserDetail {
  user: UserSummary;
  isSelf: boolean;
  hasStudentRecord: boolean;
  hasTrainerRecord: boolean;
  contact: UserContactDetails | null;
  history: UserAuditEntry[];
  actions: UserActionAvailability;
}

/** Plain, serializable result of a lifecycle server action. */
export type UserActionResult = { ok: true; message: string } | { ok: false; error: string };
