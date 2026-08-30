// This pure rule lives in data/ so Settings can consume it without importing an
// Activity screen module, and so the 90% logic coverage gate proves the cap.
export function formatUnreadBadge(count: number): string | null {
  if (count < 1) return null
  return count > 99 ? "99+" : String(count)
}
