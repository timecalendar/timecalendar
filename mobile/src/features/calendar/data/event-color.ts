import { CALENDAR_EVENT_FALLBACK_COLOR } from "./types"

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

export function parseOpaqueHex(value: unknown): Rgb | undefined {
  if (typeof value !== "string" || !/^#[0-9A-F]{6}$/i.test(value))
    return undefined
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

export function compositeRgb(
  foreground: Rgb,
  background: Rgb,
  alpha: number,
): Rgb {
  return foreground.map((channel, index) =>
    Math.round(channel * alpha + background[index]! * (1 - alpha)),
  ) as unknown as Rgb
}

function linearChannel(channel: number): number {
  const value = channel / 255
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(rgb: Rgb): number {
  return (
    0.2126 * linearChannel(rgb[0]) +
    0.7152 * linearChannel(rgb[1]) +
    0.0722 * linearChannel(rgb[2])
  )
}

export function contrastRatio(left: Rgb, right: Rgb): number {
  const brighter = Math.max(relativeLuminance(left), relativeLuminance(right))
  const darker = Math.min(relativeLuminance(left), relativeLuminance(right))
  return (brighter + 0.05) / (darker + 0.05)
}

function contrastingEndpoint(background: Rgb): Rgb {
  return contrastRatio(BLACK, background) >= contrastRatio(WHITE, background)
    ? BLACK
    : WHITE
}

function boundaryAccent(source: Rgb, canvas: Rgb, foreground: Rgb): Rgb {
  if (contrastRatio(source, canvas) >= 3) return source
  for (let step = 5; step <= 100; step += 5) {
    const mixed = compositeRgb(foreground, source, step / 100)
    if (contrastRatio(mixed, canvas) >= 3) return mixed
  }
  return foreground
}

export function resolveEventAppearance(input: {
  color: unknown
  scheme: EventAppearanceScheme
  increasedContrast: boolean
}): Readonly<EventAppearance> {
  const source =
    parseOpaqueHex(input.color) ??
    parseOpaqueHex(CALENDAR_EVENT_FALLBACK_COLOR)!
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

/** Retained Home surface helper; owned Timeline consumes the full appearance. */
export function eventSurfaceColor(color: string): string {
  return resolveEventAppearance({
    color,
    scheme: "light",
    increasedContrast: false,
  }).surface
}
