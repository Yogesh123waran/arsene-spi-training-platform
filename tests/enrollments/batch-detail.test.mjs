// Phase 7 P3.8 slice 2 — admin batch detail, READ ONLY (source-level tests).
// The page validates the id, reads only through enrollmentService, 404s on missing/out-of-scope
// batches and never shows raw errors; the view is a server component with no mutation controls and
// no contact data; "View" in the Super Admin batches table opens the detail, the trainer view does not.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const strip = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const importsOf = (code) => [...code.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

const PAGE = "src/app/admin/batches/[batchId]/page.tsx";
const VIEW = "src/components/modules/BatchDetailView.tsx";
const TABLE = "src/components/modules/BatchesTable.tsx";

test("page: dynamic, validates the id first, reads only through enrollmentService, 404 for missing/out-of-scope, generic error otherwise", () => {
  const page = strip(src(PAGE));
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.ok(page.indexOf("if (!isUuid(params.batchId)) notFound();") > -1, "invalid id → 404");
  assert.ok(page.indexOf("isUuid(params.batchId)") < page.indexOf("enrollmentService.getBatchDetail"), "validated before any read");
  assert.match(page, /if \(!detail\) notFound\(\);/);
  assert.match(page, /console\.error\("\[admin\/batches\/detail\] load failed:", err instanceof Error \? err\.name : "unknown error"\)/, "logs the error name only");
  assert.match(page, /<ErrorState title="We couldn't load this batch" description="Please try again\." \/>/, "fixed message, never the raw error");
  for (const spec of importsOf(page)) {
    assert.ok(
      ["next/navigation", "@/components/layout/PageHeader", "@/components/ui/ErrorState", "@/components/modules/BatchDetailView", "@/services/enrollment.service", "@/lib/enrollments/enrollment"].includes(spec),
      `page imports ${spec}`
    );
  }
  assert.doesNotMatch(page, /\.from\(|\.rpc\(|createSupabase|enrollment\.actions/, "no direct database access and no mutations");
});

test("view: a server component with no mutation code of its own (slice 3A: it only renders EnrollStudentDialog), no contact data", () => {
  const raw = src(VIEW);
  const view = strip(raw);
  assert.doesNotMatch(raw, /^["']use client["'];/, "server component");
  for (const spec of importsOf(view)) {
    assert.ok(
      ["next/link", "lucide-react", "@/components/layout/PageHeader", "@/utils/format", "@/lib/enrollments/enrollment", "@/components/modules/EnrollStudentDialog", "@/components/modules/EnrollmentStatusDialog"].includes(spec) ||
        spec.startsWith("@/components/ui/"),
      `view imports ${spec}`
    );
  }
  // The view itself never mutates: no actions, handlers, buttons, forms or dialogs of its own.
  assert.doesNotMatch(view, /enrollment\.actions|onClick|<button|<form|<Button|<Modal|setEnrollment|trainerEnrol|\.from\(|\.rpc\(/i, "no mutation code in the view");
  // Slice 3A: the only mutation entry point, Super Admin + current batch only, with name/code-only candidates.
  assert.match(view, /\{detail\.mode === "admin" && detail\.canEnrol && \(\s*<EnrollStudentDialog/);
  assert.match(view, /candidates=\{detail\.candidates\.map\(\(c\) => \(\{ id: c\.id, code: c\.code, name: c\.name \}\)\)\}/);
  assert.equal((view.match(/<EnrollStudentDialog/g) ?? []).length, 1);
  // Slice 3B: per-row status changes, Super Admin only, driven by the row's server-computed actions.
  assert.match(view, /const isAdmin = detail\.mode === "admin";/);
  assert.match(view, /\{isAdmin && \(\s*<TableCell className="text-right">\s*<EnrollmentStatusDialog/);
  assert.equal((view.match(/<EnrollmentStatusDialog/g) ?? []).length, 1);
  assert.match(view, /actions: r\.actions,/, "the row's actions, not transition logic in the view");
  assert.doesNotMatch(view, /email|phone|organization|designation/i, "no contact or profile data");
  for (const label of ["Course", "Trainer", "Status", "Start date", "End date", "Seats", "Students", "Enrolment history", "Enrolled", "Completed", "Reason"]) {
    assert.ok(view.includes(label), `shows ${label}`);
  }
  assert.match(view, /\{seatsUsed\} \/ \{batch\.maxSeats\} used/);
  assert.match(view, /<StatusBadge status=\{r\.enrollmentStatus\} \/>/, "every enrolment status shown (withdrawn included for the Super Admin)");
});

test("View: the Super Admin batches table opens /admin/batches/<id>; the trainer table keeps the placeholder; Edit is unchanged", () => {
  const table = strip(src(TABLE));
  assert.match(table, /const detailBasePath = assignment \? "\/admin\/batches" : null;/, "only the Super Admin view (the only one given `assignment`)");
  assert.match(table, /detailBasePath \? router\.push\(`\$\{detailBasePath\}\/\$\{encodeURIComponent\(b\.id\)\}`\) : notImplemented\("View batch"\)/);
  assert.match(table, /notImplemented\("Edit batch"\)/, "Edit stays out of scope");
  assert.doesNotMatch(src("src/app/trainer/batches/page.tsx"), /assignment=/, "the trainer page passes no assignment → no detail link yet");
  assert.doesNotMatch(table, /enrollment\.actions|setEnrollment|trainerEnrol/, "no enrolment mutations from the table");
});
