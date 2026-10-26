import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native"
import { AccessibilityInfo, StyleSheet } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { usePlatform } from "@/test-support/platform"
import { Colors, Spacing } from "@/theme"

import { StatusView, type StatusViewProps } from "./status-view"

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

jest.mock("@/hooks/use-color-scheme", () => ({ useColorScheme: jest.fn() }))
const scheme = jest.mocked(useColorScheme)

const artwork = { light: { uri: "light" }, dark: { uri: "dark" } }
const symbol = { ios: "magnifyingglass", android: "search" } as const
const hidden = { includeHiddenElements: true }

let announce: jest.SpiedFunction<
  typeof AccessibilityInfo.announceForAccessibilityWithOptions
>
let announceAndroid: jest.SpiedFunction<
  typeof AccessibilityInfo.announceForAccessibility
>

beforeEach(() => {
  mockFontScale = 1
  scheme.mockReturnValue("light")
  announce = jest
    .spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
    .mockImplementation(() => {})
  announceAndroid = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => {})
})
afterEach(() => {
  announce.mockRestore()
  announceAndroid.mockRestore()
})

const presentations = ["screen", "section", "inline"] as const

const flat = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style)

const isScrollView = (testID: string) =>
  screen.getByTestId(testID).props.contentContainerStyle !== undefined

function textOrder() {
  return screen.getAllByText(/./).map((node) => node.props.children as string)
}

