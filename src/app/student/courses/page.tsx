import { PageHeader } from "@/components/layout/PageHeader";
import { CoursesGrid } from "@/components/modules/CoursesGrid";
import { getEnrolledCourses } from "@/lib/mock/courses-table.mock";

export default function StudentCoursesPage() {
  return (
    <div>
      <PageHeader title="My Courses" description="Courses you're currently enrolled in." />
      <CoursesGrid courses={getEnrolledCourses()} basePath="/student/courses" />
    </div>
  );
}
