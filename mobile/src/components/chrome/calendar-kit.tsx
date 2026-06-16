import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type DeepPartial,
  type EventItem,
  type ThemeConfigs,
} from "@howljs/calendar-kit"

import { type ThemeColor } from "@/theme"

// The single import site for `@howljs/calendar-kit` (the day/week timeline
// renderer adopted by ADR 019). The chrome-boundary lint rule
// (eslint.config.js) forbids importing `@howljs/calendar-kit` (+ subpaths)
// anywhere outside src/components/chrome/, so a future fork/custom swap (ADR
// 019's revisit) is localized to THIS file behind the stable wrapper API.
// Feature/route code imports `@/components/chrome`, never the library (ADR 020).
//
// Unlike the other chrome wrappers, calendar-kit is NOT an alpha API — it is a
// stable GA-ish dep wrapped for SWAP-REVERSIBILITY (ADR 020), not alpha churn:
// it is on the #1-risk surface and a single maintainer, so the lint-enforced
// single import site is what makes "fork or swap to custom behind the unchanged
// seam" cheap. The seam re-exports the surface the screen needs under a stable
// local API and owns the theme-from-@/theme-tokens mapping helper.
//
// The wrapper stays THIN (R-2): no higher-level composed calendar from a sample
// of one consumer — re-export the container/header/body the screen composes and
// the buildCalendarTheme helper, nothing more.

export { CalendarBody, CalendarContainer, CalendarHeader }
export type { EventItem }

// The `theme` object calendar-kit consumes, built from @/theme tokens so the
// grid/header/now-indicator can't drift from the brand palette (R-3 — the
// timeline is a designed brand surface). The now-indicator rides the brand
// `primary` token. Pass the resolved theme tokens (from useTheme()) in; this
// helper owns the token→calendar-kit-theme shape mapping so the screen stays
// presentational.
export function buildCalendarTheme(
  theme: Record<ThemeColor, string>,
): DeepPartial<ThemeConfigs> {
  return {
    colors: {
      primary: theme.primary,
      onPrimary: theme.background,
      background: theme.background,
      onBackground: theme.text,
      border: theme.backgroundSelected,
      text: theme.text,
      surface: theme.backgroundElement,
      onSurface: theme.textSecondary,
    },
    hourTextStyle: { color: theme.textSecondary },
    nowIndicatorColor: theme.primary,
  }
}
