"use server";

/**
 * Server Actions — the RPC boundary the Add Batch form calls. Each action
 * delegates to batchesService (which resolves the caller's identity and
 * authorization server-side) and returns a plain, serializable result.
 * Actions never redirect; the calling component decides how to navigate.
 */

import { revalidatePath } from "next/cache";
import {
  batchesService,
  BatchCreateAuthorizationError,
  BatchCreateValidationError,
  BatchRepositoryError,
} from "./batches.service";
import type { BatchValidationErrors, CreateBatchInput } from "@/types/batch";

export interface BatchActionResult {
  ok: boolean;
  batchId?: string;
  errors?: BatchValidationErrors;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function createBatchAction(input: CreateBatchInput): Promise<BatchActionResult> {
  try {
    const created = await batchesService.createBatch(input);
    revalidatePath("/admin/batches");
    revalidatePath("/trainer/batches");
    return { ok: true, batchId: created.id };
  } catch (err) {
    if (err instanceof BatchCreateValidationError) return { ok: false, errors: err.errors };
    if (err instanceof BatchCreateAuthorizationError || err instanceof BatchRepositoryError) {
      // Both carry messages written to be shown to users.
      return { ok: false, errors: { form: err.message } };
    }
    console.error("[batches.actions] createBatch:", err instanceof Error ? err.message : err);
    return { ok: false, errors: { form: GENERIC_ERROR } };
  }
}
