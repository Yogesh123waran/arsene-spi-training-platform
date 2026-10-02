"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InviteUserDialog, type InviteBatchOption, type InviteKind } from "./InviteUserDialog";

/**
 * The Add Student / Add Trainer header button (same look as before) and
 * its invitation dialog. Open/close state only — no business logic.
 */
export function InviteUserButton({ kind, batches }: { kind: InviteKind; batches?: InviteBatchOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> {kind === "student" ? "Add Student" : "Add Trainer"}
      </Button>
      <InviteUserDialog kind={kind} open={open} onClose={() => setOpen(false)} batches={batches} />
    </>
  );
}
