import { Colors, type ThemeColor } from "@/theme/tokens"

export type ContrastFloor = "body" | "ui"

export type ContrastScheme = keyof typeof Colors

export type ContrastPair = {
  scheme: ContrastScheme
  foreground: ThemeColor
  background: ThemeColor
  floor: ContrastFloor
  over?: ThemeColor
}

type PairRow =
  | [foreground: ThemeColor, background: ThemeColor, floor: ContrastFloor]
  | [
      foreground: ThemeColor,
      background: ThemeColor,
      floor: ContrastFloor,
      over: ThemeColor,
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

const channel = (hex: string, offset: number) =>
  parseInt(hex.slice(offset, offset + 2), 16)

export function composite(fill: string, over: string): string {
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(fill)) {
    throw new Error(`composite needs a 6- or 8-digit hex fill, got ${fill}`)
  }
  if (!/^#[0-9a-f]{6}$/i.test(over)) {
    throw new Error(
      `composite needs an opaque 6-digit hex surface, got ${over}`,
    )
  }
  const alpha = fill.length === 9 ? channel(fill, 7) / 255 : 1
  return `#${[1, 3, 5]
    .map((offset) =>
      Math.round(
        channel(fill, offset) * alpha + channel(over, offset) * (1 - alpha),
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`
}

export function pairBackground(pair: ContrastPair): string {
  const background = Colors[pair.scheme][pair.background]
  return pair.over === undefined
    ? background
    : composite(background, Colors[pair.scheme][pair.over])
}

export function pairRatio(pair: ContrastPair): number {
  return contrastRatio(
    Colors[pair.scheme][pair.foreground],
    pairBackground(pair),
  )
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
  ["destructive", "background", "body"],
  ["destructive", "backgroundElement", "body"],
  ["onPrimarySoft", "primarySoft", "body", "background"],
  ["onPrimarySoft", "primarySoft", "body", "backgroundElement"],
  ["onPrimarySoft", "primarySoft", "body", "homeHero"],
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
    ([foreground, background, floor, over]) => ({
      scheme,
      foreground,
      background,
      floor,
      ...(over === undefined ? {} : { over }),
    }),
  ),
)
