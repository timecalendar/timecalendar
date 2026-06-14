import { Platform } from "react-native"

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    primary: "#E91E63",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    primary: "#FF4081",
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
 *   BRAND (pink) — `primary` is the Flutter brand hue, re-verified for this change.
 *   The brand has TWO usable tones; which one a site uses is the load-bearing rule:
 *   - `primary` light = #E91E63 (the Flutter `Colors.pink` identity tone) is an
 *     ACCENT / TINT only — a foreground accent or a large/UI element on `background`,
 *     NOT a fill carrying white body text:
 *       #E91E63 on background  #E91E63 on #fff → 4.35:1  (large/UI ✅ 3:1 bar; body ❌)
 *       white   on #E91E63                     → 4.35:1  (large/UI ✅; body ❌ < 4.5)
 *   - White text on a brand fill (a button label, a primary surface carrying text)
 *     MUST ride the darker shade700 #C2185B — the bright identity pink fails body AA:
 *       white   on #C2185B                     → 5.87:1  (body ✅)
 *   - `primary` dark = #FF4081 (the lighter pink accent) so the brand reads on the
 *     dark background (#C2185B on #000 is only 3.58:1 — large-only):
 *       #FF4081 on background  #FF4081 on #000 → 6.30:1  (body ✅)
 *
 * THE RULE (Settings inherits it): white text on brand rides `#C2185B`; the identity
 * pink `#E91E63` is accent/tint (light) and `#FF4081` is the dark-scheme brand. No
 * `primaryStrong`/button token is added until the first white-text-on-brand consumer
 * exists (R-2) — this block records which tone that consumer must use.
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

export const MaxContentWidth = 800
