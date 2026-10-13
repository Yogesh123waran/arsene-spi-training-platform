import Link from "next/link";
import { ChevronRight, FileBarChart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/** Existing pages that already show live figures, per portal (each is scoped by its own service). */
const LIVE_PAGES = {
  admin: [
    { label: "Performance", href: "/admin/performance" },
    { label: "Attendance", href: "/admin/attendance" },
    { label: "Tests", href: "/admin/tests" },
  ],
  trainer: [
    { label: "Performance", href: "/trainer/performance" },
    { label: "Attendance", href: "/trainer/attendance" },
    { label: "Tests", href: "/trainer/tests" },
  ],
} as const;

/**
 * Reports (P5.0): downloadable reports are not built yet, so nothing here pretends otherwise —
 * no sample report list, no invented "last generated" dates, no filters or export buttons that do
 * nothing. It points to the existing pages that already show the live figures.
 */
export function ReportsUnavailable({ portal }: { portal: keyof typeof LIVE_PAGES }) {
  return (
    <EmptyState
      icon={FileBarChart}
      title="Downloadable reports aren't available yet"
      description="Report exports haven't been built yet. You can see the current figures on these pages:"
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {LIVE_PAGES[portal].map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-surface-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-sunken"
            >
              {page.label}
              <ChevronRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
            </Link>
          ))}
        </div>
      }
    />
  );
}
