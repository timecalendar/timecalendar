import { ThemedText, type ThemedTextProps } from "./themed-text"

// The one rendering of the shared write-failure contract. Every write-capable
// feature (personal events, hidden events, event checklists, QR/iCal import)
// drives a `failed` flag from `useRecordedAction` and announces it the same way:
// a `textSecondary` line that is a POLITE live region (does not interrupt) AND an
// `alert` role (assistive tech reads it when it appears). Extracted so that
// accessible contract lives in exactly one place, not copy-pasted per screen.
export function WriteErrorNotice({
  message,
  type = "default",
  style,
}: {
  message: string
  /** Optional text scale (e.g. `"small"` inside a dense section). */
  type?: ThemedTextProps["type"]
  /** Optional layout override (spacing to the surrounding content). */
  style?: ThemedTextProps["style"]
}) {
  return (
    <ThemedText
      themeColor="textSecondary"
      type={type}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={style}
    >
      {message}
    </ThemedText>
  )
}
