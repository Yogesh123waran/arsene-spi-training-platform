import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Award, CalendarDays, CalendarPlus, FileQuestion, Layers, Minus, ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TrendChart } from "@/components/dashboard/TrendChart";
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
  type DashboardPeriod,
  type DashboardSection,
  type DashboardTest,
  type TrainingOverview,
  HEALTH_LABEL,
} from "@/lib/dashboard/admin-dashboard";
import { PERIOD_KEYS, PERIOD_LABEL, type Comparison } from "@/lib/dashboard/periods";
import {
  TOPIC_BAND_LABEL,
  formatDateRange,
  formatPercent,
  formatPoints,
  type AnalyticsPeriod,
  type DashboardAnalyticsResult,
  type EvidenceFigure,
  type FigureChange,
  type RateComparison,
  type StudentPerformanceRow,
} from "@/lib/dashboard/analytics";

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

// ---------------------------------------------------------------- analytics panels (D2b-2A: period-based, streamed)

/** A placeholder with the panel's heading while the analytics load (this panel only). */
function PanelLoading({ id, title, className }: { id: string; title: string; className?: string }) {
  return (
    <Panel id={id} title={title} className={className}>
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading {title.toLowerCase()}…</span>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-24 w-full" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </div>
    </Panel>
  );
}

function AnalyticsUnavailable() {
  return <ErrorState title="Advanced analytics are temporarily unavailable." description="Please refresh the page. Other sections are unaffected." className="py-8" />;
}

const periodText = (p: AnalyticsPeriod) => `${p.label} · ${p.rangeText} vs ${p.prevRangeText}`;

function ComparisonText({ c }: { c: RateComparison }) {
  if (c.state === "no_data") return <span className="text-ink-faint">No data in this period</span>;
  if (c.state === "no_comparison") return <span className="text-ink-faint">No comparison data</span>;
  const Icon = c.points === null || c.points === 0 ? Minus : c.points > 0 ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1 text-ink-muted">
      <Icon className="h-3 w-3" aria-hidden />
      <span className="font-mono">{formatPoints(c)}</span>
      <span className="text-ink-faint">vs {formatPercent(c.previous)} before</span>
    </span>
  );
}

async function PerformancePanel({ analytics, className }: { analytics: Promise<DashboardAnalyticsResult>; className?: string }) {
  const { panels } = await analytics;
  return (
    <Panel
      id="dash-performance"
      title="Training performance"
      description={panels.status === "ok" ? periodText(panels.data.period) : undefined}
      action={{ href: "/admin/performance", label: "View detailed performance" }}
      className={className}
    >
      {panels.status === "error" ? (
        <AnalyticsUnavailable />
      ) : !panels.data.hasActivity ? (
        <Compact
          title="No activity in this period"
          description={`No released test results, attendance records or scored assignments between ${panels.data.period.rangeText}.${panels.data.hasComparison ? "" : " The comparison period has none either."}`}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {panels.data.performance.map((m) => (
              <div key={m.key} className="rounded-md border border-surface-border px-3 py-2">
                <dt className="text-xs text-ink-muted">{m.label}</dt>
                <dd className="font-mono text-xl font-semibold text-ink">{formatPercent(m.comparison.current)}</dd>
                <dd className="text-2xs">
                  <ComparisonText c={m.comparison} />
                </dd>
                <dd className="text-2xs text-ink-faint">
                  {m.evidence.current} {m.evidenceNoun} · {m.evidence.display === "—" ? "none before" : `${m.evidence.display} vs before`}
                </dd>
              </div>
            ))}
          </dl>
          <figure aria-labelledby="dash-trend-caption">
            <figcaption id="dash-trend-caption" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {panels.data.period.bucket === "week" ? "Weekly" : "Monthly"} trend (India time) — gaps mean no data in that {panels.data.period.bucket}
            </figcaption>
            <div className="mt-2">
              <TrendChart points={panels.data.trend} captionId="dash-trend-caption" />
            </div>
          </figure>
        </div>
      )}
    </Panel>
  );
}

const HEALTH_TONE = { healthy: "green", watch: "amber", attention: "red", no_data: "neutral", unavailable: "neutral" } as const;

