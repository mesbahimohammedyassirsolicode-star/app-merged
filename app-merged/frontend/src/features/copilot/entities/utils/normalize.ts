/** Deterministic normalization for label/code comparison (no locale-specific fuzzy matching). */
export function normalizeLabel(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}
