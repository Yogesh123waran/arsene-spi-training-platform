"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { TrainerEditStudentDialog } from "@/components/modules/TrainerEditStudentDialog";
import type { StudentSummary } from "@/types/student";

const PAGE_SIZE = 5;

/**
 * `trainerEdit` is passed by the trainer page only (P3.10-B): "Edit" opens
 * the trainer edit dialog, and only on rows the server marked editable
 * (enrolled in an upcoming/ongoing batch the trainer runs). The Super
 * Admin page renders the table without it — its menu is unchanged.
 */
export function StudentsTable({ rows, trainerEdit = false }: { rows: StudentSummary[]; trainerEdit?: boolean }) {
  const [editTarget, setEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQuery =
        query.trim() === "" ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || r.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function notImplemented(action: string) {
    showToast({ variant: "info", title: `${action} isn't wired up yet`, description: "This UI pass is presentation-only." });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Search students…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="sm:w-44"
          options={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Invited", value: "invited" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
      </div>

      {paged.length === 0 ? (
        <EmptyState title="No students match your search" description="Try a different name, email, or status filter." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Student</TableHeaderCell>
              <TableHeaderCell>Batch</TableHeaderCell>
              <TableHeaderCell>Course</TableHeaderCell>
              <TableHeaderCell>Attendance</TableHeaderCell>
              <TableHeaderCell>Performance</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" tone="blue" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                      <p className="truncate text-xs text-ink-muted">{s.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{s.batch}</TableCell>
                <TableCell>{s.course}</TableCell>
                <TableCell className="w-32">
                  {s.attendance !== undefined && s.attendance > 0 ? (
                    <ProgressBar value={s.attendance} tone={s.attendance >= 85 ? "teal" : s.attendance >= 70 ? "amber" : "red"} />
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </TableCell>
                <TableCell className="w-32">
                  {s.performance !== undefined && s.performance > 0 ? (
                    <ProgressBar value={s.performance} tone={s.performance >= 85 ? "teal" : s.performance >= 70 ? "amber" : "red"} />
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Dropdown
                    align="right"
                    trigger={
                      <button
                        aria-label={`Actions for ${s.name}`}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    }
                  >
                    <DropdownItem onClick={() => notImplemented("View profile")}>
                      <Eye className="h-3.5 w-3.5" /> View profile
                    </DropdownItem>
                    {!trainerEdit ? (
                      <DropdownItem onClick={() => notImplemented("Edit student")}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </DropdownItem>
                    ) : s.editable === true ? (
                      <DropdownItem onClick={() => setEditTarget({ id: s.id, name: s.name })}>
                        <Pencil className="h-3.5 w-3.5" /> Edit student
                      </DropdownItem>
                    ) : null}
                    {/* P3.10-C: trainers have no remove/deactivate authority, so the trainer menu has no Remove. */}
                    {!trainerEdit && (
                      <DropdownItem onClick={() => notImplemented("Remove student")} className="text-signal-red">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </DropdownItem>
                    )}
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {trainerEdit && <TrainerEditStudentDialog student={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}
