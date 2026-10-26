import { SWATCH_PRESETS } from "@/features/personal-events/ui/color-swatch-presets"
import { contrastRatio } from "@/theme/contrast"

import {
  type EventAppearanceScheme,
  EventFallbackColor,
  resolveEventAppearance,
} from "./event-appearance"

const OPAQUE_HEX = /^#[0-9A-F]{6}$/
const CANVAS: Record<EventAppearanceScheme, string> = {
  light: "#FFFFFF",
  dark: "#000000",
}
const SCHEMES = ["light", "dark"] as const
const POLICIES = [
  { increasedContrast: false, policy: "normal" },
  { increasedContrast: true, policy: "increased contrast" },
] as const

const PALETTE = [...SWATCH_PRESETS, EventFallbackColor]
const STEPS = ["00", "33", "66", "99", "CC", "FF"]
const GRID = STEPS.flatMap((red) =>
  STEPS.flatMap((green) => STEPS.map((blue) => `#${red}${green}${blue}`)),
)

function cases(colors: readonly string[]) {
  return colors.flatMap((color) =>
    SCHEMES.flatMap((scheme) =>
      POLICIES.map(({ increasedContrast, policy }) => ({
        color,
        scheme,
        increasedContrast,
        policy,
      })),
    ),
  )
}

function expectFloors(
  color: string,
  scheme: EventAppearanceScheme,
  increasedContrast: boolean,
) {
  const appearance = resolveEventAppearance({
    color,
    scheme,
    increasedContrast,
  })
  for (const value of [
    appearance.source,
    appearance.surface,
    appearance.foreground,
    appearance.accent,
    appearance.outline,
  ]) {
    expect(value).toMatch(OPAQUE_HEX)
  }
  expect(
    contrastRatio(appearance.foreground, appearance.surface),
  ).toBeGreaterThanOrEqual(4.5)
  expect(
    contrastRatio(appearance.accent, CANVAS[scheme]),
  ).toBeGreaterThanOrEqual(3)
}

describe("event appearance", () => {
  it("normalizes source colors and resolves exact deterministic vectors", () => {
    expect(
      resolveEventAppearance({
        color: "#1e88e5",
        scheme: "light",
        increasedContrast: false,
      }),
    ).toEqual({
      source: "#1E88E5",
      surface: "#B0D5F6",
      foreground: "#000000",
      accent: "#1E88E5",
      outline: "#1E88E5",
      increasedContrast: false,
    })
  })

  it.each([
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#64748B",
    "bad",
  ])("keeps %s opaque and contrast-safe across policies", (color) => {
    for (const scheme of SCHEMES) {
      for (const { increasedContrast } of POLICIES) {
        expect(
          resolveEventAppearance({ color, scheme, increasedContrast }),
        ).toEqual(resolveEventAppearance({ color, scheme, increasedContrast }))
        expectFloors(color, scheme, increasedContrast)
      }
    }
  })

  it.each([undefined, "#fff", "#1E88E5CC", 42])(
    "resolves %p to the fallback appearance",
    (color) => {
      expect(
        resolveEventAppearance({
          color,
          scheme: "light",
          increasedContrast: false,
        }),
      ).toEqual(
        resolveEventAppearance({
          color: EventFallbackColor,
          scheme: "light",
          increasedContrast: false,
        }),
      )
    },
  )

  it("outlines in the foreground under increased contrast", () => {
    const appearance = resolveEventAppearance({
      color: "#E91E63",
      scheme: "dark",
      increasedContrast: true,
    })
    expect(appearance.outline).toBe(appearance.foreground)
    expect(appearance.increasedContrast).toBe(true)
  })

  it.each(cases(PALETTE))(
    "palette $color in $scheme ($policy) meets the tile floors",
    ({ color, scheme, increasedContrast }) => {
      expectFloors(color, scheme, increasedContrast)
    },
  )

  it.each(cases(GRID))(
    "grid $color in $scheme ($policy) meets the tile floors",
    ({ color, scheme, increasedContrast }) => {
      expectFloors(color, scheme, increasedContrast)
    },
  )
})
