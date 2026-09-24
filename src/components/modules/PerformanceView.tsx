import { Gauge, Percent, ClipboardCheck, FileCheck2, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ChartContainer } from "@/components/ui/ChartContainer";
import { LineChart } from "@/components/ui/charts";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { SummaryStat } from "@/components/dashboard/SummaryStat";
import { performanceTrend } from "@/lib/mock/dashboard.mock";
import {
  performanceSummary,
  topicPerformance,
  strongTopics,
  weakTopics,
  recommendedImprovements,
} from "@/lib/mock/performance.mock";

/** Shared analytics body for /admin, /trainer and /student Performance pages — same visual language, each page supplies its own PageHeader copy. */
export function PerformanceView() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Overall Performance" value={`${performanceSummary.overall}%`} icon={Gauge} tone="green" />
        <SummaryStat label="Average Score" value={`${performanceSummary.averageScore}%`} icon={Percent} tone="gold" />
        <SummaryStat label="Attendance" value={`${performanceSummary.attendance}%`} icon={ClipboardCheck} tone="blue" />
        <SummaryStat label="Tests Completed" value={String(performanceSummary.testsCompleted)} icon={FileCheck2} tone="green" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartContainer title="Performance Trend" description="Average score across all active batches" className="lg:col-span-2">
          <LineChart data={performanceTrend} color="#0E6B3E" max={100} />
          <div className="mt-2 flex justify-between text-2xs text-ink-faint">
            {performanceTrend.map((p) => (
              <span key={p.label}>Wk {p.label}</span>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer title="Topic Performance" description="Average score by topic">
          <div className="flex flex-col gap-3">
            {topicPerformance.map((t) => (
              <ProgressBar
                key={t.topic}
                value={t.score}
                label={t.topic}
                tone={t.score >= 80 ? "teal" : t.score >= 65 ? "amber" : "red"}
              />
            ))}
          </div>
        </ChartContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle2 className="h-4 w-4 text-signal-green" /> Strong Topics
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {strongTopics.map((t) => (
                <Badge key={t} tone="green">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <AlertTriangle className="h-4 w-4 text-signal-red" /> Weak Topics
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {weakTopics.map((t) => (
                <Badge key={t} tone="red">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Lightbulb className="h-4 w-4 text-brand-gold" /> Recommended Improvement
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-ink-muted">
              {recommendedImprovements.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
