import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { CourseDetailView } from "@/components/modules/CourseDetailView";
import { CourseAdminActions } from "@/components/modules/CourseAdminActions";
import { CourseModulesManager } from "@/components/modules/CourseModulesManager";
import { CourseAdminSections } from "@/components/modules/CourseAdminSections";
import { coursesService } from "@/services/courses.service";
import { courseManagementService, CourseManagementUnavailableError } from "@/services/course-management.service";
import type { CourseDetail, CourseHistoryEntry, CourseUsage } from "@/types/course";

export const dynamic = "force-dynamic";

export default async function AdminCourseDetailPage({ params }: { params: { courseId: string } }) {
  let course: CourseDetail | null;
  let management: { usage: CourseUsage; history: CourseHistoryEntry[] } | null = null;

  try {
    // Null when the course doesn't exist, the id is invalid, *or* it is
    // outside this user's scope — all surface as the same 404.
    course = await coursesService.getCourse(params.courseId);
    // Course Management state (Super Admin only; null in demo mode).
    if (course) {
      try {
        management = await courseManagementService.getManagement(course.id);
      } catch (err) {
        // Without the Course Management database update (migration 0030) the course is still shown,
        // read-only, exactly as before that update; any other failure is reported below.
        if (!(err instanceof CourseManagementUnavailableError)) throw err;
        console.error("[admin/courses/detail] course management unavailable (migration 0030 not applied); showing read-only view");
      }
    }
  } catch (err) {
    console.error("[admin/courses/detail] load failed:", err instanceof Error ? err.message : err);
    return <ErrorState title="We couldn't load this course" description="Please try again." />;
  }

  if (!course) notFound();

  if (!management) {
    // Demo mode, or Course Management not yet set up in the database: read-only course view.
    return <CourseDetailView course={course} backHref="/admin/courses" />;
  }

  return (
    <CourseDetailView
      course={course}
      backHref="/admin/courses"
      actions={
        <CourseAdminActions
          courseId={course.id}
          status={course.status ?? "draft"}
          batchCount={management.usage.batchCount}
          canDelete={management.usage.canDelete}
          archiveImpact={{
            upcoming: management.usage.upcomingBatchCount,
            ongoing: management.usage.ongoingBatchCount,
            pendingInvitations: management.usage.pendingUpcomingInvitationCount,
          }}
        />
      }
      modulesPanel={<CourseModulesManager courseId={course.id} modules={course.modules} locked={management.usage.hasHistory} />}
      footer={<CourseAdminSections usage={management.usage} history={management.history} />}
    />
  );
}
