import { Platform } from "react-native"

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    textTertiary: "#3C3C434D",
    primary: "#E91E63",
    primaryStrong: "#C2185B",
    actionText: "#C2185B",
    onPrimary: "#ffffff",
    primarySoft: "#E91E631F",
    destructive: "#B3261E",
    homeHero: "#FCE4EC",
    homeHeroDate: "#AD1457",
    logoSurface: "#ffffff",
    separator: "#C6C6C8",
    ripple: "#0000001F",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    textTertiary: "#EBEBF54D",
    primary: "#FF4081",
    primaryStrong: "#C2185B",
    actionText: "#FF4081",
    onPrimary: "#ffffff",
    primarySoft: "#FF40811F",
    destructive: "#FFB4AB",
    homeHero: "#321824",
    homeHeroDate: "#FF80AB",
    logoSurface: "#ffffff",
    separator: "#38383A",
    ripple: "#FFFFFF1F",
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
 *   HOME HERO
 *   - text on homeHero             #000 on #FCE4EC → 17.45:1 (light, AAA)
 *   - homeHeroDate on homeHero #AD1457 on #FCE4EC → 5.79:1 (light, AA)
 *   - text on homeHero             #fff on #321824 → 16.26:1 (dark, AAA)
 *   - homeHeroDate on homeHero #FF80AB on #321824 → 6.91:1 (dark, AA)
 *
 *   BRAND (pink) — `primary` is the Flutter brand hue, re-verified for this change.
 *   The brand has TWO usable tones; which one a site uses is the load-bearing rule:
 *   - `primary` light = #E91E63 (the Flutter `Colors.pink` identity tone) is an
 *     ACCENT / TINT only — a foreground accent or a large/UI element on `background`,
 *     NOT a fill carrying white body text:
 *       #E91E63 on background  #E91E63 on #fff → 4.35:1  (large/UI ✅ 3:1 bar; body ❌)
 *       white   on #E91E63                     → 4.35:1  (large/UI ✅; body ❌ < 4.5)
 *   - White text on a brand fill (a button label, a primary surface carrying text)
 *     MUST ride the darker shade700 `primaryStrong` #C2185B — the bright identity
 *     pink fails body AA. The fill carries `onPrimary` (#ffffff) as its label:
 *       onPrimary on primaryStrong  #fff on #C2185B → 5.87:1  (body ✅, both schemes)
 *       primaryStrong on background  #C2185B on #fff → 5.87:1  (light, UI ✅)
 *       primaryStrong on background  #C2185B on #000 → 3.58:1  (dark, large/UI ✅ 3:1)
 *   - `primary` dark = #FF4081 (the lighter pink accent) so the brand reads on the
 *     dark background (#C2185B on #000 is only 3.58:1 — large-only):
 *       #FF4081 on background  #FF4081 on #000 → 6.30:1  (body ✅)
 *   - `actionText` selects the AA body-text brand tone for each scheme:
 *       actionText on background #C2185B on #fff → 5.87:1  (light, body ✅)
 *       actionText on background #FF4081 on #000 → 6.30:1  (dark, body ✅)
 *
 *   DESTRUCTIVE
 *   - destructive light #B3261E on backgroundElement #F0F0F3 → 5.3:1 (UI ✅)
 *   - destructive dark #FFB4AB on backgroundElement #212225 → 9.1:1 (UI ✅)
 *
 * THE RULE (Settings inherits it): white text on brand rides `primaryStrong`
 * #C2185B (the filled-button pair `onPrimary` on `primaryStrong` = 5.87:1, AA body,
 * scheme-independent — the fill carries its own white label, so one value serves both
 * schemes); the identity pink `#E91E63` is accent/tint (light) and `#FF4081` is the
 * dark-scheme brand accent. The `primaryStrong`/`onPrimary` token pair was added for
 * the onboarding welcome CTA — the first white-text-on-brand consumer (R-2: earned,
 * not speculative). The fill-vs-background bar a filled brand button must clear is the
 * 3:1 UI-component ratio (WCAG 1.4.11), met in both schemes above.
 *
 * `logoSurface` (#ffffff, both schemes) is the chip behind third-party school
 * logos — the artwork is drawn for white paper, so the surface stays white even
 * in dark (like white podcast/album art tiles). It carries no text; the only
 * contrast obligation is chip-vs-background in dark (#fff on #000, 21:1).
 *
 * NON-TEXT / DECORATIVE UI tones (none carries body text; where a ratio applies
 * it is the WCAG 1.4.11 3:1 UI-component bar or an exemption, stated per token):
 * - `separator` — hairline list separators + the logo-chip stroke; matches the
 *   platform separator (UIKit .separator flattened: light #C6C6C8, dark #38383A).
 *   Decorative redundancy (rows are separated by layout), exempt from 3:1.
 * - `textTertiary` — the iOS disclosure-indicator tint (UIKit .tertiaryLabel:
 *   rgba(60,60,67,.3) / rgba(235,235,245,.3)). The chevron is a redundant
 *   affordance (the whole row is the accessible button), exempt from 3:1.
 * - `primarySoft` — the brand wash behind a logo-fallback monogram (`primary`
 *   at 12% alpha, precomputed — token math stays out of call sites). The
 *   monogram letter rides `primary` over it; the letter is a decorative image
 *   stand-in (the row label carries the accessible name), so no text ratio
 *   applies — for reference the pair reads at effectively primary-on-
 *   background: 4.35:1 light / 6.30:1 dark.
 * - `ripple` — the Android pressed-state layer (on-surface at 12%, M3 States).
 *   A transient overlay, no contrast obligation.
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
