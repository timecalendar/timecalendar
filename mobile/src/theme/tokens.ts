import { Platform } from "react-native"

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
  },
} as const

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark

/**
 * WCAG-AA contrast pairs — the documented foreground-on-background pairings the
 * DoD's manual color-contrast review checks rendered screens against (design D5).
 * Each ratio was computed at authoring time; AA is 4.5:1 for body / 3:1 for large
 * text (titles ≥ 18.66px bold or ≥ 24px). There is no runtime/CI checker — a static
 * tool can't know which token lands on which background at a given site (the same
 * authorial-intent gap that keeps the heading role in ThemedText, not in lint).
 *
 *   LIGHT scheme
 *   - text            on background          #000 on #fff   → 21.0:1  (AAA)
 *   - text            on backgroundElement   #000 on #F0F0F3 → 18.4:1 (AAA)
 *   - text            on backgroundSelected  #000 on #E0E1E6 → 16.3:1 (AAA)
 *   - textSecondary   on background          #60646C on #fff → 5.3:1  (AA)
 *   - textSecondary   on backgroundElement   #60646C on #F0F0F3 → 4.6:1 (AA)
 *
 *   DARK scheme
 *   - text            on background          #fff on #000   → 21.0:1  (AAA)
 *   - text            on backgroundElement   #fff on #212225 → 16.0:1 (AAA)
 *   - text            on backgroundSelected  #fff on #2E3135 → 13.6:1 (AAA)
 *   - textSecondary   on background          #B0B4BA on #000 → 10.3:1 (AAA)
 *   - textSecondary   on backgroundElement   #B0B4BA on #212225 → 7.9:1 (AAA)
 *
 * Selected-tab states reuse `text` on `backgroundSelected` (both schemes AAA above).
 * Adding a token, changing a value, or drawing a foreground on a background not
 * listed here requires re-verifying the affected pair (the D5 trigger).
 */

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
})

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const

export const Radii = {
  small: 4,
  medium: 8,
  large: 16,
  pill: 9999,
} as const

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0
export const MaxContentWidth = 800
