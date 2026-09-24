export type CertificateStatus = "issued" | "revoked" | "expired";

export interface Certificate {
  id: string;
  certificateNumber: string;
  studentId: string;
  courseId: string;
  batchId: string;
  issuedDate: string;
  expiryDate?: string;
  status: CertificateStatus;
  fileUrl?: string;
}
