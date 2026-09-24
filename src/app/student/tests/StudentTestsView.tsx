"use client";

import { useState } from "react";
import { FileQuestion, Clock, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TestCardData } from "@/lib/mock/tests.mock";
import { mockExam } from "@/lib/mock/tests.mock";
import { TestRunner } from "./TestRunner";

export function StudentTestsView({ tests }: { tests: TestCardData[] }) {
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  if (activeTestId) {
    return <TestRunner exam={mockExam} onExit={() => setActiveTestId(null)} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tests.map((t) => {
        const canStart = t.status === "active";
        return (
          <Card key={t.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{t.title}</h3>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-xs text-ink-muted">{t.course}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <FileQuestion className="h-3.5 w-3.5" /> {t.questions} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {t.durationMinutes} min
                </span>
              </div>
              <Button
                size="sm"
                className="mt-1 w-full"
                disabled={!canStart}
                onClick={() => canStart && setActiveTestId(t.id)}
              >
                <PlayCircle className="h-4 w-4" />
                {canStart ? "Start Test" : t.status === "scheduled" ? "Not yet available" : "Closed"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
