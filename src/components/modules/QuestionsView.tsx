"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal, Eye, Pencil, Trash2, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { QuestionTableRow } from "@/lib/mock/questions-table.mock";

const difficultyTone: Record<QuestionTableRow["difficulty"], "green" | "amber" | "red"> = {
  easy: "green",
  medium: "amber",
  hard: "red",
};

const typeLabel: Record<QuestionTableRow["type"], string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  short_answer: "Short answer",
};

export interface QuestionsViewProps {
  questions: QuestionTableRow[];
  canManage?: boolean;
}

export function QuestionsView({ questions, canManage = true }: QuestionsViewProps) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchesQuery = query.trim() === "" || q.prompt.toLowerCase().includes(query.toLowerCase());
      const matchesDifficulty = difficulty === "all" || q.difficulty === difficulty;
      return matchesQuery && matchesDifficulty;
    });
  }, [questions, query, difficulty]);

  function notImplemented(action: string) {
    showToast({ variant: "info", title: `${action} isn't wired up yet`, description: "This UI pass is presentation-only." });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search questions…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="sm:w-44"
          options={[
            { label: "All difficulties", value: "all" },
            { label: "Easy", value: "easy" },
            { label: "Medium", value: "medium" },
            { label: "Hard", value: "hard" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No questions match your search" description="Try a different keyword or difficulty filter." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Question</TableHeaderCell>
              <TableHeaderCell>Course</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Difficulty</TableHeaderCell>
              <TableHeaderCell>Marks</TableHeaderCell>
              {canManage && <TableHeaderCell className="text-right">Actions</TableHeaderCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="max-w-sm">
                  <p className="truncate font-medium text-ink">{q.prompt}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {q.tags.map((t) => (
                      <Badge key={t} tone="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{q.course}</TableCell>
                <TableCell>{typeLabel[q.type]}</TableCell>
                <TableCell>
                  <Badge tone={difficultyTone[q.difficulty]}>{q.difficulty}</Badge>
                </TableCell>
                <TableCell>{q.marks}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Dropdown
                      align="right"
                      trigger={
                        <button aria-label="Question actions" className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                    >
                      <DropdownItem onClick={() => notImplemented("View question")}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </DropdownItem>
                      <DropdownItem onClick={() => notImplemented("Edit question")}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </DropdownItem>
                      <DropdownItem onClick={() => notImplemented("Delete question")} className="text-signal-red">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
