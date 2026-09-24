import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  UserRound,
  BookOpen,
  Layers,
  Video,
  ClipboardCheck,
  FileVideo,
  FileText,
  PencilLine,
  FileQuestion,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/format";
import type { ClassWithRelations } from "@/types/class";

export interface ClassDetailViewProps {
  trainingClass: ClassWithRelations;
  /** Route prefix for the back link and edit action, e.g. "/admin/classes". */
  basePath: string;
  canManage?: boolean;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-0.5 text-sm text-ink">{value}</p>
      </div>
    </div>
  );
}

export function ClassDetailView({ trainingClass: c, basePath, canManage = false }: ClassDetailViewProps) {
  // A meeting link is only actionable while the class is still live or upcoming.
  const canJoin = Boolean(c.teamsMeetingUrl) && c.status !== "cancelled" && c.status !== "completed";

  return (
    <div>
      <Link href={basePath} className="mb-3 flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to classes
      </Link>

      <PageHeader
        title={c.title}
        description={c.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            {canManage && (
              <Link href={`${basePath}/${c.id}/edit`}>
                <Button size="sm" variant="secondary">
                  <PencilLine className="h-4 w-4" /> Edit
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="recording">Recording</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InfoRow icon={BookOpen} label="Course" value={c.courseTitle} />
                  <InfoRow icon={Layers} label="Module" value={c.moduleTitle ?? "Not linked to a module"} />
                  <InfoRow icon={Layers} label="Batch" value={c.batchName} />
                  <InfoRow icon={UserRound} label="Trainer" value={c.trainerName} />
                  <InfoRow icon={CalendarDays} label="Date" value={formatDate(c.classDate)} />
                  <InfoRow icon={Clock} label="Time" value={`${c.startTime} – ${c.endTime}`} />
                  <InfoRow icon={Video} label="Class type" value={c.classType.charAt(0).toUpperCase() + c.classType.slice(1)} />
                </CardContent>
              </Card>

              {c.description && (
                <Card className="mt-4">
                  <CardContent>
                    <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-muted">Description</h3>
                    <p className="whitespace-pre-line text-sm text-ink">{c.description}</p>
                  </CardContent>
                </Card>
              )}

              {canManage && c.notes && (
                <Card className="mt-4">
                  <CardContent>
                    <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-muted">
                      Internal notes
                    </h3>
                    <p className="whitespace-pre-line text-sm text-ink-muted">{c.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Future-phase sections. Deliberately empty states — no
                fake upload/record functionality is presented here. */}
            <TabsContent value="attendance">
              <EmptyState
                icon={ClipboardCheck}
                title="Attendance not enabled yet"
                description="Attendance for this class will appear here once the attendance module is enabled."
              />
            </TabsContent>

            <TabsContent value="recording">
              <EmptyState
                icon={FileVideo}
                title="No recording yet"
                description="Class recording will appear here after the recording module is enabled."
              />
            </TabsContent>

            <TabsContent value="materials">
              <EmptyState
                icon={FileText}
                title="No materials yet"
                description="Class materials will appear here once the materials module is enabled."
              />
            </TabsContent>

            <TabsContent value="assignment">
              <EmptyState
                icon={PencilLine}
                title="No assignment yet"
                description="Assignments for this class will appear here once the assignment module is enabled."
              />
            </TabsContent>

            <TabsContent value="test">
              <EmptyState
                icon={FileQuestion}
                title="No test linked yet"
                description="A test linked to this class will appear here once the test module is connected."
              />
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">Join the class</p>
              {canJoin && c.teamsMeetingUrl ? (
                <>
                  <a href={c.teamsMeetingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    <Button className="w-full">
                      <Video className="h-4 w-4" /> Join Teams Meeting
                    </Button>
                  </a>
                  <p className="mt-2 text-2xs text-ink-faint">Opens Microsoft Teams in a new tab.</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">
                  {c.status === "cancelled"
                    ? "This class was cancelled."
                    : c.status === "completed"
                      ? "This class has finished."
                      : "No meeting link has been added yet."}
                </p>
              )}
            </div>

            <div className="border-t border-surface-border pt-4">
              <dl className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Status</dt>
                  <dd>
                    <StatusBadge status={c.status} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Type</dt>
                  <dd className="font-medium capitalize text-ink">{c.classType}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Batch</dt>
                  <dd className="font-medium text-ink">{c.batchName}</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
