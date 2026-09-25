"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal, Eye, Pencil, Users } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/format";
import type { BatchSummary } from "@/types/batch";

const PAGE_SIZE = 5;

export function BatchesTable({ rows }: { rows: BatchSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQuery = query.trim() === "" || r.name.toLowerCase().includes(query.toLowerCase()) || r.course.toLowerCase().includes(query.toLowerCase());
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
            placeholder="Search batches…"
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
            { label: "Upcoming", value: "upcoming" },
            { label: "Ongoing", value: "ongoing" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ]}
        />
      </div>

      {paged.length === 0 ? (
        <EmptyState title="No batches match your search" description="Try a different name, course, or status filter." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Batch</TableHeaderCell>
              <TableHeaderCell>Course</TableHeaderCell>
              <TableHeaderCell>Trainer</TableHeaderCell>
              <TableHeaderCell>Students</TableHeaderCell>
              <TableHeaderCell>Start Date</TableHeaderCell>
              <TableHeaderCell>End Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-ink">{b.name}</TableCell>
                <TableCell>{b.course}</TableCell>
                <TableCell>{b.trainer}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-ink-faint" />
                    {b.students}/{b.maxSeats}
                  </span>
                </TableCell>
                <TableCell>{formatDate(b.startDate)}</TableCell>
                <TableCell>{formatDate(b.endDate)}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Dropdown
                    align="right"
                    trigger={
                      <button
                        aria-label={`Actions for ${b.name}`}
                        className="rounded p-1.5 text-ink-muted hover:bg-surface-sunken"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    }
                  >
                    <DropdownItem onClick={() => notImplemented("View batch")}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </DropdownItem>
                    <DropdownItem onClick={() => notImplemented("Edit batch")}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </DropdownItem>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
