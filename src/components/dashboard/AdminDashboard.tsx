import Link from "next/link";
import {
  Users,
  UserCog,
  BookOpen,
  Layers,
  ClipboardCheck,
  FileCheck2,
  LineChart as LineChartIcon,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { ChartContainer } from "@/components/ui/ChartContainer";
import { LineChart, BarChart, DonutChart } from "@/components/ui/charts";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "./KpiCard";
import { ActivityIcon } from "./ActivityIcon";
import {
  adminKpisPrimary,
  adminKpisSecondary,
  performanceTrend,
  attendanceTrend,
  courseProgressSegments,
  upcomingClasses,
  recentTestResults,
  recentActivity,
} from "@/lib/mock/dashboard.mock";
import { formatDate } from "@/utils/format";

const primaryIcons = [Users, UserCog, BookOpen, Layers];
const secondaryIcons = [ClipboardCheck, FileCheck2, LineChartIcon, Award];

export interface AdminDashboardProps {
  welcomeName: string;
}

export function AdminDashboard({ welcomeName }: AdminDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good morning, ${welcomeName}! 👋`}
        description="Here's what's happening with your SPI Training Platform today."
        actions={
          <span className="hidden rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-sm text-ink-muted sm:inline-block">
            {formatDate(new Date(), { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {adminKpisPrimary.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} icon={primaryIcons[i]!} tone="green" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {adminKpisSecondary.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} icon={secondaryIcons[i]!} tone="gold" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartContainer title="Student Performance Trend" description="Average score across all active batches">
          <LineChart data={performanceTrend} color="#0E6B3E" max={100} />
          <div className="mt-2 flex justify-between text-2xs text-ink-faint">
            {performanceTrend.map((p) => (
              <span key={p.label}>Wk {p.label}</span>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer title="Attendance Trend" description="Present vs absent, this week">
          <BarChart data={attendanceTrend} presentColor="#0E6B3E" absentColor="#F2B705" />
          <div className="mt-2 flex items-center gap-4 text-2xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-gold" /> Absent
            </span>
          </div>
        </ChartContainer>

        <ChartContainer title="Course Progress" description="Across all enrolled students">
          <DonutChart segments={courseProgressSegments} centerValue="68%" centerLabel="Completed" />
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Upcoming Classes</h3>
            <Link href="/admin/classes" className="text-xs font-medium text-signal-blue hover:underline">
              View all
            </Link>
          </div>
          <CardContent className="flex flex-col gap-4">
            {upcomingClasses.map((c) => (
              <div key={`${c.date}-${c.time}`} className="flex items-start gap-3">
                <span
                  className={
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                    (c.mode === "lab" ? "bg-brand-gold" : c.mode === "online" ? "bg-signal-blue" : "bg-primary-500")
                  }
                />
                <div className="min-w-0">
                  <p className="text-xs text-ink-faint">
                    {c.date} · {c.time}
                  </p>
                  <p className="truncate text-sm font-medium text-ink">{c.className}</p>
                  <p className="text-xs text-ink-muted">{c.batch}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Recent Test Results</h3>
            <Link href="/admin/tests" className="text-xs font-medium text-signal-blue hover:underline">
              View all
            </Link>
          </div>
          <CardContent className="flex flex-col gap-3 p-0 py-2">
            {recentTestResults.map((r) => (
              <div
                key={`${r.student}-${r.test}`}
                className="flex items-center justify-between gap-3 px-5 py-1.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.student}</p>
                  <p className="truncate text-xs text-ink-muted">{r.test}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone={r.score >= 85 ? "green" : r.score >= 70 ? "amber" : "red"}>{r.score}%</Badge>
                  <p className="mt-1 text-2xs text-ink-faint">{r.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Recent Activity</h3>
            <Link href="/admin/notifications" className="text-xs font-medium text-signal-blue hover:underline">
              View all
            </Link>
          </div>
          <CardContent className="flex flex-col gap-4">
            {recentActivity.map((a) => (
              <div key={`${a.type}-${a.subtitle}`} className="flex items-start gap-3">
                <ActivityIcon type={a.type} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <p className="truncate text-xs text-ink-muted">{a.subtitle}</p>
                  <p className="text-2xs text-ink-faint">{a.timeAgo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
