import { describe, expect, it } from "vitest";
import { compareOrderKeys, isValidOrderKey, keyBetween, sequentialKeys } from "../lib/domain/ordering";
import { modulePrefix, taskCode } from "../lib/domain/taskCodes";
import { parseChecklist, readStoredChecklist } from "../lib/tasks/checklist";
import { avatarTone } from "../components/board/boardModel";

describe("order keys", () => {
  it("always produces a key strictly between its neighbours", () => {
    const cases: Array<[string | null, string | null]> = [
      [null, null],
      [null, "1"],
      ["1", null],
      ["1", "2"],
      ["a", "a1"],
      ["zz", null],
      ["0001", "0002"],
    ];
    for (const [a, b] of cases) {
      const key = keyBetween(a, b);
      expect(isValidOrderKey(key)).toBe(true);
      if (a) expect(key > a).toBe(true);
      if (b) expect(key < b).toBe(true);
    }
  });

  it("survives many insertions at the same spot", () => {
    let low = "1";
    const high = "2";
    for (let i = 0; i < 50; i++) {
      const key = keyBetween(low, high);
      expect(key > low && key < high).toBe(true);
      low = key;
    }
  });

  it("falls back to 'after' when neighbours are out of order or equal", () => {
    expect(keyBetween("5", "5") > "5").toBe(true);
    expect(keyBetween("9", "2") > "9").toBe(true);
  });

  it("ignores invalid neighbour keys", () => {
    expect(isValidOrderKey(keyBetween("0010", "~"))).toBe(true);
  });

  it("builds ascending unique keys for re-keying", () => {
    const keys = sequentialKeys(60);
    expect(new Set(keys).size).toBe(60);
    expect([...keys].sort(compareOrderKeys)).toEqual(keys);
  });
});

describe("task codes", () => {
  it("derives a three-letter prefix from the module name", () => {
    expect(modulePrefix("Kanban engine")).toBe("KAN");
    expect(modulePrefix("Auth & profiles")).toBe("AUT");
    expect(modulePrefix("UI")).toBe("UIX");
    expect(modulePrefix("∑ 42")).toBe("TSK");
    expect(taskCode("Voice lounges", 12)).toBe("VOI-12");
    expect(taskCode("Voice lounges", null)).toBeNull();
  });
});

describe("checklist validation", () => {
  it("accepts well-formed items and trims text", () => {
    expect(parseChecklist([{ id: "a", text: "  Ship it ", done: false }])).toEqual([
      { id: "a", text: "Ship it", done: false },
    ]);
  });

  it("rejects malformed input", () => {
    expect(parseChecklist([{ id: "a", text: "", done: false }])).toBeNull();
    expect(parseChecklist("nope")).toBeNull();
    expect(parseChecklist(Array.from({ length: 31 }, (_, i) => ({ id: `${i}`, text: "x", done: false })))).toBeNull();
  });

  it("treats unreadable stored data as empty", () => {
    expect(readStoredChecklist(null)).toEqual([]);
    expect(readStoredChecklist({ broken: true })).toEqual([]);
  });
});

describe("avatar tones", () => {
  it("is stable per user and within the palette", () => {
    expect(avatarTone("usr_alex")).toBe(avatarTone("usr_alex"));
    for (const id of ["a", "b", "usr_dastan", "cl9x0abc"]) {
      expect(avatarTone(id)).toBeGreaterThanOrEqual(0);
      expect(avatarTone(id)).toBeLessThan(6);
    }
  });
});