describe.each(["ios", "android"] as const)("StatusView on %s", (os) => {
  usePlatform(os)

  describe.each(presentations)("%s presentation", (presentation) => {
    it("renders loading as one busy progress bar named by its title", async () => {
      await render(
        <StatusView
          kind="loading"
          presentation={presentation}
          title="Loading schools"
          testID="status"
        />,
      )
      const progress = screen.getByRole("progressbar")
      expect(progress).toHaveProp("accessibilityLabel", "Loading schools")
      expect(progress.props.accessibilityState).toEqual({ busy: true })
      expect(progress).toHaveTextContent("Loading schools")
      expect(screen.queryByRole("header")).toBeNull()
      expect(screen.queryByTestId("status-progress")).toBeNull()
      expect(screen.getByTestId("status-progress", hidden)).toHaveProp(
        "importantForAccessibility",
        "no-hide-descendants",
      )
      expect(isScrollView("status")).toBe(presentation === "screen")
    })

    it("renders empty as symbol, heading title, caption and actions", async () => {
      const primary = jest.fn()
      const secondary = jest.fn()
      await render(
        <StatusView
          kind="empty"
          presentation={presentation}
          title="No results"
          caption="Try another name"
          symbol={symbol}
          action={{ label: "Add", onPress: primary, testID: "primary" }}
          secondaryAction={{
            label: "Missing?",
            onPress: secondary,
            testID: "secondary",
          }}
          testID="status"
        />,
      )
      expect(screen.getByRole("header")).toHaveTextContent("No results")
      expect(screen.getByText("Try another name")).not.toHaveProp(
        "accessibilityRole",
        "header",
      )
      expect(textOrder()).toEqual([
        "No results",
        "Try another name",
        "Add",
        "Missing?",
      ])
      expect(screen.getAllByRole("button").map((b) => b.props.testID)).toEqual([
        "primary",
        "secondary",
      ])
      expect(screen.queryByRole("progressbar")).toBeNull()
      expect(isScrollView("status")).toBe(presentation === "screen")
      if (os === "ios") {
        expect(screen.queryByTestId("status-symbol")).toBeNull()
        expect(screen.getByTestId("status-symbol", hidden)).toBeTruthy()
      } else {
        expect(screen.queryByTestId("status-symbol")).toBeNull()
        expect(screen.getByTestId("status-symbol", hidden)).toHaveProp(
          "importantForAccessibility",
          "no-hide-descendants",
        )
      }
      await fireEvent.press(screen.getByTestId("primary"))
      await fireEvent.press(screen.getByTestId("secondary"))
      expect(primary).toHaveBeenCalledTimes(1)
      expect(secondary).toHaveBeenCalledTimes(1)
      expect(flat("primary")).toMatchObject({
        backgroundColor: Colors.light.primaryStrong,
      })
      expect(flat("secondary").backgroundColor).toBeUndefined()
    })

    it("renders error with the fixed glyph and a heading title", async () => {
      await render(
        <StatusView
          kind="error"
          presentation={presentation}
          title="Could not load"
          caption="Check your connection"
          testID="status"
        />,
      )
      expect(screen.getByRole("header")).toHaveTextContent("Could not load")
      expect(screen.queryByRole("alert")).toBeNull()
      expect(screen.queryByTestId("status-glyph")).toBeNull()
      expect(screen.getByTestId("status-glyph", hidden)).toBeTruthy()
      expect(screen.queryAllByRole("button")).toHaveLength(0)
      expect(isScrollView("status")).toBe(presentation === "screen")
    })
  })

  it("lays screen content out to center while it fits and scroll past it", async () => {
    await render(
      <StatusView
        kind="empty"
        presentation="screen"
        title="Empty"
        testID="s"
      />,
    )
    const scroll = screen.getByTestId("s")
    expect(
      StyleSheet.flatten(scroll.props.contentContainerStyle),
    ).toMatchObject({
      flexGrow: 1,
      justifyContent: "center",
      paddingVertical: Spacing.five,
    })
    expect(scroll.props.contentInsetAdjustmentBehavior).toBe("never")
    expect(flat("s")).toMatchObject({ flex: 1 })
  })

  it("centers a section and keeps an inline state leading", async () => {
    const view = await render(
      <StatusView
        kind="empty"
        presentation="section"
        title="Empty"
        testID="s"
      />,
    )
    expect(flat("s")).toMatchObject({
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.four,
    })
    expect(screen.getByText("Empty")).toHaveStyle({ textAlign: "center" })
    await view.rerender(
      <StatusView
        kind="empty"
        presentation="inline"
        title="Empty"
        testID="s"
      />,
    )
    expect(flat("s")).toMatchObject({ alignItems: "flex-start" })
    expect(flat("s").flexGrow).toBeUndefined()
    expect(screen.getByText("Empty")).not.toHaveStyle({ textAlign: "center" })
  })

  it("scopes the Android polite live region to the text, not the actions", async () => {
    const polite = os === "android" ? "polite" : undefined
    const view = await render(
      <StatusView
        kind="error"
        presentation="section"
        title="Failed"
        action={{ label: "Retry", onPress: () => {}, testID: "retry" }}
        testID="s"
      />,
    )
    expect(
      screen.getByTestId("s").props.accessibilityLiveRegion,
    ).toBeUndefined()
    expect(screen.getByTestId("s-text").props.accessibilityLiveRegion).toBe(
      polite,
    )
    expect(within(screen.getByTestId("s-text")).queryByText("Retry")).toBeNull()

    await view.rerender(
      <StatusView
        kind="loading"
        presentation="screen"
        title="Loading"
        testID="s"
      />,
    )
    expect(
      screen.getByTestId("s").props.accessibilityLiveRegion,
    ).toBeUndefined()
    expect(
      screen.getByRole("progressbar", { name: "Loading" }).props
        .accessibilityLiveRegion,
    ).toBe(polite)
  })

  it("keeps the live-region text container unflattened without a testID", async () => {
    await render(
      <StatusView kind="error" presentation="section" title="Failed" />,
    )
    let container = screen.getByText("Failed").parent
    while (container && container.props.collapsable === undefined) {
      container = container.parent
    }
    expect(within(container!).getByText("Failed")).toBeTruthy()
    expect(container?.props.collapsable).toBe(false)
    expect(container?.props.accessibilityLiveRegion).toBe(
      os === "android" ? "polite" : undefined,
    )
  })

  it("announces once per appearance and once per key change", async () => {
    const view = await render(
      <StatusView
        kind="empty"
        presentation="section"
        title="No result for a"
        caption="Try another name"
        announcementKey="noResults"
      />,
    )
    await view.rerender(
      <StatusView
        kind="empty"
        presentation="section"
        title="No result for ab"
        caption="Try another name"
        announcementKey="noResults"
      />,
    )
    if (os === "ios") {
      expect(announce).toHaveBeenCalledTimes(1)
      expect(announce).toHaveBeenCalledWith(
        "No result for a. Try another name",
        { queue: true },
      )
    } else {
      expect(announce).not.toHaveBeenCalled()
    }
    await view.rerender(
      <StatusView
        kind="empty"
        presentation="section"
        title="No schools"
        announcementKey="empty"
      />,
    )
    if (os === "ios") {
      expect(announce).toHaveBeenCalledTimes(2)
      expect(announce).toHaveBeenLastCalledWith("No schools", { queue: true })
    }
    expect(announceAndroid).not.toHaveBeenCalled()
  })

  it("re-announces when the kind changes without a key", async () => {
    const view = await render(
      <StatusView kind="loading" presentation="screen" title="Loading" />,
    )
    await view.rerender(
      <StatusView kind="error" presentation="screen" title="Failed" />,
    )
    expect(announce).toHaveBeenCalledTimes(os === "ios" ? 2 : 0)
    if (os === "ios")
      expect(announce).toHaveBeenNthCalledWith(1, "Loading", { queue: true })
  })

  it("blocks a busy retry while keeping its label", async () => {
    const retry = jest.fn()
    await render(
      <StatusView
        kind="error"
        presentation="screen"
        title="Failed"
        action={{ label: "Retry", onPress: retry, busy: true, testID: "retry" }}
      />,
    )
    const button = screen.getByTestId("retry")
    expect(button.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    })
    expect(button).toHaveTextContent("Retry")
    await fireEvent.press(button)
    expect(retry).not.toHaveBeenCalled()
  })

  it("lays inline actions out at their intrinsic width", async () => {
    await render(
      <StatusView
        kind="error"
        presentation="inline"
        title="Failed"
        action={{ label: "Retry", onPress: jest.fn(), testID: "retry" }}
      />,
    )
    expect(
      StyleSheet.flatten(screen.getByTestId("retry").parent?.props.style),
    ).toMatchObject({ alignItems: "flex-start" })
  })
})

