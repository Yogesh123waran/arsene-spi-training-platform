"use client";

import { Download, Eye } from "lucide-react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/format";
import type { CertificateRow } from "@/lib/mock/certificates.mock";

export function CertificatesTable({ rows }: { rows: CertificateRow[] }) {
  const { showToast } = useToast();

  function notImplemented(action: string) {
    showToast({ variant: "info", title: `${action} isn't wired up yet`, description: "This UI pass is presentation-only." });
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Certificate ID</TableHeaderCell>
          <TableHeaderCell>Student</TableHeaderCell>
          <TableHeaderCell>Course</TableHeaderCell>
          <TableHeaderCell>Completion Date</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-mono text-xs text-ink">{c.certificateNumber}</TableCell>
            <TableCell className="font-medium text-ink">{c.student}</TableCell>
            <TableCell>{c.course}</TableCell>
            <TableCell>{formatDate(c.completionDate)}</TableCell>
            <TableCell>
              <StatusBadge status={c.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => notImplemented("View certificate")}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => notImplemented("Download certificate")}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
