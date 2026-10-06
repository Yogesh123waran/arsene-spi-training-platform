// Super Admin dashboard (D1) — source-level tests for the page, the view and the data boundary:
// real data only (no mock imports), Super Admin service, session client only (no service role),
// no client-side database access, fixed error messages, accessible structure, no fake trends,
// no greeting/emoji, no private fields, links only to existing workflows.
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
const LIB = "src/lib/dashboard/admin-dashboard.ts";
const REPO_CORE = "src/repositories/dashboard.repository.core.ts";
const REPO = "src/repositories/dashboard.repository.ts";
const SVC_CORE = "src/services/dashboard.service.core.ts";
const SVC = "src/services/dashboard.service.ts";
const DASHBOARD_FILES = [PAGE, VIEW, LIB, REPO_CORE, REPO, SVC_CORE, SVC];

test("page: dynamic, reads only through the Super Admin dashboard service, own Suspense skeleton, fixed error message", () => {
  const page = strip(src(PAGE));
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /await adminDashboardService\.getDashboard\(\)/);
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
  const raw = src(VIEW);
  assert.doesNotMatch(raw, /^["']use client["'];/, "server component");
  for (const spec of importsOf(raw)) {
    assert.ok(
      ["next/link", "react", "lucide-react", "@/components/layout/PageHeader", "@/utils/format", "@/lib/dashboard/admin-dashboard", "@/lib/dashboard/periods"].includes(spec) ||
        spec.startsWith("@/components/ui/"),
      `view imports ${spec}`
    );
  }
  const view = strip(raw);
  assert.doesNotMatch(view, /lib\/mock|dashboard\.mock|@\/services|@\/repositories|supabase|\.from\(\s*["'`]|\.rpc\(/i, "(Array.from in the skeleton is not a table read)");
  assert.doesNotMatch(view, /onClick|<form|formAction|useState|useEffect|"use server"/, "no mutations or client behaviour (Panel's action={{ href, label }} is a link)");
});

test("view: no greeting, emoji, fake trends, hard-coded colours or private fields", () => {
  const view = strip(src(VIEW));
  assert.doesNotMatch(view, /Good (morning|afternoon|evening)|welcomeName/i);
  assert.doesNotMatch(view, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "no emoji");
  assert.doesNotMatch(view, /KpiCard|TrendingUp|TrendingDown|trendLabel|vs last month/i, "no invented trend widgets");
  // D2a: arrows only inside ComparisonLine, which renders a real Comparison — and only for the two KPIs with history (Q5).
  const arrows = [...view.matchAll(/\bArrow(Up|Down)\b/g)].map((m) => m.index);
  const line = view.indexOf("function ComparisonLine");
  const lineEnd = view.indexOf("function Metrics(");
  assert.ok(arrows.length > 0 && arrows.every((i) => i < 400 || (i > line && i < lineEnd)), "arrows only in the import and ComparisonLine");
  assert.match(view, /const cmp = m\.key === "classesToday" \|\| m\.key === "completionsAwaitingApproval" \? section\.data\.comparisons\[m\.key\] : null;/);
  assert.match(view, /function ComparisonLine\(\{ cmp \}: \{ cmp: Comparison \}\)/);
  assert.match(view, /cmp\.percent !== null && cmp\.direction !== "same"/, "a percentage only when there is a baseline");
  assert.doesNotMatch(view, /#[0-9a-fA-F]{6}\b/, "theme tokens only");
  assert.doesNotMatch(view, /email|phone|account_?status|accountStatus|organization|designation/i);
  assert.doesNotMatch(view, /at-risk|at risk|needs follow-up/i, "no D3 content");
});

test("accessibility: one h1 (PageHeader), each section an h2 inside a labelled region, chart has a caption and a text alternative", () => {
  const view = strip(src(VIEW));
  assert.doesNotMatch(view, /<h1/, "the only h1 comes from PageHeader");
  assert.equal((view.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(view, /<section aria-labelledby=\{id\}/);
  assert.match(view, /<h2 id=\{id\} className=/);
  for (const id of ["dash-metrics", "dash-attention"]) assert.match(view, new RegExp(`<h2 id="${id}"`), id);
  for (const id of ["dash-today", "dash-upcoming-classes", "dash-tests", "dash-overview", "dash-performance", "dash-health", "dash-topics", "dash-activity", "dash-actions", "dash-approvals"]) {
    assert.match(view, new RegExp(`id="${id}"`), id);
  }
  assert.match(view, /<figure aria-labelledby="dash-trend-caption">/);
  assert.match(view, /<div aria-hidden="true" className="mt-2">\s*<LineChart/, "the SVG is decorative…");
  assert.match(view, /<ol className="sr-only">/, "…and the values are listed for screen readers");
  assert.match(view, /aria-busy="true"/, "skeleton announces loading");
  assert.match(view, /\{t\.state === "open" \? "Open" : "Scheduled"\}/, "status as text, not colour alone");
  assert.match(view, />\s*Unread\s*</);
  for (const label of ["View all classes", "View all tests", "View all batches", "View performance", "View all notifications", "View module performance", "Review all completions"]) {
    assert.ok(view.includes(label), label);
  }
  assert.match(view, /<Badge tone=\{BAND_TONE\[t\.band\]\}>\{BAND_LABEL\[t\.band\]\}<\/Badge>/, "topic band as text, not only the bar colour");
  assert.match(view, /<TableHeaderCell>Batch<\/TableHeaderCell>/, "pending approvals is a semantic table");
  assert.match(view, /<span className="sr-only">Action<\/span>/);
  assert.match(view, /Review \{b\.batchName\}/, "descriptive per-row link");
});

test("header: the approved title and subtitle; the date is a read-only India date (no period control that does nothing); no invented comparisons", () => {
  const view = strip(src(VIEW));
  assert.match(view, /export const DASHBOARD_TITLE = "Training Intelligence & Operations";/);
  assert.match(view, /export const DASHBOARD_SUBTITLE = "Track performance, manage operations, and ensure successful training outcomes\.";/);
  assert.match(view, /<PageHeader\s+title=\{DASHBOARD_TITLE\}\s+description=\{DASHBOARD_SUBTITLE\}/);
  assert.match(view, /<time dateTime=\{data\.today\}/);
  assert.doesNotMatch(view, /<select|<Select|PERIOD_|periodRange|searchParams|last month|month-over|week-over/i, "no period selector until period-aware widgets exist (D2b)");
  assert.match(view, /<Badge tone=\{HEALTH_TONE\[h\.status\]\}>\{HEALTH_LABEL\[h\.status\]\}<\/Badge>/, "health status as text");
  assert.match(view, /<p className="mt-1 text-xs text-ink-muted">\{h\.reason\}<\/p>/, "every status shows its reason");
  assert.doesNotMatch(view, /On track|ON TRACK|overall/i, "no overall health badge until every line is calculated (Q2.7)");
  assert.doesNotMatch(view, /top 5|top performers|ranking|health score|course-wise|batch-wise/i, "not built from invented data");
  assert.match(strip(src(PAGE)), /<PageHeader title=\{DASHBOARD_TITLE\} \/>/, "the page-level error keeps the title");
});

test("sections: empty and error states; attention hidden when nothing needs attention; responsive grids", () => {
  const view = strip(src(VIEW));
  assert.match(view, /if \(section\.status === "ok" && section\.data\.length === 0\) return null;/);
  assert.match(view, /title="This section couldn't be loaded"/);
  for (const t of ["No classes today", "No upcoming classes", "No upcoming tests", "No recent activity"]) assert.ok(view.includes(t), t);
  assert.match(view, /grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6/, "2 / 3 / 4 / 6 metrics per row");
  assert.match(view, /grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3/, "1 / 2 / 3 content columns");
  const order = ["<Metrics", "<Attention", "<Performance ", "<TrainingHealth", "<Overview", "<WeakTopics", "<TodayClasses", "<UpcomingClasses", "<UpcomingTests", "<Activity", "<QuickActions", "<PendingApprovalsPanel"];
  const positions = order.map((s) => view.lastIndexOf(s));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, "attention right after the metrics; reading order matches the layout");
});

test("quick actions and links: only existing /admin routes, no new mutation workflows", () => {
  const view = strip(src(VIEW)) + strip(src(LIB));
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

test("boundary: session client only — no service role, no admin client, no Auth Admin, no writes or database functions in any dashboard file", () => {
  for (const rel of DASHBOARD_FILES) {
    const code = strip(src(rel));
    assert.doesNotMatch(code, /supabase\/admin|createSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY|service_role|auth\.admin|auth-admin/i, rel);
    assert.doesNotMatch(code, /\.(insert|update|upsert|delete)\(|\.rpc\(/, `${rel}: reads only`);
  }
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
});

test("the old mock dashboard is gone from the Super Admin page; the shared KpiCard and portal dashboards are untouched by D1", () => {
  assert.doesNotMatch(src(PAGE) + src(VIEW), /dashboard\.mock|adminKpis|recentTestResults|recentActivity|courseProgressSegments/);
  assert.match(src("src/components/dashboard/KpiCard.tsx"), /trend: number|trend,/i, "KpiCard keeps its existing contract for the trainer/student portals");
  assert.match(src("src/components/layout/PortalDashboard.tsx"), /KpiDatum/);
});
