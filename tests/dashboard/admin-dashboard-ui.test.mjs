// Super Admin dashboard (D1 / D2a / D2b-2A) — source-level tests for the page, the view and the data
// boundary: real data only (no mock imports), Super Admin service, session client only (no service role),
// no client-side database access, fixed error messages, accessible structure, no fake trends, no greeting
// or emoji, no private fields, links only to existing workflows. D2b-2A deliberately changes three earlier
// rules: the header now has a real period selector (server links), the performance summary and Weak Topics
// are period-based from dashboard_analytics (streamed in their own Suspense boundaries), and Training
// health shows six lines with an overall worst-line status. D2b-2B adds the batch and course comparison panels
// (same single response, name order, no status bands, links to the existing batch / course / performance pages).
// D2b-2C adds the Student Performance (Top 5) panel: the current ranking (0027 students.current) with the period's trend.
// D2b-2D adds Course Progress (current-state delivery and enrolment per course) and the attendance-definition note.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const strip = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const importsOf = (code) => [...code.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

const PAGE = "src/app/admin/page.tsx";
const VIEW = "src/components/dashboard/AdminDashboard.tsx";
const CHART = "src/components/dashboard/TrendChart.tsx";
const LIB = "src/lib/dashboard/admin-dashboard.ts";
const ANALYTICS = "src/lib/dashboard/analytics.ts";
const REPO_CORE = "src/repositories/dashboard.repository.core.ts";
const REPO = "src/repositories/dashboard.repository.ts";
const SVC_CORE = "src/services/dashboard.service.core.ts";
const SVC = "src/services/dashboard.service.ts";
const DASHBOARD_FILES = [PAGE, VIEW, CHART, LIB, ANALYTICS, REPO_CORE, REPO, SVC_CORE, SVC];

test("page: dynamic; loads through the Super Admin dashboard service with ?period=; the current-state half first, analytics streamed; fixed error message", () => {
  const page = strip(src(PAGE));
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /load = await adminDashboardService\.load\(period\);\s*data = await load\.core;/, "waits for the current-state half only");
  assert.match(page, /<AdminDashboard data=\{data\} analytics=\{load\.analytics\} \/>/, "the analytics promise streams into the view");
  assert.match(page, /<DashboardContent period=\{searchParams\.period\} \/>/, "the raw value goes to the service, which validates it");
  assert.match(page, /<Suspense fallback=\{<AdminDashboardSkeleton \/>\}>/, "loading state scoped to this page");
  assert.ok(!exists("src/app/admin/loading.tsx"), "no admin-wide loading.tsx (it would replace every other /admin page's loading state)");
  assert.match(page, /<ErrorState title="We couldn't load the dashboard" description="Please try again\." \/>/);
  assert.match(page, /console\.error\("\[admin\/dashboard\] load failed:", err instanceof Error \? err\.name : "unknown error"\)/, "error name only");
  for (const spec of importsOf(page)) {
    assert.ok(["react", "@/components/layout/PageHeader", "@/components/ui/ErrorState", "@/components/dashboard/AdminDashboard", "@/services/dashboard.service"].includes(spec), `page imports ${spec}`);
  }
  assert.match(src("src/app/admin/layout.tsx"), /<RoleGuard allowedRoles=\{\["admin"\]\}>/, "the admin RoleGuard still wraps the page");
});

