import { PageHeader } from "@/components/layout/PageHeader";
import { certificateRows } from "@/lib/mock/certificates.mock";
import { CertificatesTable } from "@/components/modules/CertificatesTable";

export default function AdminCertificatesPage() {
  return (
    <div>
      <PageHeader title="Certificates" description="Issue and manage completion certificates." />
      <CertificatesTable rows={certificateRows} />
    </div>
  );
}
