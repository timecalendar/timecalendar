import { render, renderHook } from "@testing-library/react-native"
import { Text } from "react-native"

import { GlassSurface } from "@/components/chrome"
import { Colors, useTheme } from "@/theme"

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
