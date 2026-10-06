/**
 * Super Admin dashboard service (D1). The signed-in user comes from the
 * session, never from the browser; only a Super Admin gets the data
 * (RoleGuard and middleware check the same before the page renders, and
 * RLS decides every row the repository reads).
 *
 * Sources: database counts and bounded reads (dashboard repository), the
 * Users page totals (users service), the existing performance summary
 * (performance service) and the Super Admin's own notification feed.
 * Sections load in parallel and independently: one failure shows that
 * section's error state, never a raw error, and never hides the others.
 */
import {
  ACTIVITY_LIMIT,
  TODAY_CLASS_LIMIT,
  UPCOMING_CLASS_LIMIT,
  UPCOMING_TEST_LIMIT,
  buildAttentionItems,
  indiaDate,
  batchCapacityHealth,
  pendingApprovalBatches,
  pendingApprovalsAt,
  shortTime,
  trainerCoverageHealth,
  summarizeCurrentBatches,
  testState,
  weakestTopics,
  type AdminDashboardData,
  type DashboardClass,
  type DashboardPerformance,
  type DashboardSection,
  type DashboardTest,
} from "@/lib/dashboard/admin-dashboard";
import { addDays, compare, type Comparison } from "@/lib/dashboard/periods";

/** The look-back for "pending approvals vs 7 days ago" (an instant, 7 × 24 h before now). */
const APPROVALS_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
import type { AuthUser } from "@/types/auth";
import type { PerformanceData } from "@/types/performance";
import type { NotificationFeed } from "@/types/notification";
import type { CompletionBatchSummary } from "@/types/certificate";
import type { ClassRecord, DashboardRepository, TestRecord } from "@/repositories/dashboard.repository.core";

export class DashboardAuthorizationError extends Error {
  constructor(message = "Only Super Admins can view this dashboard.") {
    super(message);
    this.name = "DashboardAuthorizationError";
  }
}

/** The account totals the Users page shows (invited / suspended / missing record). */
export interface AccountTotals {
  invited: number;
  suspended: number;
  missingRecord: number;
}

export interface AdminDashboardServiceDeps {
  repository: Pick<
    DashboardRepository,
    | "countActiveAccounts"
    | "countBatchesByStatus"
    | "countClassesOn"
    | "countCompletionsAwaitingApproval"
    | "listCurrentBatches"
    | "listCompletionStatusEventsAfter"
    | "listClassesOn"
    | "listUpcomingClasses"
    | "listUpcomingTests"
  >;
  getCurrentUser: () => Promise<AuthUser | null>;
  getAccountTotals: () => Promise<AccountTotals>;
  getPerformance: () => Promise<PerformanceData | null>;
  getNotifications: (limit: number) => Promise<NotificationFeed | null>;
  /** Batches with completion counts (the Certificates page's list). */
  getCompletionBatches: () => Promise<CompletionBatchSummary[] | null>;
  now?: () => Date;
}

function toClass(r: ClassRecord): DashboardClass {
  return {
    id: r.id,
    title: r.title,
    date: r.class_date,
    startTime: shortTime(r.start_time),
    endTime: shortTime(r.end_time),
    status: r.status,
    classType: r.class_type,
    batchName: r.batch_name,
  };
}

function toTest(r: TestRecord, now: Date): DashboardTest {
  return {
    id: r.id,
    title: r.title,
    testType: r.test_type,
    state: testState(r.status, r.available_from, now),
    availableFrom: r.available_from,
    availableUntil: r.available_until,
    batchName: r.batch_name,
  };
}

/** Only the summary figures the dashboard shows (no module or student detail). */
function toPerformance(p: PerformanceData): DashboardPerformance {
  return {
    scopeLabel: p.scopeLabel,
    testAverage: p.metrics.testAverage,
    passRate: p.metrics.passRate,
    releasedResults: p.metrics.releasedResults,
    attendancePercent: p.metrics.attendancePercent,
    attendanceMarked: p.metrics.attendanceMarked,
    assignmentAverage: p.metrics.assignmentAverage,
    assignmentsScored: p.metrics.assignmentsScored,
    trend: p.trend.map((t, i) => ({ label: String(i + 1), title: t.title, value: t.averagePercent })),
    topics: weakestTopics(p.modules ?? []),
    topicsAssessed: (p.modules ?? []).length,
    weakTopics: p.weakModules.length,
  };
}

