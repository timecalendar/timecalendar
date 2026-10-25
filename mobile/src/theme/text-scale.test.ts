import { renderHook } from "@testing-library/react-native"

import {
  AccessibilityFontScale,
  isAccessibilityTextSize,
  useIsAccessibilityTextSize,
} from "@/theme"

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: mockFontScale,
  }),
}))

describe("accessibility text size", () => {
  it("uses the UIKit accessibilityMedium multiplier", () => {
    expect(AccessibilityFontScale).toBe(1.786)
  })

  it.each([
    [1, false],
    [1.353, false],
    [1.785, false],
    [1.786, true],
    [2, true],
    [3.571, true],
  ])("treats font scale %d as accessibility size: %s", (scale, expected) => {
    expect(isAccessibilityTextSize(scale)).toBe(expected)
  })

  it("follows a live font scale change", async () => {
    mockFontScale = 1
    const { result, rerender } = await renderHook(() =>
      useIsAccessibilityTextSize(),
    )
    expect(result.current).toBe(false)

    mockFontScale = 3.571
    await rerender({})
    expect(result.current).toBe(true)
  })
})
