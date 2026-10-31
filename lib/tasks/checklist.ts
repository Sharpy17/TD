import { z } from "zod";
import type { ChecklistItem } from "@/lib/domain/types";

export const MAX_CHECKLIST_ITEMS = 30;

const checklistSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(40),
      text: z.string().trim().min(1).max(200),
      done: z.boolean(),
    }),
  )
  .max(MAX_CHECKLIST_ITEMS);

/** Validates checklist input from the client. Returns null when it is malformed. */
export function parseChecklist(value: unknown): ChecklistItem[] | null {
  const result = checklistSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** Reads the stored JSON column; anything unexpected is treated as an empty checklist. */
export function readStoredChecklist(value: unknown): ChecklistItem[] {
  return parseChecklist(value) ?? [];
}
