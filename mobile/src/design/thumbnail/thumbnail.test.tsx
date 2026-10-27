import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors, ThumbnailSize } from "@/theme"

import { Thumbnail } from "./thumbnail"

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

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

const hidden = { includeHiddenElements: true }
const LIGHT = "https://cdn.example/logo.png"
const DARK = "https://cdn.example/logo-dark.png"

beforeEach(() => {
  mockFontScale = 1
  mockUseColorScheme.mockReturnValue("light")
})

const image = () => screen.getByTestId("thumb", hidden)
const tileStyle = () =>
  StyleSheet.flatten(screen.getByTestId("thumb-tile", hidden).props.style)

describe("Thumbnail", () => {
  it("loads the light URL in the light scheme on the logo chip", async () => {
    await render(
      <Thumbnail
        source={{ light: LIGHT, dark: DARK }}
        size="medium"
        testID="thumb"
      />,
    )
    expect(image().props.source).toEqual([{ uri: LIGHT }])
    expect(tileStyle()).toMatchObject({
      backgroundColor: Colors.light.logoSurface,
    })
  })

  it("loads the dark URL in the dark scheme", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    await render(
      <Thumbnail
        source={{ light: LIGHT, dark: DARK }}
        size="medium"
        testID="thumb"
      />,
    )
    expect(image().props.source).toEqual([{ uri: DARK }])
  })

  it("falls back to the light URL in the dark scheme", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    await render(
      <Thumbnail source={{ light: LIGHT }} size="medium" testID="thumb" />,
    )
    expect(image().props.source).toEqual([{ uri: LIGHT }])
  })

  it.each([undefined, ""])(
    "shows the monogram on the brand wash when the URL is %p",
    async (light) => {
      await render(
        <Thumbnail
          source={{ light }}
          size="medium"
          monogram="A"
          testID="thumb"
        />,
      )
      expect(screen.queryByTestId("thumb", hidden)).toBeNull()
      const letter = screen.getByTestId("thumb-monogram", hidden)
      expect(letter).toHaveTextContent("A")
      expect(StyleSheet.flatten(letter.props.style)).toMatchObject({
        color: Colors.light.onPrimarySoft,
      })
      expect(letter.props.allowFontScaling).toBe(false)
      expect(tileStyle()).toMatchObject({
        backgroundColor: Colors.light.primarySoft,
      })
    },
  )

  it("draws an empty wash without a monogram", async () => {
    await render(
      <Thumbnail source={{ light: undefined }} size="large" testID="thumb" />,
    )
    expect(screen.queryByTestId("thumb-monogram", hidden)).toBeNull()
    expect(tileStyle()).toMatchObject({ width: ThumbnailSize.large })
  })

  it("shows the monogram and reports once after a load failure", async () => {
    const onError = jest.fn()
    await render(
      <Thumbnail
        source={{ light: LIGHT }}
        size="medium"
        monogram="A"
        onError={onError}
        testID="thumb"
      />,
    )
    await act(async () => {
      fireEvent(image(), "error", { nativeEvent: { error: "load failed" } })
    })
    expect(screen.getByTestId("thumb-monogram", hidden)).toBeTruthy()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("retries when a scheme switch resolves a different URL", async () => {
    const view = await render(
      <Thumbnail
        source={{ light: LIGHT, dark: DARK }}
        size="medium"
        monogram="A"
        testID="thumb"
      />,
    )
    await act(async () => {
      fireEvent(image(), "error", { nativeEvent: { error: "load failed" } })
    })
    expect(screen.queryByTestId("thumb", hidden)).toBeNull()

    mockUseColorScheme.mockReturnValue("dark")
    await view.rerender(
      <Thumbnail
        source={{ light: LIGHT, dark: DARK }}
        size="medium"
        monogram="A"
        testID="thumb"
      />,
    )
    expect(image().props.source).toEqual([{ uri: DARK }])
  })

  it.each(["medium", "large"] as const)(
    "keeps the %s size at the largest text size",
    async (size) => {
      mockFontScale = 3
      await render(
        <Thumbnail source={{ light: LIGHT }} size={size} testID="thumb" />,
      )
      expect(tileStyle()).toMatchObject({
        width: ThumbnailSize[size],
        height: ThumbnailSize[size],
      })
    },
  )

  it("is hidden from assistive technology", async () => {
    await render(
      <Thumbnail
        source={{ light: undefined }}
        size="medium"
        monogram="A"
        testID="thumb"
      />,
    )
    expect(screen.queryByTestId("thumb-tile")).toBeNull()
    expect(screen.queryByTestId("thumb-monogram")).toBeNull()
    expect(screen.queryByText("A")).toBeNull()
    expect(screen.getByTestId("thumb-tile", hidden).props).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    })
  })
})
