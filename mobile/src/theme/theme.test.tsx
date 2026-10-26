import { render, renderHook } from "@testing-library/react-native"
import { Text } from "react-native"

import { GlassSurface } from "@/components/chrome"
import {
  buildNavTheme,
  ChevronMaxFontScale,
  ColorDotSize,
  Colors,
  Elevation,
  IconSize,
  Layout,
  ListGeometry,
  Motion,
  Spacing,
  StateOpacity,
  useTheme,
  WordmarkMaxFontScale,
} from "@/theme"
import {
  composite,
  contrastFloorRatio,
  contrastRatio,
  documentedContrastPairs,
  pairRatio,
} from "@/theme/contrast"

// Drive the device color scheme the token layer resolves through.
const mockUseColorScheme = jest.fn()
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}))

// Proof (mirrors the i18n/a11y/firebase proof tests, gated by test-mobile):
// (a) a token resolves to its light value under light and its dark value under
// dark — light/dark resolution end to end, not merely that the constants exist;
// (b) GlassSurface renders its children in Jest, where no native glass exists,
// so this exercises the fallback path (degrades to a real View, not a throw).
describe("theme", () => {
  it("resolves a token to its light value under a light scheme", async () => {
    mockUseColorScheme.mockReturnValue("light")

    const { result } = await renderHook(() => useTheme())

    expect(result.current.background).toBe(Colors.light.background)
    expect(result.current.text).toBe(Colors.light.text)
  })

  it("resolves a token to its dark value under a dark scheme", async () => {
    mockUseColorScheme.mockReturnValue("dark")

    const { result } = await renderHook(() => useTheme())

    expect(result.current.background).toBe(Colors.dark.background)
    expect(result.current.text).toBe(Colors.dark.text)
  })

  it("resolves the light tokens when the scheme is unspecified", async () => {
    // The C1 seam returns ColorSchemeName, which includes "unspecified"
    // (no device preference); useTheme maps it to light (use-theme.ts line 11).
    mockUseColorScheme.mockReturnValue("unspecified")

    const { result } = await renderHook(() => useTheme())

    expect(result.current.background).toBe(Colors.light.background)
    expect(result.current.text).toBe(Colors.light.text)
  })

  it("resolves the brand primary token per scheme", async () => {
    mockUseColorScheme.mockReturnValue("light")
    const light = await renderHook(() => useTheme())
    expect(light.result.current.primary).toBe(Colors.light.primary)

    mockUseColorScheme.mockReturnValue("dark")
    const dark = await renderHook(() => useTheme())
    expect(dark.result.current.primary).toBe(Colors.dark.primary)
  })

  it("resolves the semantic status tokens per scheme", async () => {
    mockUseColorScheme.mockReturnValue("light")
    const light = await renderHook(() => useTheme())
    expect(light.result.current.positive).toBe("#146C43")
    expect(light.result.current.informational).toBe("#0B57D0")

    mockUseColorScheme.mockReturnValue("dark")
    const dark = await renderHook(() => useTheme())
    expect(dark.result.current.positive).toBe("#7EE2A8")
    expect(dark.result.current.informational).toBe("#A8C7FA")
  })

  it("resolves the outline and scrim roles per scheme", async () => {
    mockUseColorScheme.mockReturnValue("light")
    const light = await renderHook(() => useTheme())
    expect(light.result.current.outline).toBe("#7C7F87")
    expect(light.result.current.scrim).toBe("#00000066")

    mockUseColorScheme.mockReturnValue("dark")
    const dark = await renderHook(() => useTheme())
    expect(dark.result.current.outline).toBe("#80838D")
    expect(dark.result.current.scrim).toBe("#00000099")
  })

  it("resolves the brand-wash label role per scheme", async () => {
    mockUseColorScheme.mockReturnValue("light")
    const light = await renderHook(() => useTheme())
    expect(light.result.current.onPrimarySoft).toBe("#AD1457")

    mockUseColorScheme.mockReturnValue("dark")
    const dark = await renderHook(() => useTheme())
    expect(dark.result.current.onPrimarySoft).toBe("#FF80AB")
  })
})

describe("contrastRatio", () => {
  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2)
    expect(
      contrastRatio(Colors.light.onPrimary, Colors.light.primaryStrong),
    ).toBeCloseTo(5.87, 2)
    expect(
      contrastRatio(Colors.light.primary, Colors.light.background),
    ).toBeCloseTo(4.35, 2)
  })

  it("refuses a translucent token", () => {
    expect(() =>
      contrastRatio(Colors.light.scrim, Colors.light.background),
    ).toThrow("opaque 6-digit hex")
  })
})

describe("composite", () => {
  it("returns an opaque fill unchanged", () => {
    expect(composite("#AD1457", "#ffffff")).toBe("#ad1457")
  })

  it("returns the surface under a fully transparent fill", () => {
    expect(composite("#E91E6300", "#F0F0F3")).toBe("#f0f0f3")
  })

  it("returns the fill under a fully opaque alpha", () => {
    expect(composite("#E91E63FF", "#000000")).toBe("#e91e63")
  })

  it("blends the brand wash over white", () => {
    expect(composite("#E91E631F", "#ffffff")).toBe("#fce4ec")
  })

  it("refuses a malformed fill or a translucent surface", () => {
    expect(() => composite("pink", "#ffffff")).toThrow("6- or 8-digit hex")
    expect(() => composite("#E91E63", "#00000066")).toThrow("opaque")
  })

  it("refuses a translucent background with no surface", () => {
    expect(() =>
      pairRatio({
        scheme: "light",
        foreground: "onPrimarySoft",
        background: "primarySoft",
        floor: "body",
      }),
    ).toThrow("opaque 6-digit hex")
  })
})

