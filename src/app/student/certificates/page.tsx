import { PageHeader } from "@/components/layout/PageHeader";
import { CertificatesTable } from "@/components/modules/CertificatesTable";
import { getCertificatesForStudent } from "@/lib/mock/certificates.mock";
import { EmptyState } from "@/components/ui/EmptyState";
import { Award } from "lucide-react";

const STUDENT_NAME = "Priya Nair";

export default function StudentCertificatesPage() {
  const rows = getCertificatesForStudent(STUDENT_NAME);

  return (
    <div>
      <PageHeader title="My Certificates" description="Certificates you've earned so far." />
      {rows.length > 0 ? (
        <CertificatesTable rows={rows} />
      ) : (
        <EmptyState icon={Award} title="No certificates yet" description="Complete a course to earn your first certificate." />
      )}
    </div>
  );
}