test("view: a server component rendering the read model only — no mock data, services, repositories or database access", () => {
  for (const rel of [VIEW, CHART]) {
    const raw = src(rel);
    assert.doesNotMatch(raw, /^["']use client["'];/, `${rel}: server component`);
    for (const spec of importsOf(raw)) {
      assert.ok(
        ["next/link", "react", "lucide-react", "@/components/layout/PageHeader", "@/components/dashboard/TrendChart", "@/utils/format", "@/lib/dashboard/admin-dashboard", "@/lib/dashboard/periods", "@/lib/dashboard/analytics"].includes(spec) ||
          spec.startsWith("@/components/ui/"),
        `${rel} imports ${spec}`
      );
    }
    const view = strip(raw);
    assert.doesNotMatch(view, /lib\/mock|dashboard\.mock|@\/services|@\/repositories|supabase|\.from\(\s*["'`]|\.rpc\(/i, `${rel} (Array.from in the skeleton is not a table read)`);
    assert.doesNotMatch(view, /onClick|<form|formAction|useState|useEffect|"use server"/, `${rel}: no mutations or client behaviour (Panel's action={{ href, label }} is a link)`);
  }
});

test("view: no greeting, emoji, invented trend widgets, hard-coded colours or private fields; arrows only for real comparisons", () => {
  const view = strip(src(VIEW));
  assert.doesNotMatch(view, /Good (morning|afternoon|evening)|welcomeName/i);
  assert.doesNotMatch(view, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "no emoji");
  assert.doesNotMatch(view, /KpiCard|TrendingUp|TrendingDown|trendLabel|vs last month/i, "no invented trend widgets");
  // Arrows only inside ComparisonLine (D2a KPI comparisons) and ComparisonText (D2b-2A period comparisons in pp).
  const arrows = [...view.matchAll(/\bArrow(Up|Down)\b/g)].map((m) => m.index);
  const spans = [["function ComparisonLine", "function Metrics("], ["function ComparisonText", "async function PerformancePanel"]].map(([a, b]) => [view.indexOf(a), view.indexOf(b)]);
  assert.ok(arrows.length > 0 && arrows.every((i) => i < 400 || spans.some(([a, b]) => i > a && i < b)), "arrows only in the import, ComparisonLine and ComparisonText");
  assert.match(view, /const cmp = m\.key === "classesToday" \|\| m\.key === "completionsAwaitingApproval" \? section\.data\.comparisons\[m\.key\] : null;/);
  assert.match(view, /function ComparisonLine\(\{ cmp \}: \{ cmp: Comparison \}\)/);
  assert.match(view, /cmp\.percent !== null && cmp\.direction !== "same"/, "a percentage only when there is a baseline");
  assert.match(view, /function ComparisonText\(\{ c \}: \{ c: RateComparison \}\)/);
  for (const rel of [VIEW, CHART]) assert.doesNotMatch(strip(src(rel)), /#[0-9a-fA-F]{6}\b/, `${rel}: theme tokens only`);
  assert.doesNotMatch(view, /email|phone|account_?status|accountStatus|organization|designation/i);
  assert.doesNotMatch(view, /at-risk|at risk|needs follow-up/i, "no D3 content");
});

test("accessibility: one h1 (PageHeader), each section an h2 inside a labelled region, the trend has a caption and a table alternative", () => {
  const view = strip(src(VIEW));
  const chart = strip(src(CHART));
  assert.doesNotMatch(view, /<h1/, "the only h1 comes from PageHeader");
  assert.equal((view.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(view, /<section aria-labelledby=\{id\}/);
  assert.match(view, /<h2 id=\{id\} className=/);
  for (const id of ["dash-metrics", "dash-attention"]) assert.match(view, new RegExp(`<h2 id="${id}"`), id);
  for (const id of ["dash-today", "dash-upcoming-classes", "dash-tests", "dash-overview", "dash-performance", "dash-health", "dash-topics", "dash-batches", "dash-courses", "dash-students", "dash-progress", "dash-activity", "dash-actions", "dash-approvals"]) {
    assert.match(view, new RegExp(`id="${id}"`), id);
  }
  assert.match(view, /<figure aria-labelledby="dash-trend-caption">/);
  assert.match(view, /<TrendChart points=\{panels\.data\.trend\} captionId="dash-trend-caption" \/>/);
  assert.match(chart, /<svg viewBox=\{`0 0 \$\{W\} \$\{H\}`\} className="h-56 w-full" preserveAspectRatio="none" aria-hidden="true">/, "the SVG is decorative…");
  assert.match(chart, /<summary className="cursor-pointer text-xs font-medium text-signal-blue">View the trend as a table<\/summary>/, "…the figures are a keyboard-reachable table");
  for (const l of ["Test average", "Pass rate", "Attendance", "Assignment average"]) assert.ok(chart.includes(`label: "${l}"`), `legend: ${l}`);
  assert.match(chart, /strokeDasharray=\{s\.dash \|\| undefined\}/, "series differ by line pattern, not colour alone");
  assert.match(view, /aria-busy="true"/, "skeletons announce loading");
  assert.match(view, /\{t\.state === "open" \? "Open" : "Scheduled"\}/, "status as text, not colour alone");
  assert.match(view, />\s*Unread\s*</);
  for (const label of ["View all classes", "View all tests", "View all batches", "View detailed performance", "View all notifications", "View module performance", "Review all completions", "View all courses", "View performance"]) {
    assert.ok(view.includes(label), label);
  }
  assert.match(view, /<Badge tone=\{BAND_TONE\[t\.band\]\}>\{TOPIC_BAND_LABEL\[t\.band\]\}<\/Badge>/, "topic band as text, not only the bar colour");
  assert.match(view, /<TableHeaderCell>Batch<\/TableHeaderCell>/, "pending approvals is a semantic table");
  assert.match(view, /<span className="sr-only">Action<\/span>/);
  assert.match(view, /Review \{b\.batchName\}/, "descriptive per-row link");
});

test("header: the approved title and subtitle; a real period selector (server links, current marked) showing the period and the comparison period", () => {
  const view = strip(src(VIEW));
  assert.match(view, /export const DASHBOARD_TITLE = "Training Intelligence & Operations";/);
  assert.match(view, /export const DASHBOARD_SUBTITLE = "Track performance, manage operations, and ensure successful training outcomes\.";/);
  assert.match(view, /<PageHeader title=\{DASHBOARD_TITLE\} description=\{DASHBOARD_SUBTITLE\} actions=\{<PeriodSelector period=\{data\.period\} today=\{data\.today\} \/>\} \/>/);
  assert.match(view, /<nav aria-label="Reporting period">/);
  assert.match(view, /\{PERIOD_KEYS\.map\(\(key\) => \{/, "exactly the four supported periods");
  assert.match(view, /href=\{`\/admin\?period=\$\{key\}`\}/, "server links; no client state");
  assert.match(view, /aria-current=\{selected \? "page" : undefined\}/);
  assert.match(view, /\{period\.label\} · \{formatDateRange\(period\.from, period\.to\)\}/);
  assert.match(view, /vs \{formatDateRange\(period\.prevFrom, period\.prevTo\)\}/);
  assert.match(view, /<time dateTime=\{today\}>/, "the India date stays visible");
  assert.doesNotMatch(view, /<select|<Select|useRouter|searchParams/i, "no client-side period state");
  assert.match(strip(src(PAGE)), /<PageHeader title=\{DASHBOARD_TITLE\} \/>/, "the page-level error keeps the title");
});

test("performance summary and weak topics: management-level, period-based, never the Performance page's detail", () => {
  const view = strip(src(VIEW));
  assert.match(view, /title="Training performance"/);
  assert.match(view, /action=\{\{ href: "\/admin\/performance", label: "View detailed performance" \}\}/, "the detail stays on the existing Performance page");
  assert.match(view, /\{panels\.data\.performance\.map\(\(m\) =>/, "the four summary figures");
  assert.match(view, /if \(c\.state === "no_comparison"\) return <span className="text-ink-faint">No comparison data<\/span>;/);
  assert.match(view, /title="No activity in this period"/);
  assert.doesNotMatch(view, /strongModules|weakModules|studentResults|Stronger modules|Weaker modules|filters\.batches|PerformanceFilters|PerformanceView/, "no module / student / batch detail");
  assert.match(view, /title="Weak Topics"/);
  assert.match(view, /title="Insufficient data"/);
  assert.match(view, /released results: n = \$\{panels\.data\.resultsInPeriod\}/);
  assert.doesNotMatch(view + strip(src(ANALYTICS)), /"Weak"|"Developing"|"Strong"|"developing"/, "one vocabulary: Healthy / Watch / Attention");
});

test("training health: six lines, each with its reason; overall worst line wins with 'Based on X of 6'; never a numeric score", () => {
  const view = strip(src(VIEW));
  assert.match(view, /<Badge tone=\{HEALTH_TONE\[h\.status\]\}>\{HEALTH_LABEL\[h\.status\]\}<\/Badge>/, "health status as text");
  assert.match(view, /<p className="mt-1 text-xs text-ink-muted">\{h\.reason\}<\/p>/, "every status shows its reason");
  assert.match(view, /Overall: \{health\.data\.overall\.status === "no_data" \? "No data" : HEALTH_LABEL\[health\.data\.overall\.status\]\}/);
  assert.match(view, /Based on \{health\.data\.overall\.basedOn\} of \{health\.data\.overall\.total\} indicators/);
  assert.match(view, /no_data: "neutral", unavailable: "neutral"/, "No data / Unavailable are neutral, not failures");
  assert.doesNotMatch(view, /health score|score\}|\/100/i, "no numeric score");
  assert.doesNotMatch(view, /top performers|ranking|course-wise|batch-wise/i, "no 'top performers' / ranking wording in the view (Student Performance (Top 5) is the approved D2b-2C title)");
});

test("streaming and isolation: each analytics panel has its own Suspense boundary and a fixed unavailable state; current-state sections render without them", () => {
  const view = strip(src(VIEW));
  for (const [panel, key] of [["PerformancePanel", "performance"], ["TrainingHealthPanel", "health"], ["WeakTopicsPanel", "topics"], ["BatchComparisonPanel", "batches"], ["CourseComparisonPanel", "courses"], ["StudentPerformancePanel", "students"], ["CourseProgressPanel", "progress"]]) {
    assert.match(view, new RegExp(`<Suspense key=\\{\`${key}-\\$\\{data\\.period\\.key\\}\`\\} fallback=\\{<PanelLoading `), `${panel}: own fallback, re-shown when the period changes`);
    assert.match(view, new RegExp(`async function ${panel}\\(`), `${panel} awaits the analytics promise itself`);
  }
  assert.match(view, /title="Advanced analytics are temporarily unavailable\."/, "fixed message — no SQL or stack detail");
  for (const s of ["<Metrics section={data.metrics} />", "<Attention section={data.attention} />", "<Overview section={data.overview} />", "<TodayClasses section={data.todayClasses}", "<PendingApprovalsPanel section={data.approvals} />"]) {
    assert.ok(view.includes(s), `${s} renders from the current-state half`);
  }
});

test("sections: empty and error states; attention hidden when nothing needs attention; responsive grids; reading order", () => {
  const view = strip(src(VIEW));
  assert.match(view, /if \(section\.status === "ok" && section\.data\.length === 0\) return null;/);
  assert.match(view, /title="This section couldn't be loaded"/);
  for (const t of ["No classes today", "No upcoming classes", "No upcoming tests", "No recent activity"]) assert.ok(view.includes(t), t);
  assert.match(view, /grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6/, "2 / 3 / 4 / 6 metrics per row");
  assert.match(view, /grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3/, "1 / 2 / 3 content columns");
  const order = ["<Metrics", "<Attention", "<PerformancePanel", "<TrainingHealthPanel", "<BatchComparisonPanel", "<CourseComparisonPanel", "<StudentPerformancePanel", "<Overview", "<CourseProgressPanel", "<WeakTopicsPanel", "<TodayClasses", "<UpcomingClasses", "<UpcomingTests", "<Activity", "<QuickActions", "<PendingApprovalsPanel"];
  const positions = order.map((s) => view.lastIndexOf(s));
  assert.ok(positions.every((p) => p >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, "attention right after the metrics; reading order matches the layout");
});

test("quick actions and links: only existing /admin routes, no new mutation workflows", () => {
  const view = strip(src(VIEW)) + strip(src(LIB)) + strip(src(ANALYTICS)) + strip(src(SVC_CORE));
  const hrefs = [...view.matchAll(/href: "([^"]+)"/g)].map((m) => m[1].split("?")[0]);
  assert.ok(hrefs.length >= 10);
  const routes = {
    "/admin/users": "src/app/admin/users/page.tsx",
    "/admin/batches": "src/app/admin/batches/page.tsx",
    "/admin/courses": "src/app/admin/courses/page.tsx",
    "/admin/batches/new": "src/app/admin/batches/new/page.tsx",
    "/admin/classes": "src/app/admin/classes/page.tsx",
    "/admin/classes/new": "src/app/admin/classes/new/page.tsx",
    "/admin/tests": "src/app/admin/tests/page.tsx",
    "/admin/exam-monitoring": "src/app/admin/exam-monitoring/page.tsx",
    "/admin/certificates": "src/app/admin/certificates/page.tsx",
    "/admin/performance": "src/app/admin/performance/page.tsx",
    "/admin/notifications": "src/app/admin/notifications/page.tsx",
    "/admin/attendance": "src/app/admin/attendance/page.tsx",
  };
  for (const h of hrefs) {
    assert.ok(routes[h], `known route ${h}`);
    assert.ok(exists(routes[h]), `${h} exists`);
  }
  assert.match(view, /href=\{`\/admin\/classes\/\$\{encodeURIComponent\(c\.id\)\}`\}/);
  assert.match(view, /href=\{`\/admin\/tests\/\$\{encodeURIComponent\(t\.id\)\}`\}/);
  assert.match(view, /href=\{`\/admin\/certificates\/\$\{encodeURIComponent\(b\.batchId\)\}`\}/);
  assert.ok(exists("src/app/admin/certificates/[batchId]/page.tsx"), "the per-batch completion page exists");
  // D2b-2B links (built in the read model): batch / course detail and the Performance page's batch filter
  assert.ok(view.includes("href: `/admin/batches/${encodeURIComponent(b.id)}`"), "batch detail link");
  assert.ok(view.includes("performanceHref: `/admin/performance?batch=${encodeURIComponent(b.id)}`"), "Performance page, filtered to the batch");
  assert.ok(view.includes("href: `/admin/courses/${encodeURIComponent(c.id)}`"), "course detail link");
  assert.ok(exists("src/app/admin/batches/[batchId]/page.tsx") && exists("src/app/admin/courses/[courseId]/page.tsx"), "the detail pages exist");
  assert.ok(src("src/app/admin/performance/page.tsx").includes("batchId: first(searchParams.batch)"), "the Performance page reads ?batch=");
});

test("boundary: session client only — no service role, no admin client, no writes; exactly ONE database function call (dashboard_analytics, in the repository)", () => {
  for (const rel of DASHBOARD_FILES) {
    const code = strip(src(rel));
    assert.doesNotMatch(code, /supabase\/admin|createSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY|service_role|auth\.admin|auth-admin/i, rel);
    assert.doesNotMatch(code, /\.(insert|update|upsert|delete)\(/, `${rel}: reads only`);
  }
  const rpcs = DASHBOARD_FILES.flatMap((rel) => [...strip(src(rel)).matchAll(/\.rpc\(([^,)]*)/g)].map((m) => `${rel}:${m[1]}`));
  assert.deepEqual(rpcs, [`${REPO_CORE}:"dashboard_analytics"`], "the analytics RPC only, only in the repository");
  assert.match(src(REPO), /^import "server-only";/);
  assert.match(src(REPO), /createSupabaseServerClient\(\)/, "the caller's own session");
  assert.match(src(SVC), /^import "server-only";/);
  assert.match(strip(src(REPO_CORE)), /\{ count: "exact", head: true \}/, "totals are database counts");
  assert.match(strip(src(REPO_CORE)), /readAllByKeyset/, "the current-batch read is paged");
  assert.doesNotMatch(strip(src(SVC)), /listBatches\(|listStudents\(|listClasses\(|getSummary\(|getOverview\(/, "no unpaged list endpoints for totals");
  for (const f of fs.readdirSync(path.join(root, "src/components/dashboard"))) {
    const code = src(`src/components/dashboard/${f}`);
    if (/^["']use client["'];/.test(code)) assert.doesNotMatch(code, /@\/(services|repositories)|supabase/, `${f}: no server code in client components`);
  }
  assert.match(strip(src(ANALYTICS)), /export function parseAnalytics\(json: unknown\)/, "RPC JSON is validated, not cast");
  assert.match(strip(src(SVC_CORE)), /parseAnalytics\(await fetchAnalytics\(period, today\)\)/);
});

test("the dashboard no longer depends on the Performance service; the dedicated Performance page keeps it", () => {
  for (const rel of [SVC, SVC_CORE, VIEW, PAGE]) assert.doesNotMatch(src(rel), /performanceService|performance\.service|getPerformance/, rel);
  assert.match(src("src/app/admin/performance/page.tsx"), /performanceService/, "the Performance page still uses its own service");
  assert.ok(exists("src/services/performance.service.ts") && exists("src/repositories/performance.repository.ts"));
});

test("the old mock dashboard is gone from the Super Admin page; the shared KpiCard and portal dashboards are untouched", () => {
  assert.doesNotMatch(src(PAGE) + src(VIEW), /dashboard\.mock|adminKpis|recentTestResults|recentActivity|courseProgressSegments/);
  assert.match(src("src/components/dashboard/KpiCard.tsx"), /trend: number|trend,/i, "KpiCard keeps its existing contract for the trainer/student portals");
  assert.match(src("src/components/layout/PortalDashboard.tsx"), /KpiDatum/);
});

test("batch and course comparison (D2b-2B): from the one analytics response, name order, evidence and comparison wording, current completion, no status bands", () => {
  const view = strip(src(VIEW));
  const lib = strip(src(ANALYTICS));
  const panel = (name, next) => view.slice(view.indexOf(`async function ${name}(`), view.indexOf(next));
  const batches = panel("BatchComparisonPanel", "async function CourseComparisonPanel(");
  const courses = panel("CourseComparisonPanel", "function PendingApprovalsPanel(");
  assert.match(batches, /title="Batch comparison"/);
  assert.match(courses, /title="Course comparison"/);
  assert.match(batches, /\{panels\.data\.batches\.rows\.map\(\(b\) =>/);
  assert.match(courses, /\{panels\.data\.courses\.rows\.map\(\(c\) =>/);
  for (const p of [batches, courses]) {
    assert.match(p, /const \{ panels \} = await analytics;/, "the shared analytics promise — no further call");
    assert.match(p, /panels\.status === "error" \? \(\s*<AnalyticsUnavailable \/>/, "the existing unavailable state");
    assert.doesNotMatch(p, /Badge|BAND_TONE|HEALTH_LABEL|TOPIC_BAND_LABEL|Healthy|Watch|Attention/, "no status bands on batches / courses");
    assert.doesNotMatch(p, /\.sort\(|\.reverse\(/, "rows are never re-ordered");
    assert.doesNotMatch(p, /overflow-x|min-w-\[|whitespace-nowrap|<table|<Table/, "no wide table: cards that wrap at 400 px");
  }
  assert.match(batches, /title="No batch activity in this period"/);
  assert.match(courses, /title="No course activity in this period"/);
  assert.match(batches, /<dt className="text-2xs text-ink-muted">Completion \(current\)<\/dt>/, "completion is labelled a current figure");
  assert.match(batches, /of enrolments now, not this period/);
  assert.match(batches, /<Link href=\{b\.href\}/);
  assert.match(batches, /<Link href=\{b\.performanceHref\}[\s\S]*?View performance<span className="sr-only"> of \{b\.name\}<\/span>/, "descriptive per-row link");
  assert.match(courses, /<Link href=\{c\.href\}/);
  assert.match(batches, /listed by name/);
  assert.match(courses, /listed by title/);
  assert.match(view, /<ShownText text=\{panels\.data\.batches\.shownText\} order="name" \/>/);
  assert.match(view, /<ShownText text=\{panels\.data\.courses\.shownText\} order="title" \/>/);
  // responsive: 2 figures per row on a phone, more as the width allows
  assert.match(batches, /grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5/);
  assert.match(courses, /grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4/);
  assert.match(view, /<div className="grid grid-cols-1 gap-4">\s*<Suspense key=\{`batches-/);
  // wording comes from the read model: insufficient evidence and missing comparisons are explicit
  assert.match(lib, /`Insufficient data \(\$\{evidence\}\)`/);
  assert.match(lib, /comparison\.state === "change" \? formatPoints\(comparison\) : "No comparison data"/);
  assert.match(view, /if \(change\.comparison\.state !== "change"\) return <span className="text-ink-faint">No comparison data<\/span>;/);
  assert.match(lib, /shownText: total > rows\.length \? `Showing \$\{rows\.length\} of \$\{total\}` : null/);
  assert.doesNotMatch(lib.slice(lib.indexOf("export function batchComparison"), lib.indexOf("const hasAny")), /\.sort\(/, "no ranking in the read model");
  // D2b-2D not built (student results are D2b-2C, tested below)
  assert.doesNotMatch(view, /datasets\./, "the view renders the read models only, never the raw analytics lists (Course Progress, D2b-2D, uses panels.data.progress)");
});

test("Student Performance (Top 5) (D2b-2C): students.current (0027) in database order — #, name, Test Avg, trend arrow with its pp value and a text label; one analytics response", () => {
  const view = strip(src(VIEW));
  const lib = strip(src(ANALYTICS));
  const panel = view.slice(view.indexOf("const TREND_ARROW ="), view.indexOf("function ChangeText("));
  assert.ok(panel.includes("async function StudentPerformancePanel("), "the panel is inside the D2b-2C section");
  assert.match(panel, /title="Student Performance \(Top 5\)" description="By average score" action=\{\{ href: "\/admin\/performance", label: "View detailed performance" \}\}/, "exact title, subtitle and the existing Performance page link");
  assert.match(panel, /const \{ panels \} = await analytics;/, "the shared analytics promise — no further call");
  assert.match(panel, /panels\.status === "error" \? \(\s*<AnalyticsUnavailable \/>/, "the existing unavailable state");
  assert.match(view, /<Suspense key=\{`students-\$\{data\.period\.key\}`\} fallback=\{<PanelLoading id="dash-students" title="Student Performance \(Top 5\)" \/>\}>\s*<StudentPerformancePanel analytics=\{analytics\} \/>/, "keyed Suspense, same place");
  // exactly four columns, in order
  const heads = [...panel.matchAll(/<th scope="col" className=\{.*?\}>([^<]+)<\/th>/g)].map((m) => m[1]);
  assert.deepEqual(heads, ["#", "Student Name", "Test Avg", "Trend"]);
  assert.equal((panel.match(/<col\b/g) ?? []).length, 4);
  assert.match(panel, /<caption className="sr-only">Student Performance \(Top 5\), by average score<\/caption>/);
  // rows: database order and rank, name with the code beneath, one-decimal average, trend cell
  assert.match(panel, /\{panels\.data\.students\.rows\.map\(\(s\) =>/);
  assert.match(panel, /font-semibold text-ink">\{s\.rank\}<\/span>/, "the database rank number");
  assert.match(panel, /<span className="block break-words font-medium text-ink">\{s\.name\}<\/span>\s*\{s\.code && <span className="block break-all font-mono text-2xs text-ink-faint">\{s\.code\}<\/span>\}/);
  assert.match(panel, /\{s\.averageDisplay\}<\/td>/);
  assert.match(panel, /<TrendCell row=\{s\} \/>/);
  // trend: arrow (decorative) + text label (screen readers) + the pp value — never colour alone; null → "No comparison"
  assert.match(panel, /const TREND_ARROW = \{ up: "↑", down: "↓", neutral: "→", none: "" \} as const;/);
  assert.match(panel, /<span aria-hidden="true">\{TREND_ARROW\[row\.trendDirection\]\}<\/span>\s*<span className="sr-only">\{row\.directionLabel\}:<\/span>\s*<span>\{row\.trendDisplay\}<\/span>/);
  assert.match(panel, /if \(row\.trendDirection === "none"\) return <span className="text-xs text-ink-faint">\{row\.trendDisplay\}<\/span>;/);
  assert.match(lib, /trendDisplay: s\.trend === null \? "No comparison" : formatTrendPoints\(s\.trend\)/);
  assert.match(lib, /if \(points >= TREND_THRESHOLD_PP\) return "up";\s*if \(points <= -TREND_THRESHOLD_PP\) return "down";\s*return "neutral";/, "±1 pp thresholds, inclusive");
  assert.match(lib, /up: "Up", down: "Down", neutral: "No meaningful change", none: "No comparison"/);
  // empty state and caption
  assert.match(panel, /panels\.data\.students\.insufficient \? \(\s*<Compact title="Insufficient data" description="No student has 3 or more released results in the last 366 days" \/>/);
  assert.match(panel, /<p className="mt-3 text-2xs text-ink-faint">\{panels\.data\.students\.caption\}<\/p>/);
  assert.match(lib, /caption: `Current ranking: last 366 days · trend: \$\{periodLabel\} vs previous`/);
  // the current ranking comes from students.current only — never substituted from the period-based lists
  assert.match(lib, /students: studentPerformance\(raw\.students\.current, raw\.students\.current_window, PERIOD_LABEL\[key\]\)/);
  assert.doesNotMatch(lib.slice(lib.indexOf("export function studentPerformance"), lib.indexOf("const hasAny")), /\.sort\(|\.reverse\(|students\.(top|improving|declining)/, "never re-ranked or substituted");
  // wording: none of the retired / banned labels; no per-student links
  assert.doesNotMatch(view, /Student results|Highest test averages|"Improving"|"Declining"|Top performers|View all students/i);
  assert.doesNotMatch(panel, /<Link|href=\{|\?student=|\/admin\/users|\/admin\/students/, "no per-student URL");
  assert.doesNotMatch(panel, /at-risk|at risk|follow-up|intervention|Badge|HEALTH_LABEL/i);
  // responsive (~400 px): a fixed-layout table that fits — wrapping names, narrow fixed columns, no horizontal overflow
  assert.match(panel, /<table className="w-full table-fixed border-collapse text-sm">/);
  assert.match(panel, /<col className="w-9" \/>\s*<col \/>\s*<col className="w-20" \/>\s*<col className="w-28" \/>/, "≈ 228 px of fixed columns; the name column takes the rest");
  assert.doesNotMatch(panel, /overflow-x|min-w-\[|w-\[|whitespace-nowrap|truncate|<Table\b/, "no wide, clipped or scrolling layout");
});

test("Course Progress (D2b-2D): current-state delivery (primary) and enrolment completion (secondary) per course from the one analytics response — evidence only, no status labels", () => {
  const view = strip(src(VIEW));
  const lib = strip(src(ANALYTICS));
  const panel = view.slice(view.indexOf("function NotAvailable("), view.indexOf("const TREND_ARROW ="));
  assert.ok(panel.includes("async function CourseProgressPanel("), "the panel is inside the D2b-2D section");
  assert.match(panel, /title="Course Progress" description="Current delivery and enrolment progress" action=\{\{ href: "\/admin\/courses", label: "View all courses" \}\}/, "exact title, current-state subtitle and the courses link");
  assert.match(panel, /const \{ panels \} = await analytics;/, "the shared analytics promise — no further call");
  assert.match(panel, /panels\.status === "error" \? \(\s*<AnalyticsUnavailable \/>/, "the existing unavailable state");
  assert.match(view, /<Suspense key=\{`progress-\$\{data\.period\.key\}`\} fallback=\{<PanelLoading id="dash-progress" title="Course Progress" \/>\}>\s*<CourseProgressPanel analytics=\{analytics\} \/>\s*<\/Suspense>\s*<Suspense key=\{`topics-/, "own keyed Suspense, in the Weak Topics row, right before Weak Topics");
  // rows from the read model (never the raw lists), one heading per course
  assert.match(panel, /\{panels\.data\.progress\.rows\.map\(\(r\) => \(\s*<CourseProgressItem key=\{r\.courseId\} row=\{r\} \/>/);
  assert.match(panel, /<h3 className="min-w-0 break-words text-sm font-medium text-ink">\{row\.course\}<\/h3>/);
  // primary: delivery % with the counts behind it; overdue; secondary: enrolment completion — all as text (the bar is decorative)
  assert.match(panel, /<span className="sr-only">Delivery progress: <\/span>\s*\{d \? d\.percentDisplay : <NotAvailable \/>\}/);
  assert.match(panel, /<div className="mt-1 h-1\.5 w-full overflow-hidden rounded-sm bg-surface-sunken" aria-hidden="true">/, "the bar is decorative; the % is text");
  assert.match(panel, /\{d && d\.percent !== null && \(/, "no bar without a planned class (no misleading 0 %)");
  assert.match(panel, /<dt className="inline text-ink-muted">Delivered: <\/dt>\s*<dd className="inline text-ink">\{d \? `\$\{d\.delivered\} \/ \$\{d\.planned\} classes` : <NotAvailable \/>\}<\/dd>/);
  assert.match(panel, /<dt className="inline text-ink-muted">Overdue: <\/dt>/);
  assert.match(panel, /<dt className="inline text-ink-muted">Enrolment completion: <\/dt>\s*<dd className="inline text-ink">\{e \? `\$\{e\.completed\} \/ \$\{e\.active\} · \$\{e\.percentDisplay\}` : <NotAvailable \/>\}<\/dd>/);
  assert.match(panel, /—<span className="sr-only"> not available<\/span>/, "a missing value is announced, not just a dash");
  // evidence only: no status labels or status colours
  assert.doesNotMatch(panel, /On Track|Delayed|At Risk|Badge|HEALTH_LABEL|BAND_TONE|signal-red|signal-amber|signal-green|Healthy|Watch|Attention/i);
  // empty state, subset notes, current-state note
  assert.match(panel, /panels\.data\.progress\.empty \? \(\s*<Compact title="No course progress yet"/);
  assert.match(panel, /\{panels\.data\.progress\.deliveryShownText && <p className="mt-3 text-2xs text-ink-faint">\{panels\.data\.progress\.deliveryShownText\}<\/p>\}/);
  assert.match(panel, /\{panels\.data\.progress\.enrolmentShownText && <p className="mt-1 text-2xs text-ink-faint">\{panels\.data\.progress\.enrolmentShownText\}<\/p>\}/);
  assert.match(panel, /Current state — not affected by the reporting period\./);
  // the read model: joined by course_id (never by position), percentages computed once from the counts, never re-sorted
  assert.match(lib, /const enrolmentById = new Map\(enrolment\.map\(\(e\) => \[e\.course_id, e\]\)\);/);
  assert.match(lib, /\.\.\.enrolment\.filter\(\(e\) => !deliveryIds\.has\(e\.course_id\)\)/, "enrolment-only courses are kept, not discarded");
  assert.match(lib, /const percent = progressPercent\(d\.delivered, d\.planned\);/);
  assert.match(lib, /const percent = progressPercent\(e\.completed, e\.active\);/);
  assert.doesNotMatch(lib.slice(lib.indexOf("export function courseProgress"), lib.indexOf("const hasAny")), /\.sort\(|\.reverse\(/, "authoritative order kept");
  assert.match(lib, /progress: courseProgress\(raw\.delivery, raw\.delivery_total, raw\.enrolment, raw\.enrolment_total\)/);
  // responsive (~400 px): wrapping course names, stacked figures on a phone, no fixed widths or horizontal scrolling
  assert.match(panel, /<dl className="mt-1\.5 grid grid-cols-1 gap-x-4 gap-y-0\.5 text-2xs sm:grid-cols-3">/);
  assert.doesNotMatch(panel, /overflow-x|min-w-\[|w-\[|whitespace-nowrap|truncate|<table|<Table\b/);
  // no per-course link
  assert.doesNotMatch(panel, /<Link|href=\{/);
});

test("attendance-definition note (D2b-2D): one page-level note, both definitions stated, neither calculation changed", () => {
  const view = strip(src(VIEW));
  const lib = strip(src(ANALYTICS));
  assert.match(lib, /export const ATTENDANCE_DEFINITION_NOTE =\s*"Attendance on this dashboard excludes excused absences; the Performance Tracker counts excused absences as attended\.";/);
  assert.match(view, /<p role="note" className="-mt-3 text-2xs text-ink-faint">\s*\{ATTENDANCE_DEFINITION_NOTE\}\s*<\/p>/);
  assert.equal((view.match(/\{ATTENDANCE_DEFINITION_NOTE\}/g) ?? []).length, 1);
  assert.match(view, /<TrainingHealthPanel analytics=\{analytics\} \/>\s*<\/Suspense>\s*<\/div>\s*<p role="note"/, "right after the Training performance / Training health row");
  // the definitions themselves are untouched: the Performance Tracker still documents excused as attended
  assert.match(src("src/types/performance.ts"), /Attendance:\s+\(present \+ late \+ excused\) \/ marked records × 100\./);
});
