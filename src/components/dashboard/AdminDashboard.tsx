import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Award, CalendarDays, CalendarPlus, FileQuestion, Layers, Minus, ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { LineChart } from "@/components/ui/charts";
import { formatDateTime } from "@/utils/format";
import {
  BATCH_STATUS_LABEL,
  BATCH_STATUS_ORDER,
  CLASS_TYPE_LABEL,
  TEST_TYPE_LABEL,
  type AdminDashboardData,
  type AttentionItem,
  type DashboardClass,
  type DashboardMetrics,
  type DashboardPerformance,
  type DashboardSection,
  type DashboardTest,
  type HealthLine,
  type TrainingOverview,
  HEALTH_LABEL,
} from "@/lib/dashboard/admin-dashboard";
import type { Comparison } from "@/lib/dashboard/periods";

/**
 * Super Admin dashboard (D1). A server component that only renders the
 * dashboard service's read model: database counts, bounded lists and the
 * existing performance / notification services. No mock data, no
 * invented trends, no mutations — every action is a link to an existing
 * workflow. Each section shows its own empty or error state.
 */

/** A calendar date (YYYY-MM-DD) as text, independent of the server's time zone. */
function calendarDate(isoDate: string, options: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" }): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? isoDate : new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(d);
}

const percent = (v: number | null) => (v === null ? "—" : `${Math.round(v * 10) / 10}%`);

