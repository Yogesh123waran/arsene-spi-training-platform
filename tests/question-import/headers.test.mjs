import { test } from "node:test";
import assert from "node:assert/strict";
import { core } from "./helpers.mjs";

const { mapHeaders, TEMPLATE_HEADERS } = core;

test("template has the approved columns with Options A–J", () => {
  assert.deepEqual(TEMPLATE_HEADERS.map((h) => h.header), [
    "Question ID", "Course Code", "Module Code", "Question Type", "Question Text",
    "Option A", "Option B", "Option C", "Option D", "Option E", "Option F", "Option G", "Option H", "Option I", "Option J",
    "Correct Answer", "Marks", "Explanation", "Status",
  ]);
});
test("full template header row maps every column by position", () => {
  const map = mapHeaders(TEMPLATE_HEADERS.map((h) => h.header));
  assert.deepEqual(map.errors, []);
  assert.equal(map.columns.questionText, 4);
  assert.equal(map.columns.optionJ, 14);
  assert.equal(map.columns.status, 18);
});
test("headers matched without case, spaces, underscores or hyphens; any order", () => {
  const map = mapHeaders(["MARKS", "question_text", "Correct-Answer", "course code", "OPTION A", "option_b", "Question Type"]);
  assert.deepEqual(map.errors, []);
  assert.equal(map.columns.marks, 0);
  assert.equal(map.columns.optionB, 5);
});
test("missing required columns reported by name", () => {
  const map = mapHeaders(["Course Code", "Question Text", "Option A"]);
  assert.equal(map.errors.length, 1);
  assert.match(map.errors[0], /Question Type, Option B, Correct Answer, Marks/);
});
test("Course Code is optional when the course is chosen in the import screen", () => {
  const cols = ["Question Type", "Question Text", "Option A", "Option B", "Correct Answer", "Marks"];
  assert.match(mapHeaders(cols).errors[0], /Course Code/);
  assert.deepEqual(mapHeaders(cols, { courseChosenInUi: true }).errors, []);
});
test("repeated column is an error; unknown columns are ignored and listed", () => {
  const map = mapHeaders(["Course Code", "Question Type", "Question Text", "Option A", "Option B", "Correct Answer", "Marks", "marks", "Difficulty", ""]);
  assert.equal(map.errors.length, 1);
  assert.match(map.errors[0], /appears more than once/);
  assert.deepEqual(map.ignored, ["Difficulty"]);
});
