import { CourseDetailView } from "@/components/modules/CourseDetailView";

export default function StudentCourseDetailPage({ params }: { params: { courseId: string } }) {
  return <CourseDetailView courseId={params.courseId} backHref="/student/courses" />;
}
