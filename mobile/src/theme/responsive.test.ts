import {
  resolveResponsiveLayout,
  ResponsiveBreakpoints,
  ResponsiveContentWidths,
  type ResponsiveLane,
} from "@/theme/responsive"
import { MaxContentWidth, Spacing } from "@/theme/tokens"

type ExpectedCappedMetrics = {
  width: number
  sizeClass: "compact" | "tablet"
  gutter: number
  readableWidth: number
  readableInset: number
  standardWidth: number
  standardInset: number
  isColumnEligible: boolean
}

const cappedCases: ExpectedCappedMetrics[] = [
  {
    width: 390,
    sizeClass: "compact",
    gutter: Spacing.four,
    readableWidth: 342,
    readableInset: 24,
    standardWidth: 342,
    standardInset: 24,
    isColumnEligible: false,
  },
  {
    width: 599,
    sizeClass: "compact",
    gutter: Spacing.four,
    readableWidth: 551,
    readableInset: 24,
    standardWidth: 551,
    standardInset: 24,
    isColumnEligible: false,
  },
  {
    width: 600,
    sizeClass: "tablet",
    gutter: Spacing.six,
    readableWidth: 472,
    readableInset: 64,
    standardWidth: 472,
    standardInset: 64,
    isColumnEligible: false,
  },
  {
    width: 768,
    sizeClass: "tablet",
    gutter: Spacing.six,
    readableWidth: 640,
    readableInset: 64,
    standardWidth: 640,
    standardInset: 64,
    isColumnEligible: false,
  },
  {
    width: 800,
    sizeClass: "tablet",
    gutter: Spacing.six,
    readableWidth: 640,
    readableInset: 80,
    standardWidth: 672,
    standardInset: 64,
    isColumnEligible: false,
  },
  {
    width: 834,
    sizeClass: "tablet",
    gutter: Spacing.six,
    readableWidth: 640,
    readableInset: 97,
    standardWidth: 706,
    standardInset: 64,
    isColumnEligible: true,
  },
  {
    width: 1024,
    sizeClass: "tablet",
    gutter: Spacing.six,
    readableWidth: 640,
    readableInset: 192,
    standardWidth: 800,
    standardInset: 112,
    isColumnEligible: true,
  },
]

describe("resolveResponsiveLayout", () => {
  it.each(cappedCases)(
    "resolves capped lanes at $width points",
    ({
      width,
      sizeClass,
      gutter,
      readableWidth,
      readableInset,
      standardWidth,
      standardInset,
      isColumnEligible,
    }) => {
      expect(resolveResponsiveLayout(width, "readable")).toEqual({
        lane: "readable",
        ownerWidth: width,
        isMeasured: true,
        sizeClass,
        gutter,
        contentWidth: readableWidth,
        outerInset: readableInset,
        maxContentWidth: ResponsiveContentWidths.readable,
        isColumnEligible,
      })
      expect(resolveResponsiveLayout(width, "standard")).toEqual({
        lane: "standard",
        ownerWidth: width,
        isMeasured: true,
        sizeClass,
        gutter,
        contentWidth: standardWidth,
        outerInset: standardInset,
        maxContentWidth: ResponsiveContentWidths.standard,
        isColumnEligible,
      })
    },
  )

  it.each(cappedCases)("keeps full bleed at $width points", ({ width }) => {
    const expectedClass =
      width >= ResponsiveBreakpoints.tablet ? "tablet" : "compact"
    expect(resolveResponsiveLayout(width, "fullBleed")).toEqual({
      lane: "fullBleed",
      ownerWidth: width,
      isMeasured: true,
      sizeClass: expectedClass,
      gutter: 0,
      contentWidth: width,
      outerInset: 0,
      maxContentWidth: null,
      isColumnEligible: width >= ResponsiveBreakpoints.optionalColumns,
    })
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "keeps %s in the compact unmeasured state",
    (width) => {
      const lane: ResponsiveLane = "readable"
      expect(resolveResponsiveLayout(width, lane)).toEqual({
        lane,
        ownerWidth: 0,
        isMeasured: false,
        sizeClass: "compact",
        gutter: Spacing.four,
        contentWidth: 0,
        outerInset: 0,
        maxContentWidth: ResponsiveContentWidths.readable,
        isColumnEligible: false,
      })
    },
  )

  it("keeps the standard cap compatible with MaxContentWidth", () => {
    expect(ResponsiveContentWidths.standard).toBe(MaxContentWidth)
  })
})
