"use client";

import { Download, Users, ClipboardCheck, BookOpen, Layers, UserCog, FileCheck2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/format";
import type { ReportDefinition, ReportIconKey } from "@/lib/mock/reports.mock";

// Resolved here, client-side, from the serializable `iconKey` string
// on each report — a component reference can't be passed as a prop
// from the Server Component page into this Client Component (see the
// note in reports.mock.ts).
const REPORT_ICONS: Record<ReportIconKey, LucideIcon> = {
  students: Users,
  attendance: ClipboardCheck,
  course: BookOpen,
  batch: Layers,
  trainer: UserCog,
  tests: FileCheck2,
};

export function ReportsGrid({ reports }: { reports: ReportDefinition[] }) {
  const { showToast } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          className="sm:w-44"
          defaultValue="all"
          options={[
            { label: "All courses", value: "all" },
            { label: "Instrumentation Basics", value: "instrumentation-basics" },
            { label: "Control Systems", value: "control-systems" },
          ]}
        />
        <Select
          className="sm:w-44"
          defaultValue="all"
          options={[
            { label: "All batches", value: "all" },
            { label: "Batch A", value: "batch-a" },
            { label: "Batch B", value: "batch-b" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => {
          const Icon = REPORT_ICONS[r.iconKey];
          return (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted">{r.description}</p>
                </div>
                <p className="text-2xs text-ink-faint">Last generated {formatDate(r.lastGenerated)}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-1 w-full"
                  onClick={() =>
                    showToast({ variant: "info", title: "Export isn't wired up yet", description: "This UI pass is presentation-only." })
                  }
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
