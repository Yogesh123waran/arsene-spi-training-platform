import Link from "next/link";
import { ArrowLeft, Layers, Clock, UserRound, BookOpen, CalendarDays, FileText, FileQuestion, LineChart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CourseDetail } from "@/types/course";

export interface CourseDetailViewProps {
  /** The course, already loaded (and access-checked) by the page via coursesService. */
  course: CourseDetail;
  /** Where "Back to courses" and the surrounding portal point — e.g. "/admin/courses". */
  backHref: string;
}

/**
 * Shared course detail layout (Course Header → Information → Modules →
 * Classes → Materials → Tests → Progress) used by /admin, /trainer and
 * /student course detail routes. Each portal's page.tsx loads the
 * course and supplies its own back-link.
 *
 * Topics, overall progress and per-module status have no data source
 * in Supabase mode yet (undefined) and are hidden until they do.
 */
export function CourseDetailView({ course, backHref }: CourseDetailViewProps) {
  const hasProgress = course.progress !== undefined;
  const progress = course.progress ?? 0;

  return (
    <div>
      <Link href={backHref} className="mb-3 flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to courses
      </Link>

      <PageHeader
        title={course.title}
        description={course.description}
        actions={<Button size="sm">{progress > 0 ? "Continue" : "Start Course"}</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> {course.modules.length} Modules
            </span>
            {course.topics !== undefined && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> {course.topics} Topics
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {course.durationHours} Hours
            </span>
            <span className="flex items-center gap-1.5">
              <UserRound className="h-4 w-4" /> {course.trainer}
            </span>
          </div>

          <Tabs defaultValue="modules">
            <TabsList>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="modules">
              <Card>
                <div className="divide-y divide-surface-border">
                  {course.modules.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {m.sequence}. {m.title}
                        </p>
                        {m.topics !== undefined && <p className="text-xs text-ink-muted">{m.topics} topics</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {m.status ? (
                          <>
                            <StatusBadge status={m.status} />
                            <Button size="sm" variant={m.status === "not_started" ? "secondary" : "primary"}>
                              {m.status === "completed" ? "View" : m.status === "in_progress" ? "Continue" : "Start"}
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="classes">
              <EmptyState
                icon={CalendarDays}
                title="No scheduled classes yet"
                description="Classes for this course will appear here once a batch is scheduled."
              />
            </TabsContent>

            <TabsContent value="materials">
              <EmptyState icon={FileText} title="No materials uploaded yet" description="Trainer-uploaded materials will appear here." />
            </TabsContent>

            <TabsContent value="tests">
              <EmptyState icon={FileQuestion} title="No tests linked yet" description="Tests created for this course will appear here." />
            </TabsContent>

            <TabsContent value="progress">
              {hasProgress ? (
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    <ProgressBar value={progress} tone="teal" label="Overall course progress" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {course.modules.map((m) => (
                        <div key={m.id} className="rounded-lg border border-surface-border p-3 text-center">
                          <p className="text-xs text-ink-muted">Module {m.sequence}</p>
                          {m.status && <StatusBadge status={m.status} className="mt-1.5" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={LineChart}
                  title="Progress isn't tracked yet"
                  description="Course progress will appear here once attendance and test results are recorded."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardContent className="flex flex-col gap-4">
            {hasProgress && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <LineChart className="h-3.5 w-3.5" /> Your progress
                </p>
                <ProgressBar value={progress} tone="teal" />
              </div>
            )}
            <div className="flex flex-col gap-2 text-xs text-ink-muted">
              <div className="flex justify-between">
                <span>Trainer</span>
                <span className="font-medium text-ink">{course.trainer}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium text-ink">{course.durationHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Modules</span>
                <span className="font-medium text-ink">{course.modules.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
