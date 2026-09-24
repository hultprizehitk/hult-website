export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export function optionLetter(index: number): string {
  return OPTION_LETTERS[index] ?? "?";
}

export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
