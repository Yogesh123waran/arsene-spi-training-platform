import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { courseCards } from "@/lib/mock/courses-table.mock";
import { CoursesGrid } from "@/components/modules/CoursesGrid";

export default function AdminCoursesPage() {
  return (
    <div>
      <PageHeader
        title="Courses"
        description="Manage the SPI course catalog: modules, levels and durations."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Course
          </Button>
        }
      />
      <CoursesGrid courses={courseCards} />
    </div>
  );
}
