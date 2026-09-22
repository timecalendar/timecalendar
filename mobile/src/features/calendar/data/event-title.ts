export function displayEventTitle(
  title: string | undefined,
  localizedFallback: string,
): string {
  const normalized = title?.trim()
  return normalized === undefined || normalized.length === 0
    ? localizedFallback
    : normalized
}
