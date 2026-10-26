export function joinRowName(parts: readonly (string | undefined)[]): string {
  return parts.filter(Boolean).join(", ")
}
