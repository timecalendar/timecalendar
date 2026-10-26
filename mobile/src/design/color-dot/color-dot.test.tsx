import { render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { usePlatform } from "@/test-support/platform"
import { ColorDotSize, Colors, Radii } from "@/theme"

import { ColorDot } from "./color-dot"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

beforeEach(() => {
  mockUseColorScheme.mockReturnValue("light")
})

const dot = () => screen.getByTestId("dot", { includeHiddenElements: true })
const styleOf = () =>
  StyleSheet.flatten(dot().props.style) as Record<string, unknown>

describe.each(["ios", "android"] as const)("ColorDot on %s", (platform) => {
  usePlatform(platform)

  it.each(["small", "medium", "large"] as const)(
    "sizes a %s dot from ColorDotSize",
    async (size) => {
      await render(<ColorDot color="#E91E63" size={size} testID="dot" />)
      expect(styleOf()).toMatchObject({
        width: ColorDotSize[size],
        height: ColorDotSize[size],
        borderRadius: Radii.pill,
      })
    },
  )

  it("defaults to the medium size and draws the color verbatim", async () => {
    await render(<ColorDot color="#E91E63" testID="dot" />)
    expect(styleOf()).toMatchObject({
      width: ColorDotSize.medium,
      backgroundColor: "#E91E63",
    })
    expect(styleOf().borderWidth).toBeUndefined()
  })

  describe.each(["light", "dark"] as const)("in %s", (scheme) => {
    it.each(["background", "backgroundElement", "homeHero"] as const)(
      "rings the dot in the %s token",
      async (ring) => {
        mockUseColorScheme.mockReturnValue(scheme)
        await render(<ColorDot color="#3F51B5" ring={ring} testID="dot" />)
        expect(styleOf()).toMatchObject({
          borderWidth: 2,
          borderColor: Colors[scheme][ring],
          width: ColorDotSize.medium,
        })
      },
    )
  })

  it("is hidden from assistive technology", async () => {
    await render(<ColorDot color="#E91E63" testID="dot" />)
    expect(screen.queryByTestId("dot")).toBeNull()
    expect(dot().props).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    })
  })

  it("applies the layout style last", async () => {
    await render(
      <ColorDot color="#E91E63" testID="dot" style={{ marginLeft: -4 }} />,
    )
    expect(styleOf().marginLeft).toBe(-4)
  })
})

it("rejects a label, a ring color and a size override", () => {
  const elements = [
    // @ts-expect-error a dot is decorative
    <ColorDot key="a" color="#E91E63" accessibilityLabel="Pink" />,
    // @ts-expect-error a ring names a surface token, not a color
    <ColorDot key="b" color="#E91E63" ringColor="#fff" />,
    // @ts-expect-error the size is a token
    <ColorDot key="c" color="#E91E63" style={{ width: 40 }} />,
  ]
  expect(elements).toHaveLength(3)
})