describe("artwork", () => {
  const props: StatusViewProps = {
    kind: "empty",
    presentation: "screen",
    title: "Nothing here",
    artwork,
    testID: "status",
  }

  it.each([
    ["light" as const, artwork.light],
    ["dark" as const, artwork.dark],
  ])(
    "draws the %s artwork, hidden from assistive technology",
    async (mode, source) => {
      scheme.mockReturnValue(mode)
      await render(<StatusView {...props} />)
      expect(screen.queryByTestId("status-artwork")).toBeNull()
      const image = screen.getByTestId("status-artwork", hidden)
      expect(image).toHaveProp("source", [source])
      expect(image).toHaveProp("accessible", false)
    },
  )

  it.each([1.786, 2])("leaves at font scale %d", async (scale) => {
    mockFontScale = scale
    await render(<StatusView {...props} />)
    expect(screen.queryByTestId("status-artwork", hidden)).toBeNull()
    expect(textOrder()[0]).toBe("Nothing here")
  })

  it("returns on a live drop below the threshold", async () => {
    mockFontScale = 2
    const view = await render(<StatusView {...props} />)
    expect(screen.queryByTestId("status-artwork", hidden)).toBeNull()
    mockFontScale = 1
    await view.rerender(<StatusView {...props} />)
    expect(screen.getByTestId("status-artwork", hidden)).toBeTruthy()
  })

  it("keeps a symbol at accessibility sizes", async () => {
    mockFontScale = 2
    await render(
      <StatusView
        kind="empty"
        presentation="section"
        title="Nothing"
        symbol={symbol}
        testID="status"
      />,
    )
    expect(screen.getByTestId("status-symbol", hidden)).toBeTruthy()
  })
})

it("merges the layout style last", async () => {
  await render(
    <StatusView
      kind="loading"
      presentation="section"
      title="Loading"
      testID="s"
      style={{ marginTop: 12, flexGrow: 0 }}
    />,
  )
  expect(flat("s")).toMatchObject({ marginTop: 12, flexGrow: 0 })
})

it("rejects props a kind cannot carry", () => {
  const noop = () => {}
  const cases = [
    // @ts-expect-error loading states carry no action
    <StatusView
      key="a"
      kind="loading"
      presentation="screen"
      title="Loading"
      action={{ label: "Retry", onPress: noop }}
    />,
    // @ts-expect-error artwork and symbol are exclusive
    <StatusView
      key="b"
      kind="empty"
      presentation="screen"
      title="Empty"
      artwork={artwork}
      symbol={symbol}
    />,
    // @ts-expect-error errors draw the fixed glyph only
    <StatusView
      key="c"
      kind="error"
      presentation="screen"
      title="Failed"
      artwork={artwork}
    />,
    <StatusView
      key="d"
      kind="error"
      presentation="screen"
      title="Failed"
      // @ts-expect-error style is layout-only
      style={{ backgroundColor: "red" }}
    />,
  ]
  expect(cases).toHaveLength(4)
})
