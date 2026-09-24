"use client";

import { useMemo, useState } from "react";
import { Search, FileQuestion, Clock, Users2, MoreHorizontal, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { TestCardData } from "@/lib/mock/tests.mock";

export function TestsGrid({ tests }: { tests: TestCardData[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      const matchesQuery = query.trim() === "" || t.title.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || t.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [tests, query, status]);

  function notImplemented(action: string) {
    showToast({ variant: "info", title: `${action} isn't wired up yet`, description: "This UI pass is presentation-only." });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Search tests…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-44"
          options={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Scheduled", value: "scheduled" },
            { label: "Draft", value: "draft" },
            { label: "Closed", value: "closed" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tests match your search" description="Try a different title or status filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
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
                  <span className="flex items-center gap-1">
                    <Users2 className="h-3.5 w-3.5" /> {t.attempts} Attempts
                  </span>
                </div>
              </CardContent>
              <div className="flex items-center justify-end border-t border-surface-border px-5 py-2.5">
                <Dropdown
                  align="right"
                  trigger={
                    <button aria-label={`Actions for ${t.title}`} className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  }
                >
                  <DropdownItem onClick={() => notImplemented("View test")}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </DropdownItem>
                  <DropdownItem onClick={() => notImplemented("Edit test")}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </DropdownItem>
                </Dropdown>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
