/** "Kanban engine" → "KAN", "Auth & profiles" → "AUT". Falls back to "TSK" for names without letters. */
export function modulePrefix(moduleName: string): string {
  const letters = moduleName.replace(/[^a-z]/gi, "").toUpperCase();
  return (letters.slice(0, 3) || "TSK").padEnd(3, "X");
}

export function taskCode(moduleName: string, number: number | null | undefined): string | null {
  return number ? `${modulePrefix(moduleName)}-${number}` : null;
}