export function createAdminDashboardService(deps: AdminDashboardServiceDeps) {
  const now = deps.now ?? (() => new Date());

  /** A section's promise → ok / error; the error is logged by name only. */
  async function section<T>(name: string, run: () => Promise<T>): Promise<DashboardSection<T>> {
    try {
      return { status: "ok", data: await run() };
    } catch (err) {
      console.error(`[dashboard] ${name} failed:`, err instanceof Error ? err.name : "unknown error");
      return { status: "error" };
    }
  }

  /** An optional extra (a comparison): null on failure, logged by name; never fails its section. */
  async function optional<T>(name: string, run: () => Promise<T>): Promise<T | null> {
    try {
      return await run();
    } catch (err) {
      console.error(`[dashboard] ${name} failed:`, err instanceof Error ? err.name : "unknown error");
      return null;
    }
  }

  return {
    async getDashboard(): Promise<AdminDashboardData> {
      const user = await deps.getCurrentUser();
      if (!user || user.role !== "admin") throw new DashboardAuthorizationError();

      const at = now();
      const today = indiaDate(at);
      const repo = deps.repository;

      // Shared reads (each runs once even when two sections use it).
      const batchCounts = repo.countBatchesByStatus();
      const classesToday = repo.countClassesOn(today);
      const pendingCompletions = repo.countCompletionsAwaitingApproval();
      const currentBatchRows = repo.listCurrentBatches();
      const currentBatches = currentBatchRows.then(summarizeCurrentBatches);
      // Unhandled-rejection safety: each shared promise is awaited by its sections below.
      for (const p of [batchCounts, classesToday, pendingCompletions, currentBatchRows, currentBatches]) p.catch(() => undefined);

      // D2a comparisons (real data only): classes on the same India weekday last week; recommendations
      // pending exactly 7 × 24 h ago, rebuilt from the completion status events since then.
      const lastWeekDay = addDays(today, -7);
      const lookback = new Date(at.getTime() - APPROVALS_LOOKBACK_MS).toISOString();
      const classesComparison = optional("classesToday comparison", async () =>
        compare(await classesToday, await repo.countClassesOn(lastWeekDay), "vs same day last week")
      );
      const approvalsComparison = optional("approvals comparison", async () => {
        const [now_, events] = await Promise.all([pendingCompletions, repo.listCompletionStatusEventsAfter(lookback)]);
        return compare(now_, pendingApprovalsAt(now_, events), "vs 7 days ago");
      });

      const [metrics, attention, todayClasses, upcomingClasses, upcomingTests, overview, performance, activity, approvals, health] = await Promise.all([
        section("metrics", async () => {
          const [activeStudents, activeTrainers, batches, today_, pending, classesCmp, approvalsCmp] = await Promise.all([
            repo.countActiveAccounts("student"),
            repo.countActiveAccounts("trainer"),
            batchCounts,
            classesToday,
            pendingCompletions,
            classesComparison,
            approvalsComparison,
          ]);
          return {
            activeStudents,
            activeTrainers,
            ongoingBatches: batches.ongoing,
            upcomingBatches: batches.upcoming,
            classesToday: today_,
            completionsAwaitingApproval: pending,
            comparisons: { classesToday: classesCmp as Comparison | null, completionsAwaitingApproval: approvalsCmp as Comparison | null },
          };
        }),
        section("attention", async () => {
          const [facts, pending, accounts] = await Promise.all([currentBatches, pendingCompletions, deps.getAccountTotals()]);
          return buildAttentionItems({
            unavailableTrainer: facts.unavailableTrainer,
            fullUpcoming: facts.fullUpcoming,
            pendingCompletions: pending,
            invitedAccounts: accounts.invited,
            suspendedAccounts: accounts.suspended,
            missingRecords: accounts.missingRecord,
          });
        }),
        section("todayClasses", async () => {
          const [total, rows] = await Promise.all([classesToday, repo.listClassesOn(today, TODAY_CLASS_LIMIT)]);
          return { total, classes: rows.map(toClass) };
        }),
        section("upcomingClasses", async () => (await repo.listUpcomingClasses(today, UPCOMING_CLASS_LIMIT)).map(toClass)),
        section("upcomingTests", async () => (await repo.listUpcomingTests(at.toISOString(), UPCOMING_TEST_LIMIT)).map((t) => toTest(t, at))),
        section("overview", async () => {
          const [batches, facts] = await Promise.all([batchCounts, currentBatches]);
          return { batches, courses: facts.courses, coursesWithCurrentBatches: facts.coursesWithCurrentBatches };
        }),
        section("performance", async () => {
          const p = await deps.getPerformance();
          if (!p) throw new Error("performance unavailable");
          return toPerformance(p);
        }),
        section("activity", async () => {
          const feed = await deps.getNotifications(ACTIVITY_LIMIT);
          if (!feed) throw new Error("notifications unavailable");
          return {
            unreadCount: feed.unreadCount,
            items: feed.notifications.slice(0, ACTIVITY_LIMIT).map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              createdAt: n.createdAt,
              link: n.link,
              unread: n.readAt === null,
            })),
          };
        }),
        section("approvals", async () => {
          const [total, rows] = await Promise.all([pendingCompletions, deps.getCompletionBatches()]);
          if (!rows) throw new Error("completion batches unavailable");
          return { total, ...pendingApprovalBatches(rows) };
        }),
        section("health", async () => {
          const rows = await currentBatchRows;
          return [trainerCoverageHealth(rows), batchCapacityHealth(rows, today)];
        }),
      ]);

      return { today, generatedAt: at.toISOString(), metrics, attention, todayClasses, upcomingClasses, upcomingTests, overview, performance, activity, approvals, health };
    },
  };
}

export type AdminDashboardService = ReturnType<typeof createAdminDashboardService>;
