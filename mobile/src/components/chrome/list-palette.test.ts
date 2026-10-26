import { getMaterialColors } from "@expo/ui/jetpack-compose"
import { renderHook } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { useListPalette } from "./list-palette"

let mockScheme: "light" | "dark" = "light"
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))
afterEach(() => {
  mockScheme = "light"
})

const materialColors = jest.mocked(getMaterialColors)

describe("useListPalette on ios", () => {
  usePlatform("ios")

  it.each(["light", "dark"] as const)(
    "reads the %s theme tokens without the Material palette",
    async (scheme) => {
      mockScheme = scheme
      materialColors.mockClear()

      const { result } = await renderHook(() => useListPalette())

      expect(result.current).toEqual({
        surface: Colors[scheme].backgroundElement,
        text: Colors[scheme].text,
        textSecondary: Colors[scheme].textSecondary,
      })
      expect(materialColors).not.toHaveBeenCalled()
    },
  )
})

describe("useListPalette on android", () => {
  usePlatform("android")

  it("derives the seeded Material palette once per scheme and seed", async () => {
    materialColors.mockClear()

    const { result, rerender } = await renderHook(() => useListPalette())
    await rerender({})

    expect(result.current).toEqual({
      surface: "#surfaceContainer",
      text: "#onSurface",
      textSecondary: "#onSurfaceVariant",
    })
    expect(materialColors).toHaveBeenCalledTimes(1)
    expect(materialColors).toHaveBeenLastCalledWith({
      scheme: "light",
      seedColor: Colors.light.primary,
    })

    mockScheme = "dark"
    await rerender({})
    await renderHook(() => useListPalette())

    expect(materialColors).toHaveBeenCalledTimes(2)
    expect(materialColors).toHaveBeenLastCalledWith({
      scheme: "dark",
      seedColor: Colors.dark.primary,
    })
  })
})
