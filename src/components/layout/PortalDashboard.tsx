import Link from "next/link";
import { PageHeader } from "./PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { navigationByRole, portalLabel, type PortalRole } from "@/config/navigation";
import type { KpiDatum } from "@/lib/mock/dashboard.mock";
import type { LucideIcon } from "lucide-react";

export interface PortalDashboardProps {
  role: PortalRole;
  welcomeName?: string;
  kpis?: KpiDatum[];
  kpiIcons?: LucideIcon[];
}

/**
 * Trainer / Student dashboard shell: a KPI row (mock data — see
 * src/lib/mock/dashboard.mock.ts) plus a module directory built from
 * the navigation config. The Admin portal has its own fuller
 * AdminDashboard; this lighter version keeps the same visual
 * language for the other two roles until each module gets a
 * dedicated dashboard of its own.
 */
export function PortalDashboard({ role, welcomeName = "there", kpis, kpiIcons }: PortalDashboardProps) {
  const items = navigationByRole[role].filter((item) => item.href !== `/${role}` && item.label !== "Settings");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good morning, ${welcomeName}! 👋`}
        description={`Here's what's happening in your ${portalLabel[role].toLowerCase()} portal today.`}
      />

      {kpis && kpis.length > 0 && kpiIcons && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              {...kpi}
              icon={kpiIcons[i] ?? kpiIcons[0]!}
              tone={i % 2 === 0 ? "green" : "gold"}
            />
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Explore your modules</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full transition-colors hover:border-primary-300 hover:shadow-panel">
                  <CardContent className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{item.label}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">Module placeholder</p>
                      </div>
                    </div>
                    <Badge tone="amber">Coming soon</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
