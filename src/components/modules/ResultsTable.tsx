import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/format";
import type { ResultRow } from "@/lib/mock/results.mock";

export function ResultsTable({ rows }: { rows: ResultRow[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Test</TableHeaderCell>
          <TableHeaderCell>Course</TableHeaderCell>
          <TableHeaderCell>Score</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-ink">{r.test}</TableCell>
            <TableCell>{r.course}</TableCell>
            <TableCell>
              {r.status === "pending_review" ? (
                <span className="text-xs text-ink-faint">Pending</span>
              ) : (
                `${r.score}/${r.totalMarks}`
              )}
            </TableCell>
            <TableCell>{formatDate(r.date)}</TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
