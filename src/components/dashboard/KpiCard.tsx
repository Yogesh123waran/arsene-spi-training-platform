import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import type { KpiDatum } from "@/lib/mock/dashboard.mock";

export interface KpiCardProps extends KpiDatum {
  icon: LucideIcon;
  tone?: "green" | "gold" | "blue" | "teal";
}

const toneClasses = {
  green: "bg-primary-50 text-primary-600",
  gold: "bg-brand-goldSoft text-brand-gold",
  blue: "bg-signal-blueSoft text-signal-blue",
  teal: "bg-signal-tealSoft text-signal-teal",
} as const;

export function KpiCard({ label, value, trend, trendLabel, icon: Icon, tone = "green" }: KpiCardProps) {
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  const trendTone = trend > 0 ? "text-signal-green" : trend < 0 ? "text-signal-red" : "text-ink-faint";

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-0.5 text-kpi text-ink">{value}</p>
          <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", trendTone)}>
            <TrendIcon className="h-3 w-3" />
            {trend > 0 ? "+" : ""}
            {trend}% <span className="font-normal text-ink-faint">{trendLabel}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
