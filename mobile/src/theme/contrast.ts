import { Colors, type ThemeColor } from "@/theme/tokens"

export type ContrastFloor = "body" | "ui"

export type ContrastScheme = keyof typeof Colors

export type ContrastPair = {
  scheme: ContrastScheme
  foreground: ThemeColor
  background: ThemeColor
  floor: ContrastFloor
}

type PairRow = [
  foreground: ThemeColor,
  background: ThemeColor,
  floor: ContrastFloor,
]

export const contrastFloorRatio: Record<ContrastFloor, number> = {
  body: 4.5,
  ui: 3,
}

function relativeLuminance(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`contrastRatio needs an opaque 6-digit hex, got ${hex}`)
  }
  const linear = (offset: number) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(1) + 0.7152 * linear(3) + 0.0722 * linear(5)
}

export function contrastRatio(foreground: string, background: string) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const bothSchemes: PairRow[] = [
  ["text", "background", "body"],
  ["text", "backgroundElement", "body"],
  ["text", "backgroundSelected", "body"],
  ["textSecondary", "background", "body"],
  ["textSecondary", "backgroundElement", "body"],
  ["text", "homeHero", "body"],
  ["homeHeroDate", "homeHero", "body"],
  ["onPrimary", "primaryStrong", "body"],
  ["primaryStrong", "background", "ui"],
  ["actionText", "background", "body"],
  ["actionText", "backgroundElement", "body"],
  ["error", "background", "body"],
  ["error", "backgroundElement", "body"],
  ["destructive", "backgroundElement", "body"],
  ["positive", "background", "body"],
  ["positive", "backgroundElement", "body"],
  ["informational", "background", "body"],
  ["informational", "backgroundElement", "body"],
  ["outline", "background", "ui"],
  ["outline", "backgroundElement", "ui"],
  ["outline", "backgroundSelected", "ui"],
]

const perScheme: Record<ContrastScheme, PairRow[]> = {
  light: [
    ["primary", "background", "ui"],
    ["onPrimary", "primary", "ui"],
  ],
  dark: [
    ["primary", "background", "body"],
    ["logoSurface", "background", "ui"],
  ],
}

export const documentedContrastPairs: readonly ContrastPair[] = (
  ["light", "dark"] as const
).flatMap((scheme) =>
  [...bothSchemes, ...perScheme[scheme]].map(
    ([foreground, background, floor]) => ({
      scheme,
      foreground,
      background,
      floor,
    }),
  ),
)
