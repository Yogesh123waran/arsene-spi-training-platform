// Super Admin dashboard (D1 / D2a / D2b-2A) — source-level tests for the page, the view and the data
// boundary: real data only (no mock imports), Super Admin service, session client only (no service role),
// no client-side database access, fixed error messages, accessible structure, no fake trends, no greeting
// or emoji, no private fields, links only to existing workflows. D2b-2A deliberately changes three earlier
// rules: the header now has a real period selector (server links), the performance summary and Weak Topics
// are period-based from dashboard_analytics (streamed in their own Suspense boundaries), and Training
// health shows six lines with an overall worst-line status.
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
  for (const id of ["dash-today", "dash-upcoming-classes", "dash-tests", "dash-overview", "dash-performance", "dash-health", "dash-topics", "dash-activity", "dash-actions", "dash-approvals"]) {
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
  for (const label of ["View all classes", "View all tests", "View all batches", "View detailed performance", "View all notifications", "View module performance", "Review all completions"]) {
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
  assert.doesNotMatch(view, /top 5|top performers|ranking|course-wise|batch-wise/i, "D2b-2B / 2C not built yet");
});

test("streaming and isolation: each analytics panel has its own Suspense boundary and a fixed unavailable state; current-state sections render without them", () => {
  const view = strip(src(VIEW));
  for (const [panel, key] of [["PerformancePanel", "performance"], ["TrainingHealthPanel", "health"], ["WeakTopicsPanel", "topics"]]) {
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
  const order = ["<Metrics", "<Attention", "<PerformancePanel", "<TrainingHealthPanel", "<Overview", "<WeakTopicsPanel", "<TodayClasses", "<UpcomingClasses", "<UpcomingTests", "<Activity", "<QuickActions", "<PendingApprovalsPanel"];
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
