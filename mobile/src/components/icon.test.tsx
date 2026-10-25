import { render } from "@testing-library/react-native"
import { readFileSync } from "fs"
import { join } from "path"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { Icon } from "./icon"
import { MATERIAL_GLYPHS } from "./icon-glyphs"

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

let mockFontLoaded = true
jest.mock("expo-font", () => ({
  useFonts: () => [mockFontLoaded, null],
}))

const mockSymbolView = jest.fn()
jest.mock("expo-symbols", () => ({
  SymbolView: (props: unknown) => {
    mockSymbolView(props)
    return null
  },
}))

beforeEach(() => {
  mockFontScale = 1
  mockFontLoaded = true
  mockSymbolView.mockClear()
})

type Screen = Awaited<ReturnType<typeof render>>

function boxElement(view: Screen) {
  return view.getByTestId("icon", { includeHiddenElements: true })
}

function boxOf(view: Screen) {
  return StyleSheet.flatten(boxElement(view).props.style)
}

function glyphOf(view: Screen) {
  const [glyph] = boxElement(view).children
  if (glyph === undefined || typeof glyph === "string") {
    throw new Error("expected a glyph Text")
  }
  return glyph
}

describe("Icon on Android", () => {
  usePlatform("android")

  it("grows a text icon and its box with the font scale", async () => {
    mockFontScale = 2
    const view = await render(
      <Icon
        testID="icon"
        android="add"
        size={20}
        color="#000"
        scaling="text"
      />,
    )
    expect(boxOf(view)).toMatchObject({ width: 40, height: 40 })
    const glyph = glyphOf(view)
    expect(StyleSheet.flatten(glyph.props.style)).toMatchObject({
      fontSize: 20,
      lineHeight: 20,
      color: "#000",
    })
    expect(glyph.props.maxFontSizeMultiplier).toBeUndefined()
    expect(glyph.props.children).toBe(String.fromCharCode(0xe145))
  })

  it("caps a text icon at its neighbor's multiplier", async () => {
    mockFontScale = 2
    const view = await render(
      <Icon
        testID="icon"
        android="add"
        size={12}
        color="#000"
        scaling="text"
        maxFontSizeMultiplier={1.2}
      />,
    )
    expect(boxOf(view).width).toBeCloseTo(14.4)
    expect(boxOf(view).height).toBeCloseTo(14.4)
    expect(glyphOf(view).props.maxFontSizeMultiplier).toBe(1.2)
  })

  it.each([0.8, 2])(
    "keeps a fixed icon at its design size at font scale %s",
    async (fontScale) => {
      mockFontScale = fontScale
      const view = await render(
        <Icon
          testID="icon"
          android="add"
          size={24}
          color="#000"
          scaling="fixed"
        />,
      )
      expect(boxOf(view)).toMatchObject({ width: 24, height: 24 })
      expect(glyphOf(view).props.allowFontScaling).toBe(false)
    },
  )

  it("shrinks a text icon with a small font scale", async () => {
    mockFontScale = 0.8
    const view = await render(
      <Icon
        testID="icon"
        android="add"
        size={20}
        color="#000"
        scaling="text"
      />,
    )
    expect(boxOf(view)).toMatchObject({ width: 16, height: 16 })
    expect(glyphOf(view).props.allowFontScaling).toBeUndefined()
  })

  it("centers the glyph in its box", async () => {
    const view = await render(
      <Icon
        testID="icon"
        android="add"
        size={20}
        color="#000"
        scaling="text"
      />,
    )
    expect(boxOf(view)).toMatchObject({
      alignItems: "center",
      justifyContent: "center",
    })
  })

  it("reserves the box empty until the font loads", async () => {
    mockFontScale = 2
    mockFontLoaded = false
    const view = await render(
      <Icon
        testID="icon"
        android="add"
        size={20}
        color="#000"
        scaling="text"
      />,
    )
    expect(boxOf(view)).toMatchObject({ width: 40, height: 40 })
    expect(boxElement(view).children).toHaveLength(0)
  })

  it("is hidden from assistive technology", async () => {
    const view = await render(
      <Icon
        testID="icon"
        android="add"
        size={20}
        color="#000"
        scaling="text"
      />,
    )
    expect(
      view.getByTestId("icon", { includeHiddenElements: true }).props,
    ).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    })
  })

  it("renders nothing without an Android glyph", async () => {
    const view = await render(
      <Icon testID="icon" ios="plus" size={20} color="#000" scaling="fixed" />,
    )
    expect(
      view.queryByTestId("icon", { includeHiddenElements: true }),
    ).toBeNull()
  })
})

describe("Icon on iOS", () => {
  usePlatform("ios")

  it("sizes a text symbol by the font scale and a fixed one by its design size", async () => {
    mockFontScale = 2
    await render(
      <>
        <Icon ios="plus" size={20} color="#111" scaling="text" />
        <Icon
          ios="plus"
          size={20}
          color="#111"
          scaling="text"
          maxFontSizeMultiplier={1.5}
        />
        <Icon ios="plus" size={20} color="#111" scaling="fixed" />
      </>,
    )
    expect(mockSymbolView.mock.calls.map(([props]) => props.size)).toEqual([
      40, 30, 20,
    ])
  })

  it("keeps a fixed symbol at its design size below the default text size", async () => {
    mockFontScale = 0.8
    await render(<Icon ios="plus" size={20} color="#111" scaling="fixed" />)
    expect(mockSymbolView).toHaveBeenCalledWith(
      expect.objectContaining({ size: 20 }),
    )
  })

  it("forwards the name, tint, weight and test id as a decorative view", async () => {
    await render(
      <Icon
        testID="icon"
        ios="chevron.forward"
        iosWeight="semibold"
        size={14}
        color="#111"
        scaling="fixed"
      />,
    )
    expect(mockSymbolView).toHaveBeenCalledWith({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
      name: "chevron.forward",
      size: 14,
      tintColor: "#111",
      weight: "semibold",
      testID: "icon",
    })
  })

  it("renders nothing without an SF Symbol", async () => {
    await render(<Icon android="add" size={20} color="#000" scaling="fixed" />)
    expect(mockSymbolView).not.toHaveBeenCalled()
  })
})

describe("MATERIAL_GLYPHS", () => {
  it("matches the expo-symbols Material Symbols font table", () => {
    const table = JSON.parse(
      readFileSync(
        join(
          __dirname,
          "../../node_modules/expo-symbols/src/android/symbols.json",
        ),
        "utf8",
      ),
    ) as Record<string, number>
    for (const [name, codepoint] of Object.entries(MATERIAL_GLYPHS)) {
      expect([name, table[name]]).toEqual([name, codepoint])
    }
  })
})
