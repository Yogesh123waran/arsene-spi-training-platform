/**
 * Bulk import — column headers of the structured template (Excel/CSV).
 * Pure. Headers are matched without case, spaces, underscores or
 * hyphens ("Question Text", "question_text", "QUESTION-TEXT").
 */
import { OPTION_LETTERS } from "@/types/question-import";

export type TemplateColumn =
  | "questionId"
  | "courseCode"
  | "moduleCode"
  | "questionType"
  | "questionText"
  | `option${(typeof OPTION_LETTERS)[number]}`
  | "correctAnswer"
  | "marks"
  | "explanation"
  | "status";

/** Template header text, in template order. */
export const TEMPLATE_HEADERS: ReadonlyArray<{ column: TemplateColumn; header: string }> = [
  { column: "questionId", header: "Question ID" },
  { column: "courseCode", header: "Course Code" },
  { column: "moduleCode", header: "Module Code" },
  { column: "questionType", header: "Question Type" },
  { column: "questionText", header: "Question Text" },
  ...OPTION_LETTERS.map((l) => ({ column: `option${l}` as TemplateColumn, header: `Option ${l}` })),
  { column: "correctAnswer", header: "Correct Answer" },
  { column: "marks", header: "Marks" },
  { column: "explanation", header: "Explanation" },
  { column: "status", header: "Status" },
];

const key = (text: string) => text.toLowerCase().replace(/[\s_\-]+/g, "");
const BY_KEY = new Map(TEMPLATE_HEADERS.map((h) => [key(h.header), h.column]));

export interface HeaderMap {
  /** Column name → index in the source row. */
  columns: Partial<Record<TemplateColumn, number>>;
  /** Blocking header problems. */
  errors: string[];
  /** Unknown headers (ignored). */
  ignored: string[];
}

/**
 * Map a header row. Required: Question Type, Question Text, Option A,
 * Option B, Correct Answer, Marks — and Course Code unless the course is
 * chosen in the import screen. A repeated header is an error.
 */
export function mapHeaders(headers: ReadonlyArray<unknown>, options: { courseChosenInUi?: boolean } = {}): HeaderMap {
  const columns: HeaderMap["columns"] = {};
  const errors: string[] = [];
  const ignored: string[] = [];
  headers.forEach((raw, index) => {
    const text = typeof raw === "string" ? raw.trim() : raw === null || raw === undefined ? "" : String(raw).trim();
    if (!text) return;
    const column = BY_KEY.get(key(text));
    if (!column) {
      ignored.push(text);
      return;
    }
    if (columns[column] !== undefined) {
      errors.push(`The column "${text}" appears more than once.`);
      return;
    }
    columns[column] = index;
  });
  const required: TemplateColumn[] = ["questionType", "questionText", "optionA", "optionB", "correctAnswer", "marks"];
  if (!options.courseChosenInUi) required.unshift("courseCode");
  const headerFor = (c: TemplateColumn) => TEMPLATE_HEADERS.find((h) => h.column === c)!.header;
  const missing = required.filter((c) => columns[c] === undefined).map(headerFor);
  if (missing.length > 0) errors.push(`Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
  return { columns, errors, ignored };
}
