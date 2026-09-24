import "server-only";
import { authConfig } from "@/config/auth";
import { mockClassFilterOptions } from "@/lib/mock/classes.mock";
import type { ClassFilterOptions } from "@/types/class";

/**
 * Option lists for the Classes filter bar and the create/edit form.
 *
 * Phase 1 scope note: courses / modules / batches / trainers have no
 * real tables yet, so these come from the demo dataset in both modes.
 * When those tables land, replace the body below with the
 * corresponding queries — the shape and every caller stay unchanged.
 */
export async function getClassFilterOptions(): Promise<ClassFilterOptions> {
  // Intentionally identical in both auth modes for now — see note above.
  void authConfig.mode;
  return mockClassFilterOptions;
}
