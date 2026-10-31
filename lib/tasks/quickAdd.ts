import type { UserSummary } from "@/lib/domain/types";

const HOUR_MS = 60 * 60 * 1000;

export interface QuickAddContext {
  modules: Array<{ id: string; name: string }>;
  members: UserSummary[];
  nowMs: number;
}

export interface QuickAddResult {
  title: string;
  moduleId: string | null;
  assigneeId: string | null;
  dueAt: string | null;
  /** Human-readable labels for every token that resolved, in input order. */
  tokens: string[];
}

/** Resolves `!today`, `!tomorrow`, `!3d`, `!6h` to an absolute deadline. */
function resolveDue(value: string, nowMs: number): number | null {
  if (value === "today") {
    const end = new Date(nowMs);
    end.setHours(23, 59, 0, 0);
    return end.getTime();
  }
  if (value === "tomorrow") {
    const end = new Date(nowMs);
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 0, 0);
    return end.getTime();
  }
  const relative = /^(\d{1,3})([dh])$/.exec(value);
  if (relative) {
    const amount = Number(relative[1]);
    return nowMs + amount * (relative[2] === "d" ? 24 : 1) * HOUR_MS;
  }
  return null;
}

/**
 * Parses the board's one-line task syntax: `Fix echo @alina ^voice !tomorrow`.
 * Unresolved tokens stay in the title so nothing the user typed is silently lost.
 */
export function parseQuickAdd(input: string, context: QuickAddContext): QuickAddResult {
  const result: QuickAddResult = { title: "", moduleId: null, assigneeId: null, dueAt: null, tokens: [] };
  const words: string[] = [];

  for (const word of input.trim().split(/\s+/)) {
    if (!word) continue;
    const sigil = word[0];
    const value = word.slice(1).toLowerCase();

    if (sigil === "@" && value && !result.assigneeId) {
      const member = context.members.find((m) => m.name.toLowerCase().startsWith(value));
      if (member) {
        result.assigneeId = member.id;
        result.tokens.push(`@${member.name}`);
        continue;
      }
    }

    if (sigil === "^" && value && !result.moduleId) {
      const match = context.modules.find((m) => m.name.toLowerCase().startsWith(value));
      if (match) {
        result.moduleId = match.id;
        result.tokens.push(`^${match.name}`);
        continue;
      }
    }

    if (sigil === "!" && value && !result.dueAt) {
      const dueMs = resolveDue(value, context.nowMs);
      if (dueMs !== null) {
        result.dueAt = new Date(dueMs).toISOString();
        result.tokens.push(`!${value}`);
        continue;
      }
    }

    words.push(word);
  }

  result.title = words.join(" ");
  return result;
}
