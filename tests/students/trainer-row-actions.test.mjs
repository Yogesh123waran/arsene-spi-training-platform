// Phase 7 P3.10-C — trainer students row actions (source-level). Trainers have no remove / deactivate / delete
// authority, so the trainer menu never offers Remove; the Super Admin Students menu is unchanged; the trainer
// Edit action (P3.10-B) is untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const strip = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const TABLE = "src/components/modules/StudentsTable.tsx";

test("trainer menu: Remove is rendered only when the table is NOT in trainer mode; no other remove/deactivate/delete action exists", () => {
  const table = strip(src(TABLE));
  assert.match(
    table,
    /\{!trainerEdit && \(\s*<DropdownItem onClick=\{\(\) => notImplemented\("Remove student"\)\} className="text-signal-red">\s*<Trash2 className="h-3\.5 w-3\.5" \/> Remove\s*<\/DropdownItem>\s*\)\}/,
    "Remove only outside trainer mode"
  );
  assert.equal((table.match(/notImplemented\("Remove student"\)/g) ?? []).length, 1, "a single Remove, behind the guard");
  assert.doesNotMatch(table, /Deactivate|Suspend|Delete|setAccountStatus|deleteUser/i, "no deactivate / delete action in the table");
  assert.match(src("src/app/trainer/students/page.tsx"), /<StudentsTable rows=\{students\} trainerEdit \/>/, "the trainer page renders trainer mode");
});

test("Super Admin Students menu unchanged: View profile, Edit and Remove placeholders still render there", () => {
  const table = strip(src(TABLE));
  assert.match(src("src/app/admin/students/page.tsx"), /<StudentsTable\b/);
  assert.doesNotMatch(src("src/app/admin/students/page.tsx"), /trainerEdit/, "the admin page never enables trainer mode");
  assert.match(table, /<DropdownItem onClick=\{\(\) => notImplemented\("View profile"\)\}>/, "View profile unchanged (both views)");
  assert.match(table, /\{!trainerEdit \? \(\s*<DropdownItem onClick=\{\(\) => notImplemented\("Edit student"\)\}>/, "admin Edit unchanged");
  assert.match(table, /trainerEdit = false/, "trainer mode is off by default — admin rendering is the default");
});

test("trainer Edit (P3.10-B) untouched: still only on editable rows, still opens the trainer dialog", () => {
  const table = strip(src(TABLE));
  assert.match(table, /\) : s\.editable === true \? \(\s*<DropdownItem onClick=\{\(\) => setEditTarget\(\{ id: s\.id, name: s\.name \}\)\}>/);
  assert.match(table, /\{trainerEdit && <TrainerEditStudentDialog student=\{editTarget\} onClose=\{\(\) => setEditTarget\(null\)\} \/>\}/);
});
