import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { batchTableRows } from "@/lib/mock/batches-table.mock";
import { BatchesTable } from "@/components/modules/BatchesTable";

export default function AdminBatchesPage() {
  return (
    <div>
      <PageHeader
        title="Batches"
        description="Schedule and manage training batches for each course."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Batch
          </Button>
        }
      />
      <BatchesTable rows={batchTableRows} />
    </div>
  );
}
