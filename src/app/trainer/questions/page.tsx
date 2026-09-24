import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { QuestionsView } from "@/components/modules/QuestionsView";
import { getQuestionsForCourse } from "@/lib/mock/questions-table.mock";

const TRAINER_COURSES = ["Instrumentation Basics", "Control Systems"];

export default function TrainerQuestionsPage() {
  const questions = TRAINER_COURSES.flatMap((course) => getQuestionsForCourse(course));

  return (
    <div>
      <PageHeader
        title="Question Bank"
        description="Manage questions for your assigned courses."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        }
      />
      <QuestionsView questions={questions} />
    </div>
  );
}