function Panel({ id, title, description, action, children, className }: { id: string; title: string; description?: string; action?: { href: string; label: string }; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={className}>
      <Card className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4">
          <div>
            <h2 id={id} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          {action && (
            <Link href={action.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-signal-blue hover:underline">
              {action.label} <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          )}
        </div>
        <CardContent className="flex-1">{children}</CardContent>
      </Card>
    </section>
  );
}

function SectionError() {
  return <ErrorState title="This section couldn't be loaded" description="Please refresh the page. Other sections are unaffected." className="py-8" />;
}

function Compact({ title, description }: { title: string; description: string }) {
  return <EmptyState title={title} description={description} className="py-8" />;
}

// ---------------------------------------------------------------- key metrics

const METRICS: { key: Exclude<keyof DashboardMetrics, "comparisons">; label: string; note: string; href: string; linkText: string }[] = [
  { key: "activeStudents", label: "Active students", note: "Student accounts that can sign in", href: "/admin/users?role=student&status=active", linkText: "View active student accounts" },
  { key: "activeTrainers", label: "Active trainers", note: "Trainer accounts that can sign in", href: "/admin/users?role=trainer&status=active", linkText: "View active trainer accounts" },
  { key: "ongoingBatches", label: "Ongoing batches", note: "In progress now", href: "/admin/batches", linkText: "View batches" },
  { key: "upcomingBatches", label: "Upcoming batches", note: "Not started yet", href: "/admin/batches", linkText: "View batches" },
  { key: "classesToday", label: "Classes today", note: "Not cancelled, India time", href: "/admin/classes", linkText: "View classes" },
  { key: "completionsAwaitingApproval", label: "Awaiting approval", note: "Completion recommendations", href: "/admin/certificates", linkText: "Review completions" },
];

/** "↑ 2 (+50%) vs same day last week" in words, for screen readers and the link label. */
function comparisonText(c: Comparison): string {
  if (c.direction === "same") return `No change ${c.label} (${c.previous})`;
  const change = `${c.direction === "up" ? "Up" : "Down"} ${Math.abs(c.difference)}`;
  return `${change}${c.percent !== null ? ` (${c.percent > 0 ? "+" : ""}${c.percent}%)` : ""} ${c.label} (${c.previous})`;
}

/** A real comparison: arrow + difference (+ % only when the previous value is above 0) + what it compares against. */
function ComparisonLine({ cmp }: { cmp: Comparison }) {
  const Icon = cmp.direction === "up" ? ArrowUp : cmp.direction === "down" ? ArrowDown : Minus;
  return (
    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted" title={comparisonText(cmp)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="font-mono">
        {cmp.direction === "same" ? "0" : `${cmp.difference > 0 ? "+" : "−"}${Math.abs(cmp.difference)}`}
        {cmp.percent !== null && cmp.direction !== "same" ? ` (${cmp.percent > 0 ? "+" : ""}${cmp.percent}%)` : ""}
      </span>
      <span className="truncate text-ink-faint">{cmp.label}</span>
    </span>
  );
}

function Metrics({ section }: { section: DashboardSection<DashboardMetrics> }) {
  if (section.status === "error") {
    return (
      <section aria-labelledby="dash-metrics">
        <h2 id="dash-metrics" className="sr-only">
          Key metrics
        </h2>
        <SectionError />
      </section>
    );
  }
  return (
    <section aria-labelledby="dash-metrics">
      <h2 id="dash-metrics" className="sr-only">
        Key metrics
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {METRICS.map((m) => {
          const cmp = m.key === "classesToday" || m.key === "completionsAwaitingApproval" ? section.data.comparisons[m.key] : null;
          return (
          <li key={m.key}>
            <Link
              href={m.href}
              aria-label={`${m.label}: ${section.data[m.key]}.${cmp ? ` ${comparisonText(cmp)}.` : ""} ${m.linkText}`}
              className="block h-full rounded-md border border-surface-border border-l-2 border-l-primary-500 bg-surface-raised px-4 py-3 shadow-panel transition-colors hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <span className="block truncate text-2xs font-semibold uppercase tracking-wide text-ink-muted">{m.label}</span>
              <span className="mt-1 block font-mono text-kpi text-ink">{section.data[m.key]}</span>
              {cmp ? <ComparisonLine cmp={cmp} /> : <span className="mt-0.5 block truncate text-xs text-ink-faint">{m.note}</span>}
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- attention required

function Attention({ section }: { section: DashboardSection<AttentionItem[]> }) {
  if (section.status === "ok" && section.data.length === 0) return null; // nothing needs attention → no section
  return (
    <section aria-labelledby="dash-attention">
      <Card className="border-l-2 border-l-brand-gold">
        <div className="flex items-center gap-2 border-b border-surface-border px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-signal-amber" aria-hidden />
          <h2 id="dash-attention" className="text-base font-semibold text-ink">
            Attention required
          </h2>
        </div>
        <CardContent>
          {section.status === "error" ? (
            <SectionError />
          ) : (
            <ul className="divide-y divide-surface-border">
              {section.data.map((item) => (
                <li key={item.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="min-w-[2.5rem] font-mono text-xl font-semibold text-ink">{item.count}</span>
                    <div>
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-xs text-ink-muted">{item.reason}</p>
                    </div>
                  </div>
                  <Link href={item.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-signal-blue hover:underline sm:ml-4">
                    {item.linkLabel} <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------- classes and tests

function ClassList({ classes, showDate }: { classes: DashboardClass[]; showDate: boolean }) {
  return (
    <ul className="divide-y divide-surface-border">
      {classes.map((c) => (
        <li key={c.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="font-mono text-xs text-ink-muted">
              {showDate ? `${calendarDate(c.date)} · ` : ""}
              {c.startTime}
              {c.endTime ? `–${c.endTime}` : ""}
            </p>
            <Link href={`/admin/classes/${encodeURIComponent(c.id)}`} className="block truncate text-sm font-medium text-ink hover:underline">
              {c.title}
            </Link>
            <p className="truncate text-xs text-ink-muted">
              {c.batchName || "—"}
              {CLASS_TYPE_LABEL[c.classType] ? ` · ${CLASS_TYPE_LABEL[c.classType]}` : ""}
            </p>
          </div>
          <StatusBadge status={c.status} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

function TodayClasses({ section, today }: { section: AdminDashboardData["todayClasses"]; today: string }) {
  return (
    <Panel id="dash-today" title="Today's classes" description={calendarDate(today, { weekday: "long", day: "2-digit", month: "short" })} action={{ href: "/admin/classes", label: "View all classes" }}>
      {section.status === "error" ? (
        <SectionError />
      ) : section.data.classes.length === 0 ? (
        <Compact title="No classes today" description="Nothing is scheduled for today (India time)." />
      ) : (
        <>
          <ClassList classes={section.data.classes} showDate={false} />
          {section.data.total > section.data.classes.length && (
            <p className="mt-3 text-xs text-ink-muted">
              Showing {section.data.classes.length} of {section.data.total} classes today.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

function UpcomingClasses({ section }: { section: AdminDashboardData["upcomingClasses"] }) {
  return (
    <Panel id="dash-upcoming-classes" title="Upcoming classes" description="Next scheduled, after today" action={{ href: "/admin/classes", label: "View all classes" }}>
      {section.status === "error" ? (
        <SectionError />
      ) : section.data.length === 0 ? (
        <Compact title="No upcoming classes" description="No classes are scheduled after today." />
      ) : (
        <ClassList classes={section.data} showDate />
      )}
    </Panel>
  );
}

function testWindow(t: DashboardTest): string {
  if (t.state === "open") return t.availableUntil ? `Closes ${formatDateTime(t.availableUntil)}` : "Open";
  return t.availableFrom ? `Opens ${formatDateTime(t.availableFrom)}` : "Scheduled";
}

function UpcomingTests({ section }: { section: AdminDashboardData["upcomingTests"] }) {
  return (
    <Panel id="dash-tests" title="Upcoming tests" description="Published tests that are open or about to open" action={{ href: "/admin/tests", label: "View all tests" }}>
      {section.status === "error" ? (
        <SectionError />
      ) : section.data.length === 0 ? (
        <Compact title="No upcoming tests" description="No published test is open or scheduled." />
      ) : (
        <ul className="divide-y divide-surface-border">
          {section.data.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link href={`/admin/tests/${encodeURIComponent(t.id)}`} className="block truncate text-sm font-medium text-ink hover:underline">
                  {t.title}
                </Link>
                <p className="truncate text-xs text-ink-muted">
                  {t.batchName || "—"}
                  {TEST_TYPE_LABEL[t.testType] ? ` · ${TEST_TYPE_LABEL[t.testType]}` : ""}
                </p>
                <p className="font-mono text-xs text-ink-faint">{testWindow(t)}</p>
              </div>
              <Badge tone={t.state === "open" ? "green" : "blue"} className="shrink-0">
                {t.state === "open" ? "Open" : "Scheduled"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- training overview

function Overview({ section }: { section: DashboardSection<TrainingOverview> }) {
  return (
    <Panel id="dash-overview" title="Training overview" description="Batches by status" action={{ href: "/admin/batches", label: "View all batches" }}>
      {section.status === "error" ? (
        <SectionError />
      ) : (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-3">
            {BATCH_STATUS_ORDER.map((s) => (
              <div key={s} className="rounded-md border border-surface-border px-3 py-2">
                <dt className="text-xs text-ink-muted">{BATCH_STATUS_LABEL[s]}</dt>
                <dd className="font-mono text-xl font-semibold text-ink">{section.data.batches[s]}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Courses with current batches</h3>
            {section.data.courses.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No course has an upcoming or ongoing batch.</p>
            ) : (
              <>
                <ul className="mt-2 divide-y divide-surface-border">
                  {section.data.courses.map((c) => (
                    <li key={c.courseId} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <span className="truncate text-ink">{c.course}</span>
                      <span className="shrink-0 font-mono text-xs text-ink-muted">
                        {c.currentBatches} {c.currentBatches === 1 ? "batch" : "batches"}
                      </span>
                    </li>
                  ))}
                </ul>
                {section.data.coursesWithCurrentBatches > section.data.courses.length && (
                  <p className="mt-2 text-xs text-ink-muted">
                    Showing {section.data.courses.length} of {section.data.coursesWithCurrentBatches} courses.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- performance

function Performance({ section, className }: { section: DashboardSection<DashboardPerformance>; className?: string }) {
  return (
    <Panel
      id="dash-performance"
      title="Training performance"
      description={section.status === "ok" ? `${section.data.scopeLabel} · all released results to date` : undefined}
      action={{ href: "/admin/performance", label: "View performance" }}
      className={className}
    >
      {section.status === "error" ? (
        <SectionError />
      ) : (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Test average", value: percent(section.data.testAverage), note: `${section.data.releasedResults} released results` },
              { label: "Pass rate", value: percent(section.data.passRate), note: "Of released results" },
              { label: "Attendance", value: percent(section.data.attendancePercent), note: `${section.data.attendanceMarked} marked` },
              { label: "Assignment average", value: percent(section.data.assignmentAverage), note: `${section.data.assignmentsScored} scored` },
            ].map((m) => (
              <div key={m.label} className="rounded-md border border-surface-border px-3 py-2">
                <dt className="text-xs text-ink-muted">{m.label}</dt>
                <dd className="font-mono text-xl font-semibold text-ink">{m.value}</dd>
                <dd className="text-2xs text-ink-faint">{m.note}</dd>
              </div>
            ))}
          </dl>
          {section.data.trend.length < 2 ? (
            <p className="text-sm text-ink-muted">A trend appears once at least two tests have released results.</p>
          ) : (
            <figure aria-labelledby="dash-trend-caption">
              <figcaption id="dash-trend-caption" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Average score per released test (oldest to newest)
              </figcaption>
              <div aria-hidden="true" className="mt-2">
                <LineChart data={section.data.trend} max={100} />
              </div>
              <ol className="sr-only">
                {section.data.trend.map((p) => (
                  <li key={p.label}>
                    {p.title}: {percent(p.value)}
                  </li>
                ))}
              </ol>
            </figure>
          )}
        </div>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- training health (D2a: checks backed by current data)

const HEALTH_TONE = { healthy: "green", watch: "amber", attention: "red" } as const;

function TrainingHealth({ section }: { section: DashboardSection<HealthLine[]> }) {
  return (
    <Panel id="dash-health" title="Training health" description="Each status shows the database fact behind it">
      {section.status === "error" ? (
        <SectionError />
      ) : (
        <>
          <ul className="divide-y divide-surface-border">
            {section.data.map((h) => (
              <li key={h.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{h.label}</span>
                  <Badge tone={HEALTH_TONE[h.status]}>{HEALTH_LABEL[h.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{h.reason}</p>
                {h.status !== "healthy" && (
                  <Link href={h.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-signal-blue hover:underline">
                    {h.linkLabel} <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-2xs text-ink-faint">Attendance, assessment, assignment and student checks will be added with the period analytics.</p>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- weak topics (module performance from released results)

const BAND_LABEL = { weak: "Weak", developing: "Developing", strong: "Strong" } as const;
const BAND_TONE = { weak: "red", developing: "amber", strong: "green" } as const;
const BAND_BAR = { weak: "bg-signal-red", developing: "bg-signal-amber", strong: "bg-signal-green" } as const;

function WeakTopics({ section }: { section: DashboardSection<DashboardPerformance> }) {
  return (
    <Panel id="dash-topics" title="Weak topics" description="Modules by average score in released tests (weak below 65%, strong from 80%)" action={{ href: "/admin/performance", label: "View module performance" }}>
      {section.status === "error" ? (
        <SectionError />
      ) : section.data.topics.length === 0 ? (
        <Compact title="No module results yet" description="Module scores appear once tests with module-tagged questions release their results." />
      ) : (
        <>
          <p className="mb-3 text-xs text-ink-muted">
            {section.data.weakTopics} of {section.data.topicsAssessed} assessed {section.data.topicsAssessed === 1 ? "module is" : "modules are"} below 65%.
          </p>
          <ul className="flex flex-col gap-3">
            {section.data.topics.map((t) => (
              <li key={t.moduleId}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink">{t.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs text-ink">{percent(t.percent)}</span>
                    <Badge tone={BAND_TONE[t.band]}>{BAND_LABEL[t.band]}</Badge>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken" aria-hidden="true">
                  <div className={`h-full ${BAND_BAR[t.band]}`} style={{ width: `${Math.max(0, Math.min(100, t.percent))}%` }} />
                </div>
                <p className="mt-0.5 text-2xs text-ink-faint">{t.answers} graded answers</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- pending approvals (completion recommendations)

function PendingApprovalsPanel({ section }: { section: AdminDashboardData["approvals"] }) {
  return (
    <Panel
      id="dash-approvals"
      title="Pending completion approvals"
      description={section.status === "ok" ? `${section.data.total} ${section.data.total === 1 ? "recommendation" : "recommendations"} awaiting a Super Admin decision` : undefined}
      action={{ href: "/admin/certificates", label: "Review all completions" }}
    >
      {section.status === "error" ? (
        <SectionError />
      ) : section.data.batches.length === 0 ? (
        <Compact title="Nothing awaiting approval" description="No trainer recommendation is waiting for a decision." />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Batch</TableHeaderCell>
                <TableHeaderCell>Course</TableHeaderCell>
                <TableHeaderCell>Trainer</TableHeaderCell>
                <TableHeaderCell className="text-right">Awaiting approval</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  <span className="sr-only">Action</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {section.data.batches.map((b) => (
                <TableRow key={b.batchId}>
                  <TableCell>
                    <span className="block font-medium text-ink">{b.batchName}</span>
                    <span className="block font-mono text-2xs text-ink-muted">{b.batchCode}</span>
                  </TableCell>
                  <TableCell className="text-ink-muted">{b.course || "—"}</TableCell>
                  <TableCell className="text-ink-muted">{b.trainerName ?? "Trainer not assigned"}</TableCell>
                  <TableCell className="text-right font-mono">{b.recommended}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/certificates/${encodeURIComponent(b.batchId)}`} className="whitespace-nowrap text-xs font-medium text-signal-blue hover:underline">
                      Review {b.batchName}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {section.data.batchesWithPending > section.data.batches.length && (
            <p className="mt-3 text-xs text-ink-muted">
              Showing {section.data.batches.length} of {section.data.batchesWithPending} batches with pending recommendations.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- recent activity

function Activity({ section, className }: { section: AdminDashboardData["activity"]; className?: string }) {
  return (
    <Panel
      id="dash-activity"
      title="Recent activity"
      description={section.status === "ok" && section.data.unreadCount > 0 ? `${section.data.unreadCount} unread notifications` : "Your latest notifications"}
      action={{ href: "/admin/notifications", label: "View all notifications" }}
      className={className}
    >
      {section.status === "error" ? (
        <SectionError />
      ) : section.data.items.length === 0 ? (
        <Compact title="No recent activity" description="Notifications for your account will appear here." />
      ) : (
        <ul className="divide-y divide-surface-border">
          {section.data.items.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                {n.link ? (
                  <Link href={n.link} className="block truncate text-sm font-medium text-ink hover:underline">
                    {n.title}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                )}
                {n.body && <p className="line-clamp-2 text-xs text-ink-muted">{n.body}</p>}
                <p className="font-mono text-2xs text-ink-faint">{formatDateTime(n.createdAt)}</p>
              </div>
              {n.unread && (
                <Badge tone="blue" className="shrink-0">
                  Unread
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- quick actions (links to existing workflows only)

const QUICK_ACTIONS = [
  { href: "/admin/users", label: "Invite user", note: "Users", icon: UserPlus },
  { href: "/admin/batches/new", label: "Create batch", note: "Batches", icon: Layers },
  { href: "/admin/classes", label: "Classes", note: "Schedule and review", icon: CalendarDays },
  { href: "/admin/classes/new", label: "Schedule class", note: "Classes", icon: CalendarPlus },
  { href: "/admin/tests", label: "Tests", note: "Create and publish", icon: FileQuestion },
  { href: "/admin/exam-monitoring", label: "Exam monitoring", note: "Live attempts", icon: ShieldCheck },
  { href: "/admin/certificates", label: "Certificates", note: "Completions", icon: Award },
] as const;

function QuickActions({ className }: { className?: string }) {
  return (
    <Panel id="dash-actions" title="Quick actions" className={className}>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {QUICK_ACTIONS.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="flex items-center gap-3 rounded-md border border-surface-border px-3 py-2 hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
              <a.icon className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{a.label}</span>
                <span className="block text-xs text-ink-muted">{a.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---------------------------------------------------------------- page

export const DASHBOARD_TITLE = "Training Intelligence & Operations";
export const DASHBOARD_SUBTITLE = "Track performance, manage operations, and ensure successful training outcomes.";

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={DASHBOARD_TITLE}
        description={DASHBOARD_SUBTITLE}
        actions={
          <p className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-ink-muted">
            As of{" "}
            <time dateTime={data.today} className="font-medium text-ink">
              {calendarDate(data.today, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </time>{" "}
            · India time
          </p>
        }
      />
      <Metrics section={data.metrics} />
      <Attention section={data.attention} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Performance section={data.performance} className="lg:col-span-2" />
        <TrainingHealth section={data.health} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Overview section={data.overview} />
        <WeakTopics section={data.performance} />
        <TodayClasses section={data.todayClasses} today={data.today} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <UpcomingClasses section={data.upcomingClasses} />
        <UpcomingTests section={data.upcomingTests} />
        <Activity section={data.activity} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <QuickActions />
        <div className="lg:col-span-1 xl:col-span-2">
          <PendingApprovalsPanel section={data.approvals} />
        </div>
      </div>
    </div>
  );
}

/** Loading placeholder with the dashboard's shape (used as the page's Suspense fallback). */
export function AdminDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the dashboard…</span>
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}
