// P5.0 — Reports and Settings show no mock data and no controls that do nothing (source-level).
// Reports: no sample report list, invented "last generated" dates, fake course/batch filters or dead Export
// buttons — an honest "not available yet" state that links to existing live pages. Settings: no invented users,
// no fields or save buttons without storage — a link to the real Users page and honest copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const strip = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const ADMIN_REPORTS = "src/app/admin/reports/page.tsx";
const TRAINER_REPORTS = "src/app/trainer/reports/page.tsx";
const UNAVAILABLE = "src/components/modules/ReportsUnavailable.tsx";
const SETTINGS = "src/app/admin/settings/page.tsx";

test("reports: both portals render the honest unavailable state — no mock definitions, dates, filters or export buttons", () => {
  assert.match(strip(src(ADMIN_REPORTS)), /<ReportsUnavailable portal="admin" \/>/);
  assert.match(strip(src(TRAINER_REPORTS)), /<ReportsUnavailable portal="trainer" \/>/);
  for (const rel of [ADMIN_REPORTS, TRAINER_REPORTS, UNAVAILABLE]) {
    const code = strip(src(rel));
    assert.doesNotMatch(code, /lib\/mock|reportDefinitions|ReportsGrid|lastGenerated|Last generated/, `${rel}: no mock report data`);
    assert.doesNotMatch(code, /<Select|<Button|onClick|showToast|Export\b|isn't wired up|presentation-only/, `${rel}: no fake filters or dead actions`);
    assert.doesNotMatch(code, /Instrumentation Basics|Control Systems|Batch A|Batch B/, `${rel}: no invented courses or batches`);
  }
  assert.ok(!exists("src/components/modules/ReportsGrid.tsx"), "the mock grid is removed");
  assert.ok(!exists("src/lib/mock/reports.mock.ts"), "the mock report definitions are removed");
});

test("reports: the unavailable state says so plainly and links only to existing live pages of the same portal", () => {
  const code = strip(src(UNAVAILABLE));
  assert.match(code, /title="Downloadable reports aren't available yet"/);
  const hrefs = [...code.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ["/admin/performance", "/admin/attendance", "/admin/tests", "/trainer/performance", "/trainer/attendance", "/trainer/tests"]);
  for (const href of hrefs) assert.ok(exists(`src/app${href}/page.tsx`), `${href} is an existing route`);
  assert.doesNotMatch(code, /"use client"/, "a server component: no client behaviour to fake");
});

test("settings: no invented users, no editable fields or save buttons without storage; Users link and honest copy", () => {
  const code = strip(src(SETTINGS));
  assert.ok(!exists("src/app/admin/settings/SettingsTabs.tsx"), "the mock settings tabs are removed");
  assert.doesNotMatch(code, /usersMock|Rajesh Kumar|Arun Kumar|Admin User|@spi-training\.local/, "no invented user records");
  assert.doesNotMatch(code, /<Input|<Select|<Button|type="checkbox"|type="password"|onClick|showToast|Save changes|Update password|Edit permissions/, "no controls that save nothing");
  assert.doesNotMatch(code, /"use client"|lib\/mock|siteConfig/, "no placeholder company values presented as settings");
  assert.match(code, /href="\/admin\/users"/, "links to the real Users page");
  assert.ok(exists("src/app/admin/users/page.tsx"));
  assert.match(code, /can&apos;t be changed here\s+yet\./, "says what isn't available");
  assert.match(code, /Forgot your\s+password\?/, "points to the existing password reset flow without changing it");
  assert.ok(exists("src/app/forgot-password/page.tsx") || exists("src/app/(auth)/forgot-password/page.tsx"), "that flow exists");
});

test("navigation is unchanged: Reports and Settings stay where they were", () => {
  const nav = src("src/config/navigation.ts");
  assert.match(nav, /\{ label: "Reports", href: "\/admin\/reports"/);
  assert.match(nav, /\{ label: "Settings", href: "\/admin\/settings"/);
  assert.match(nav, /\{ label: "Reports", href: "\/trainer\/reports"/);
});
