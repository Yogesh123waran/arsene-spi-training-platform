import { PageHeader } from "@/components/layout/PageHeader";
import { CoursesGrid } from "@/components/modules/CoursesGrid";
import { getCoursesForTrainer } from "@/lib/mock/courses-table.mock";

// Demo scope: in a later part this comes from the signed-in trainer's profile.
const TRAINER_NAME = "Rajesh Kumar";

export default function TrainerCoursesPage() {
  return (
    <div>
      <PageHeader title="My Courses" description="Courses you're assigned to teach." />
      <CoursesGrid courses={getCoursesForTrainer(TRAINER_NAME)} basePath="/trainer/courses" />
    </div>
  );
}
