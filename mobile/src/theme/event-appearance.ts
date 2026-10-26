import { contrastRatio } from "@/theme/contrast"

export const EventFallbackColor = "#64748B"

export type EventAppearanceScheme = "light" | "dark"

export interface EventAppearance {
  source: string
  surface: string
  foreground: string
  accent: string
  outline: string
  increasedContrast: boolean
}

type Rgb = readonly [number, number, number]

const BLACK: Rgb = [0, 0, 0]
const WHITE: Rgb = [255, 255, 255]

function parseOpaqueHex(value: unknown): Rgb | undefined {
  if (typeof value !== "string" || !/^#[0-9A-F]{6}$/i.test(value))
    return undefined
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

const FALLBACK_RGB = parseOpaqueHex(EventFallbackColor)!

function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

function compositeRgb(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return foreground.map((channel, index) =>
    Math.round(channel * alpha + background[index]! * (1 - alpha)),
  ) as unknown as Rgb
}

function rgbContrast(left: Rgb, right: Rgb): number {
  return contrastRatio(rgbToHex(left), rgbToHex(right))
}

function contrastingEndpoint(background: Rgb): Rgb {
  return rgbContrast(BLACK, background) >= rgbContrast(WHITE, background)
    ? BLACK
    : WHITE
}

function boundaryAccent(source: Rgb, canvas: Rgb, foreground: Rgb): Rgb {
  let accent = source
  for (
    let step = 5;
    rgbContrast(accent, canvas) < 3 && step <= 100;
    step += 5
  ) {
    accent = compositeRgb(foreground, source, step / 100)
  }
  return accent
}

export function resolveEventAppearance(input: {
  color: unknown
  scheme: EventAppearanceScheme
  increasedContrast: boolean
}): Readonly<EventAppearance> {
  const source = parseOpaqueHex(input.color) ?? FALLBACK_RGB
  const canvas = input.scheme === "dark" ? BLACK : WHITE
  const surface = compositeRgb(
    source,
    canvas,
    input.increasedContrast ? 0.2 : 0.35,
  )
  const foreground = contrastingEndpoint(surface)
  const accent = boundaryAccent(source, canvas, foreground)
  return Object.freeze({
    source: rgbToHex(source),
    surface: rgbToHex(surface),
    foreground: rgbToHex(foreground),
    accent: rgbToHex(accent),
    outline: rgbToHex(input.increasedContrast ? foreground : accent),
    increasedContrast: input.increasedContrast,
  })
}
