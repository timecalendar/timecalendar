import { render, renderHook } from "@testing-library/react-native"
import { Text } from "react-native"

import { GlassSurface } from "@/components/chrome"
import {
  buildNavTheme,
  ChevronMaxFontScale,
  Colors,
  Elevation,
  IconSize,
  Layout,
  Motion,
  Spacing,
  StateOpacity,
  type ThemeColor,
  useTheme,
  WordmarkMaxFontScale,
} from "@/theme"

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
})

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

function contrastRatio(foreground: string, background: string) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

type Floor = "body" | "ui"
type Pair = [foreground: ThemeColor, background: ThemeColor, floor: Floor]

const bothSchemes: Pair[] = [
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
  ["error", "background", "body"],
  ["error", "backgroundElement", "body"],
  ["destructive", "backgroundElement", "ui"],
  ["positive", "background", "body"],
  ["positive", "backgroundElement", "body"],
  ["informational", "background", "body"],
  ["informational", "backgroundElement", "body"],
  ["outline", "background", "ui"],
  ["outline", "backgroundElement", "ui"],
  ["outline", "backgroundSelected", "ui"],
]

const perScheme: Record<keyof typeof Colors, Pair[]> = {
  light: [
    ["primary", "background", "ui"],
    ["onPrimary", "primary", "ui"],
  ],
  dark: [
    ["primary", "background", "body"],
    ["logoSurface", "background", "ui"],
  ],
}

const documentedPairs = (["light", "dark"] as const).flatMap((scheme) =>
  [...bothSchemes, ...perScheme[scheme]].map(
    ([foreground, background, floor]) => ({
      scheme,
      foreground,
      background,
      floor,
    }),
  ),
)

const floorRatio = { body: 4.5, ui: 3 } as const

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

describe.each(documentedPairs)(
  "$scheme $foreground on $background",
  ({ scheme, foreground, background, floor }) => {
    it(`clears the ${floor} contrast floor`, () => {
      expect(
        contrastRatio(Colors[scheme][foreground], Colors[scheme][background]),
      ).toBeGreaterThanOrEqual(floorRatio[floor])
    })
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
