import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { questionTableRows } from "@/lib/mock/questions-table.mock";
import { QuestionsView } from "@/components/modules/QuestionsView";

export default function AdminQuestionsPage() {
  return (
    <div>
      <PageHeader
        title="Question Bank"
        description="Build and organize the shared question bank."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        }
      />
      <QuestionsView questions={questionTableRows} />
    </div>
  );
}
