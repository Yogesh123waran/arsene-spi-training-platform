import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { CourseDetailView } from "@/components/modules/CourseDetailView";
import { coursesService } from "@/services/courses.service";
import type { CourseDetail } from "@/types/course";

export const dynamic = "force-dynamic";

export default async function AdminCourseDetailPage({ params }: { params: { courseId: string } }) {
  let course: CourseDetail | null;

  try {
    // Null when the course doesn't exist, the id is invalid, *or* it is
    // outside this user's scope — all surface as the same 404.
    course = await coursesService.getCourse(params.courseId);
  } catch (err) {
    console.error("[admin/courses/detail] load failed:", err instanceof Error ? err.message : err);
    return <ErrorState title="We couldn't load this course" description="Please try again." />;
  }

  if (!course) notFound();

  return <CourseDetailView course={course} backHref="/admin/courses" />;
}
