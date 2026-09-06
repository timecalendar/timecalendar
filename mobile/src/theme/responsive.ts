import { MaxContentWidth, Spacing } from "@/theme/tokens"

export const ResponsiveBreakpoints = {
  tablet: 600,
  optionalColumns: 834,
} as const

export const ResponsiveContentWidths = {
  readable: 640,
  standard: MaxContentWidth,
} as const

export type ResponsiveSizeClass = "compact" | "tablet"
export type ResponsiveLane = "readable" | "standard" | "fullBleed"

export type ResponsiveLayoutMetrics = {
  lane: ResponsiveLane
  ownerWidth: number
  isMeasured: boolean
  sizeClass: ResponsiveSizeClass
  gutter: number
  contentWidth: number
  outerInset: number
  maxContentWidth: number | null
  isColumnEligible: boolean
}

export function resolveResponsiveLayout(
  ownerWidth: number,
  lane: ResponsiveLane,
): ResponsiveLayoutMetrics {
  const normalizedWidth =
    Number.isFinite(ownerWidth) && ownerWidth > 0 ? ownerWidth : 0
  const isMeasured = normalizedWidth > 0
  const sizeClass =
    isMeasured && normalizedWidth >= ResponsiveBreakpoints.tablet
      ? "tablet"
      : "compact"
  const isColumnEligible =
    isMeasured && normalizedWidth >= ResponsiveBreakpoints.optionalColumns

  if (lane === "fullBleed") {
    return {
      lane,
      ownerWidth: normalizedWidth,
      isMeasured,
      sizeClass,
      gutter: 0,
      contentWidth: normalizedWidth,
      outerInset: 0,
      maxContentWidth: null,
      isColumnEligible,
    }
  }

  const gutter = sizeClass === "tablet" ? Spacing.six : Spacing.four
  const maxContentWidth = ResponsiveContentWidths[lane]
  const contentWidth = Math.min(
    Math.max(normalizedWidth - 2 * gutter, 0),
    maxContentWidth,
  )

  return {
    lane,
    ownerWidth: normalizedWidth,
    isMeasured,
    sizeClass,
    gutter,
    contentWidth,
    outerInset: (normalizedWidth - contentWidth) / 2,
    maxContentWidth,
    isColumnEligible,
  }
}
