import {
  contrastRatio,
  eventSurfaceColor,
  parseOpaqueHex,
  resolveEventAppearance,
} from "./event-color"

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
    expect(eventSurfaceColor("invalid")).toBe("#C0C7CD")
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
    for (const scheme of ["light", "dark"] as const) {
      for (const increasedContrast of [false, true]) {
        const first = resolveEventAppearance({
          color,
          scheme,
          increasedContrast,
        })
        const second = resolveEventAppearance({
          color,
          scheme,
          increasedContrast,
        })
        expect(first).toEqual(second)
        for (const value of Object.values(first).filter(
          (entry): entry is string => typeof entry === "string",
        )) {
          expect(value).toMatch(/^#[0-9A-F]{6}$/)
        }
        expect(
          contrastRatio(
            parseOpaqueHex(first.foreground)!,
            parseOpaqueHex(first.surface)!,
          ),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(
            parseOpaqueHex(first.accent)!,
            parseOpaqueHex(scheme === "light" ? "#FFFFFF" : "#000000")!,
          ),
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it("rejects non-six-digit input and covers the sRGB low channel", () => {
    expect(parseOpaqueHex("#fff")).toBeUndefined()
    expect(parseOpaqueHex(undefined)).toBeUndefined()
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBe(21)
  })
})
