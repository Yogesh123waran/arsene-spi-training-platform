"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/utils/cn";
import type { MockExamData } from "@/lib/mock/tests.mock";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TestRunner({ exam, onExit }: { exam: MockExamData; onExit: () => void }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const question = exam.questions[current];
  const total = exam.questions.length;
  const score = useMemo(
    () => exam.questions.filter((q) => answers[q.id] === q.correctOptionId).length,
    [answers, exam.questions]
  );

  if (submitted) {
    const percentage = Math.round((score / total) * 100);
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-semibold text-ink">Test submitted</h2>
          <p className="text-sm text-ink-muted">{exam.testTitle}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {score}/{total} <span className="text-base font-normal text-ink-muted">({percentage}%)</span>
          </p>
          <Button className="mt-4" onClick={onExit}>
            Back to tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!question) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={onExit} className="mb-1 flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <ChevronLeft className="h-3.5 w-3.5" /> {exam.courseLabel}
          </button>
          <h1 className="text-sm font-semibold text-ink">{exam.testTitle}</h1>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-medium",
            secondsLeft < 60 ? "border-signal-red/30 bg-signal-redSoft text-signal-red" : "border-surface-border bg-surface-raised text-ink"
          )}
        >
          <Clock className="h-4 w-4" /> {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
        <Card>
          <CardContent className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
                <span>
                  Question {current + 1} of {total}
                </span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <ProgressBar value={current + 1} max={total} tone="teal" />
            </div>

            <p className="text-sm font-medium text-ink">{question.prompt}</p>

            <div className="flex flex-col gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-surface-border bg-surface-raised text-ink hover:border-primary-300"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        selected ? "border-primary-500" : "border-surface-border"
                      )}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                    </span>
                    {option.text}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-surface-border pt-4">
              <Button variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {current === total - 1 ? (
                <Button onClick={() => setSubmitted(true)}>Submit</Button>
              ) : (
                <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
              {exam.questions.map((q, i) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = i === current;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium",
                      isCurrent
                        ? "border-primary-500 bg-primary-500 text-white"
                        : isAnswered
                          ? "border-primary-200 bg-primary-50 text-primary-700"
                          : "border-surface-border text-ink-muted hover:border-primary-300"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-1.5 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-500" /> Current
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-50 ring-1 ring-primary-200" /> Answered
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-surface-border" /> Not answered
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
