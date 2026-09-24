import { CourseDetailView } from "@/components/modules/CourseDetailView";

export default function TrainerCourseDetailPage({ params }: { params: { courseId: string } }) {
  return <CourseDetailView courseId={params.courseId} backHref="/trainer/courses" />;
}
