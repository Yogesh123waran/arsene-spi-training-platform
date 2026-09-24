"use client";

import { useState } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import type { NotificationRow } from "@/lib/mock/notifications.mock";

const iconByType: Record<NotificationRow["type"], { icon: typeof Info; classes: string }> = {
  info: { icon: Info, classes: "bg-signal-blueSoft text-signal-blue" },
  success: { icon: CheckCircle2, classes: "bg-primary-50 text-primary-600" },
  warning: { icon: AlertTriangle, classes: "bg-brand-goldSoft text-brand-gold" },
  error: { icon: XCircle, classes: "bg-signal-redSoft text-signal-red" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const [rows, setRows] = useState(notifications);
  const unreadCount = rows.filter((r) => !r.read).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{unreadCount}</span> unread notification{unreadCount === 1 ? "" : "s"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRows((prev) => prev.map((r) => ({ ...r, read: true })))}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((n) => {
          const { icon: Icon, classes } = iconByType[n.type];
          return (
            <Card
              key={n.id}
              className={cn("cursor-pointer p-4 transition-colors", !n.read && "border-primary-200 bg-primary-50/40")}
              onClick={() => setRows((prev) => prev.map((r) => (r.id === n.id ? { ...r, read: true } : r)))}
            >
              <div className="flex items-start gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", classes)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gold" aria-label="Unread" />}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{n.message}</p>
                  <p className="mt-1 text-2xs text-ink-faint">{timeAgo(n.date)}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
