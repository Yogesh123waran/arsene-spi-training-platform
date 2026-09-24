import { PageHeader } from "@/components/layout/PageHeader";
import { BatchesTable } from "@/components/modules/BatchesTable";
import { getBatchesForTrainer } from "@/lib/mock/batches-table.mock";

const TRAINER_NAME = "Rajesh Kumar";

export default function TrainerBatchesPage() {
  return (
    <div>
      <PageHeader title="My Batches" description="Batches you're assigned to train." />
      <BatchesTable rows={getBatchesForTrainer(TRAINER_NAME)} />
    </div>
  );
}