async function TrainingHealthPanel({ analytics, className }: { analytics: Promise<DashboardAnalyticsResult>; className?: string }) {
  const { health } = await analytics;
  return (
    <Panel id="dash-health" title="Training health" description="Worst line wins · each status shows the database fact behind it" className={className}>
      {health.status === "error" ? (
        <SectionError />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-surface-border bg-surface-sunken px-3 py-2">
            <span className="text-sm font-medium text-ink">
              Overall: {health.data.overall.status === "no_data" ? "No data" : HEALTH_LABEL[health.data.overall.status]}
              {health.data.overall.drivers.length > 0 && <span className="font-normal text-ink-muted"> — {health.data.overall.drivers.join(", ")}</span>}
            </span>
            <span className="text-2xs text-ink-faint">
              Based on {health.data.overall.basedOn} of {health.data.overall.total} indicators
            </span>
          </div>
          <ul className="divide-y divide-surface-border">
            {health.data.lines.map((h) => (
              <li key={h.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{h.label}</span>
                  <Badge tone={HEALTH_TONE[h.status]}>{HEALTH_LABEL[h.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{h.reason}</p>
                {(h.status === "watch" || h.status === "attention") && (
                  <Link href={h.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-signal-blue hover:underline">
                    {h.linkLabel} <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

const BAND_TONE = { healthy: "green", watch: "amber", attention: "red" } as const;
const BAND_BAR = { healthy: "bg-signal-green", watch: "bg-signal-amber", attention: "bg-signal-red" } as const;

async function WeakTopicsPanel({ analytics }: { analytics: Promise<DashboardAnalyticsResult> }) {
  const { panels } = await analytics;
  return (
    <Panel
      id="dash-topics"
      title="Weak Topics"
      description={panels.status === "ok" ? `${panels.data.period.label} · ${panels.data.period.rangeText} · Healthy ≥ 80%, Watch ≥ 65%, Attention < 65%` : undefined}
      action={{ href: "/admin/performance", label: "View module performance" }}
    >
      {panels.status === "error" ? (
        <AnalyticsUnavailable />
      ) : panels.data.topics.length === 0 ? (
        <Compact
          title="Insufficient data"
          description={`No module has 5 or more graded answers in this period (released results: n = ${panels.data.resultsInPeriod}).`}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {panels.data.topics.map((t) => (
            <li key={t.moduleId}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">{t.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-ink">{formatPercent(t.percent)}</span>
                  <Badge tone={BAND_TONE[t.band]}>{TOPIC_BAND_LABEL[t.band]}</Badge>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-surface-sunken" aria-hidden="true">
                <div className={`h-full ${BAND_BAR[t.band]}`} style={{ width: `${Math.max(0, Math.min(100, t.percent))}%` }} />
              </div>
              <p className="mt-0.5 text-2xs text-ink-faint">{t.answers} graded answers</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- student performance (D2b-2C: current ranking from 0027, streamed)

/** Arrow per trend direction — always paired with a text label and the pp value (never colour alone). */
const TREND_ARROW = { up: "↑", down: "↓", neutral: "→", none: "" } as const;
const TREND_TONE = { up: "text-signal-green", down: "text-signal-red", neutral: "text-ink-muted", none: "text-ink-faint" } as const;
const SP_HEAD = "px-2 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-muted";

function TrendCell({ row }: { row: StudentPerformanceRow }) {
  if (row.trendDirection === "none") return <span className="text-xs text-ink-faint">{row.trendDisplay}</span>;
  return (
    <span className={`inline-flex items-center justify-end gap-1 font-mono text-xs ${TREND_TONE[row.trendDirection]}`}>
      <span aria-hidden="true">{TREND_ARROW[row.trendDirection]}</span>
      <span className="sr-only">{row.directionLabel}:</span>
      <span>{row.trendDisplay}</span>
    </span>
  );
}

async function StudentPerformancePanel({ analytics }: { analytics: Promise<DashboardAnalyticsResult> }) {
  const { panels } = await analytics;
  return (
    <Panel id="dash-students" title="Student Performance (Top 5)" description="By average score" action={{ href: "/admin/performance", label: "View detailed performance" }}>
      {panels.status === "error" ? (
        <AnalyticsUnavailable />
      ) : panels.data.students.insufficient ? (
        <Compact title="Insufficient data" description="No student has 3 or more released results in the last 366 days" />
      ) : (
        <>
          <table className="w-full table-fixed border-collapse text-sm">
            <caption className="sr-only">Student Performance (Top 5), by average score</caption>
            <colgroup>
              <col className="w-9" />
              <col />
              <col className="w-20" />
              <col className="w-28" />
            </colgroup>
            <thead className="border-b border-surface-border bg-surface-sunken">
              <tr>
                <th scope="col" className={SP_HEAD}>#</th>
                <th scope="col" className={SP_HEAD}>Student Name</th>
                <th scope="col" className={`${SP_HEAD} text-right`}>Test Avg</th>
                <th scope="col" className={`${SP_HEAD} text-right`}>Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {panels.data.students.rows.map((s) => (
                <tr key={s.id}>
                  <td className="px-2 py-2 align-top">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-surface-border bg-surface-sunken font-mono text-2xs font-semibold text-ink">{s.rank}</span>
                  </td>
                  <td className="min-w-0 px-2 py-2 align-top">
                    <span className="block break-words font-medium text-ink">{s.name}</span>
                    {s.code && <span className="block break-all font-mono text-2xs text-ink-faint">{s.code}</span>}
                  </td>
                  <td className="px-2 py-2 text-right align-top font-mono text-sm font-semibold text-ink">{s.averageDisplay}</td>
                  <td className="px-2 py-2 text-right align-top">
                    <TrendCell row={s} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-2xs text-ink-faint">{panels.data.students.caption}</p>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------- batch / course comparison (D2b-2B: period-based, streamed)

/** pp change only where 0024 has a previous figure; otherwise "No comparison data" (never 0 pp). */
function ChangeText({ change }: { change: FigureChange }) {
  if (change.comparison.state !== "change") return <span className="text-ink-faint">No comparison data</span>;
  return (
    <span>
      <ComparisonText c={change.comparison} /> <span className="text-ink-faint">· {change.previousEvidence} before</span>
    </span>
  );
}

/** One figure: the value (or "Insufficient data (n)"), the records behind it, and its change when there is one. */
function FigureItem({ label, figure, noun, change }: { label: string; figure: EvidenceFigure; noun: string; change?: FigureChange }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs text-ink-muted">{label}</dt>
      <dd className={figure.value === null ? "text-xs text-ink-faint" : "font-mono text-sm font-semibold text-ink"}>{figure.display}</dd>
      {figure.value !== null && (
        <dd className="text-2xs text-ink-faint">
          {figure.evidence} {noun}
        </dd>
      )}
      {change && (
        <dd className="text-2xs">
          <ChangeText change={change} />
        </dd>
      )}
    </div>
  );
}

function ShownText({ text, order }: { text: string | null; order: "name" | "title" }) {
  return text ? <p className="mt-3 text-2xs text-ink-faint">{text} · listed by {order}</p> : null;
}

async function BatchComparisonPanel({ analytics }: { analytics: Promise<DashboardAnalyticsResult> }) {
  const { panels } = await analytics;
  return (
    <Panel
      id="dash-batches"
      title="Batch comparison"
      description={panels.status === "ok" ? `${periodText(panels.data.period)} · listed by name` : undefined}
      action={{ href: "/admin/batches", label: "View all batches" }}
    >
      {panels.status === "error" ? (
        <AnalyticsUnavailable />
      ) : panels.data.batches.rows.length === 0 ? (
        <Compact
          title="No batch activity in this period"
          description={`No batch has released test results, attendance records or scored assignments between ${panels.data.period.rangeText}, and no batch is ongoing.`}
        />
      ) : (
        <>
          <ul className="divide-y divide-surface-border">
            {panels.data.batches.rows.map((b) => (
              <li key={b.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <Link href={b.href} className="break-words text-sm font-medium text-ink hover:underline">
                      {b.name}
                    </Link>
                    <p className="break-words text-2xs text-ink-faint">
                      <span className="font-mono">{b.code}</span> · {b.course} · {b.students} students enrolled (current)
                    </p>
                  </div>
                  <Link href={b.performanceHref} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-signal-blue hover:underline">
                    View performance<span className="sr-only"> of {b.name}</span> <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
                  <FigureItem label="Test average" figure={b.testAvg} noun="released results" change={b.testAvgChange} />
                  <FigureItem label="Pass rate" figure={b.passRate} noun="released results" />
                  <FigureItem label="Attendance" figure={b.attendance} noun="attendance records" change={b.attendanceChange} />
                  <FigureItem label="Assignment average" figure={b.assignmentAvg} noun="scored submissions" />
                  <div className="min-w-0">
                    <dt className="text-2xs text-ink-muted">Completion (current)</dt>
                    <dd className="font-mono text-sm font-semibold text-ink">{b.completionDisplay}</dd>
                    <dd className="text-2xs text-ink-faint">of enrolments now, not this period</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <ShownText text={panels.data.batches.shownText} order="name" />
        </>
      )}
    </Panel>
  );
}

async function CourseComparisonPanel({ analytics }: { analytics: Promise<DashboardAnalyticsResult> }) {
  const { panels } = await analytics;
  return (
    <Panel
      id="dash-courses"
      title="Course comparison"
      description={panels.status === "ok" ? `${periodText(panels.data.period)} · listed by title` : undefined}
      action={{ href: "/admin/courses", label: "View all courses" }}
    >
      {panels.status === "error" ? (
        <AnalyticsUnavailable />
      ) : panels.data.courses.rows.length === 0 ? (
        <Compact
          title="No course activity in this period"
          description={`No course has a batch with released test results, attendance records or scored assignments between ${panels.data.period.rangeText}, or an ongoing batch.`}
        />
      ) : (
        <>
          <ul className="divide-y divide-surface-border">
            {panels.data.courses.rows.map((c) => (
              <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link href={c.href} className="break-words text-sm font-medium text-ink hover:underline">
                    {c.title}
                  </Link>
                  <p className="text-2xs text-ink-faint">
                    <span className="font-mono">{c.code}</span>
                  </p>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                  <FigureItem label="Test average" figure={c.testAvg} noun="released results" change={c.testAvgChange} />
                  <FigureItem label="Pass rate" figure={c.passRate} noun="released results" />
                  <FigureItem label="Attendance" figure={c.attendance} noun="attendance records" />
                  <FigureItem label="Assignment average" figure={c.assignmentAvg} noun="scored submissions" />
                </dl>
              </li>
            ))}
          </ul>
          <ShownText text={panels.data.courses.shownText} order="title" />
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

/** Reporting-period selector: plain server links (`?period=`), no client state. */
function PeriodSelector({ period, today }: { period: DashboardPeriod; today: string }) {
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <nav aria-label="Reporting period">
        <ul className="flex flex-wrap gap-1 rounded-md border border-surface-border bg-surface-raised p-1">
          {PERIOD_KEYS.map((key) => {
            const selected = key === period.key;
            return (
              <li key={key}>
                <Link
                  href={`/admin?period=${key}`}
                  aria-current={selected ? "page" : undefined}
                  className={
                    "block rounded px-2.5 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 " +
                    (selected ? "bg-primary-500 text-white" : "text-ink-muted hover:bg-surface-sunken hover:text-ink")
                  }
                >
                  {PERIOD_LABEL[key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="text-2xs text-ink-muted">
        <span className="font-medium text-ink">
          {period.label} · {formatDateRange(period.from, period.to)}
        </span>{" "}
        vs {formatDateRange(period.prevFrom, period.prevTo)} · As of{" "}
        <time dateTime={today}>{calendarDate(today, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</time> · India time
      </p>
    </div>
  );
}

export function AdminDashboard({ data, analytics }: { data: AdminDashboardData; analytics: Promise<DashboardAnalyticsResult> }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={DASHBOARD_TITLE} description={DASHBOARD_SUBTITLE} actions={<PeriodSelector period={data.period} today={data.today} />} />
      <Metrics section={data.metrics} />
      <Attention section={data.attention} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Suspense key={`performance-${data.period.key}`} fallback={<PanelLoading id="dash-performance" title="Training performance" className="lg:col-span-2" />}>
          <PerformancePanel analytics={analytics} className="lg:col-span-2" />
        </Suspense>
        <Suspense key={`health-${data.period.key}`} fallback={<PanelLoading id="dash-health" title="Training health" />}>
          <TrainingHealthPanel analytics={analytics} />
        </Suspense>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Suspense key={`batches-${data.period.key}`} fallback={<PanelLoading id="dash-batches" title="Batch comparison" />}>
          <BatchComparisonPanel analytics={analytics} />
        </Suspense>
        <Suspense key={`courses-${data.period.key}`} fallback={<PanelLoading id="dash-courses" title="Course comparison" />}>
          <CourseComparisonPanel analytics={analytics} />
        </Suspense>
      </div>
      <Suspense key={`students-${data.period.key}`} fallback={<PanelLoading id="dash-students" title="Student Performance (Top 5)" />}>
        <StudentPerformancePanel analytics={analytics} />
      </Suspense>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Overview section={data.overview} />
        <Suspense key={`topics-${data.period.key}`} fallback={<PanelLoading id="dash-topics" title="Weak Topics" />}>
          <WeakTopicsPanel analytics={analytics} />
        </Suspense>
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