describe.each(
  documentedContrastPairs.map((pair) => ({
    ...pair,
    surface: pair.over === undefined ? "" : ` over ${pair.over}`,
  })),
)("$scheme $foreground on $background$surface", (pair) => {
  it(`clears the ${pair.floor} contrast floor`, () => {
    expect(pairRatio(pair)).toBeGreaterThanOrEqual(
      contrastFloorRatio[pair.floor],
    )
  })
})

it.each([
  ["light", "background", 5.79],
  ["light", "backgroundElement", 5.1],
  ["light", "homeHero", 4.88],
  ["dark", "background", 8.11],
  ["dark", "backgroundElement", 5.9],
  ["dark", "homeHero", 5.89],
] as const)(
  "computes %s onPrimarySoft on primarySoft over %s at %d:1",
  (scheme, over, ratio) => {
    expect(
      pairRatio({
        scheme,
        foreground: "onPrimarySoft",
        background: "primarySoft",
        floor: "body",
        over,
      }),
    ).toBeCloseTo(ratio, 2)
  },
)

describe("design tokens", () => {
  it("exposes the spacing scale", () => {
    expect(Spacing).toEqual({
      half: 2,
      one: 4,
      two: 8,
      twoHalf: 12,
      three: 16,
      four: 24,
      five: 32,
      fiveHalf: 48,
      six: 64,
    })
  })

  it("exposes the icon, state, motion and layout scales", () => {
    expect(IconSize).toEqual({ small: 14, medium: 17, large: 22, xlarge: 28 })
    expect(ColorDotSize).toEqual({ small: 8, medium: 12, large: 16 })
    expect(StateOpacity).toEqual({ pressed: 0.65, disabled: 0.55 })
    expect(Motion).toEqual({ fast: 150, base: 250, slow: 400 })
    expect(Layout.fabClearance).toBe(96)
    expect(WordmarkMaxFontScale).toBe(1.5)
    expect(ChevronMaxFontScale).toBe(2)
  })

  it("gives each scheme its own raised boxShadow", () => {
    expect(Elevation.raised.light).not.toBe(Elevation.raised.dark)
    for (const shadow of Object.values(Elevation.raised)) {
      expect(shadow).toMatch(/^0 2px 6px rgba\(0,0,0,0\.\d+\)$/)
    }
  })

  it.each([
    ["ios", 44],
    ["android", 48],
  ] as const)("resolves MinTouchTarget on %s to %d", (os, expected) => {
    jest.isolateModules(() => {
      jest.doMock("react-native/Libraries/Utilities/Platform", () =>
        jest.requireActual(`react-native/Libraries/Utilities/Platform.${os}`),
      )
      try {
        const tokens =
          jest.requireActual<typeof import("@/theme/tokens")>("@/theme/tokens")
        expect(tokens.MinTouchTarget).toBe(expected)
      } finally {
        jest.dontMock("react-native/Libraries/Utilities/Platform")
      }
    })
  })

  it("leaves Platform un-mocked for the rest of the file", () => {
    jest.isolateModules(() => {
      const { Platform } =
        jest.requireActual<typeof import("react-native")>("react-native")
      expect(Platform.OS).toBe("ios")
    })
  })
})

// The nav↔token contract (design D4): the React Navigation theme the layout
// feeds ThemeProvider draws its surfaces and active tint from @/theme tokens, so
// nav chrome can't drift from the palette. Asserts the mapping, not a tautology
// over constants — buildNavTheme reads tokens and the test reads tokens, but the
// assertion proves the builder wires background/primary to the scheme-correct token.
describe("buildNavTheme", () => {
  it("maps background and primary to the light tokens under light", () => {
    const theme = buildNavTheme("light")

    expect(theme.colors.background).toBe(Colors.light.background)
    expect(theme.colors.primary).toBe(Colors.light.primary)
  })

  it("maps background and primary to the dark tokens under dark", () => {
    const theme = buildNavTheme("dark")

    expect(theme.colors.background).toBe(Colors.dark.background)
    expect(theme.colors.primary).toBe(Colors.dark.primary)
  })
})

describe("GlassSurface", () => {
  it("renders its children on the fallback path (no native glass in Jest)", async () => {
    const { getByText } = await render(
      <GlassSurface>
        <Text>under glass</Text>
      </GlassSurface>,
    )

    expect(getByText("under glass")).toBeTruthy()
  })
})

describe("ListGeometry", () => {
  it("pins the list geometry shared by the native seam and the design rows", () => {
    expect(ListGeometry).toEqual({
      rowPaddingHorizontal: 16,
      leadingGap: 16,
      headerIcon: 88,
      ios: {
        rowMinHeight: 44,
        rowPaddingVertical: 12,
        leadingIconTile: 29,
        leadingIconTileRadius: 7,
        headerIconRadius: 20,
        trailingGap: 8,
        groupedRadius: { glass: 26, legacy: 10 },
      },
      android: {
        rowMinHeight: 56,
        rowPaddingVertical: 8,
        leadingIcon: 24,
        trailingGap: 16,
        outerRadius: 20,
        innerRadius: 4,
        segmentGap: 2,
        listInset: 16,
      },
    })
    expect(ListGeometry.ios.groupedRadius).toEqual({ glass: 26, legacy: 10 })
  })
})
