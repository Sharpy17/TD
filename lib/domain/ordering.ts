/**
 * Fractional order keys: strings that sort with plain `<` and always leave room for a key in between,
 * so moving a card rewrites one row instead of renumbering the column.
 * Valid keys use only DIGITS and never end in "0".
 */
const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function isValidOrderKey(key: string): boolean {
  return key.length > 0 && !key.endsWith("0") && [...key].every((char) => DIGITS.includes(char));
}

function midpoint(a: string, b: string | null): string {
  if (b !== null) {
    let n = 0;
    while ((a[n] ?? "0") === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0]) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0]) : DIGITS.length;
  if (digitB - digitA > 1) return DIGITS[Math.round((digitA + digitB) / 2)];
  if (b !== null && b.length > 1) return b.slice(0, 1);
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}

/** A key strictly between `before` and `after`; either side may be open (null). */
export function keyBetween(before: string | null, after: string | null): string {
  const a = before && isValidOrderKey(before) ? before : "";
  const b = after && isValidOrderKey(after) ? after : null;
  if (b !== null && a >= b) return midpoint(a, null);
  return midpoint(a, b);
}

/** `count` ascending keys, for re-keying a whole list. */
export function sequentialKeys(count: number): string[] {
  const keys: string[] = [];
  let previous: string | null = null;
  for (let i = 0; i < count; i++) {
    previous = keyBetween(previous, null);
    keys.push(previous);
  }
  return keys;
}

export function compareOrderKeys(a: string | undefined, b: string | undefined): number {
  const x = a ?? "";
  const y = b ?? "";
  return x < y ? -1 : x > y ? 1 : 0;
}
