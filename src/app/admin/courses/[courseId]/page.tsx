import { CourseDetailView } from "@/components/modules/CourseDetailView";

export default function AdminCourseDetailPage({ params }: { params: { courseId: string } }) {
  return <CourseDetailView courseId={params.courseId} backHref="/admin/courses" />;
}
