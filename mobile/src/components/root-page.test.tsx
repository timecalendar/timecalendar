import { fireEvent, render } from "@testing-library/react-native"
import { HeaderHeightContext } from "expo-router/react-navigation"
import { Platform, StyleSheet, View } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors, resolveResponsiveLayout, Spacing } from "@/theme"

import { headerScrollProps, PageIntro, RootPage } from "./root-page"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

beforeEach(() => mockUseColorScheme.mockReturnValue("light"))

describe("RootPage", () => {
  it.each([
    [390, "readable" as const],
    [834, "standard" as const],
  ])(
    "measures a %ipx %s lane without adding a scroller",
    async (width, lane) => {
      const view = await render(
        <RootPage testID="page" lane={lane}>
          <View testID="content" />
        </RootPage>,
      )

      await fireEvent(view.getByTestId("page"), "layout", {
        nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
      })
      const metrics = resolveResponsiveLayout(width, lane)
      expect(
        StyleSheet.flatten(view.getByTestId("page-lane").props.style),
      ).toMatchObject({
        maxWidth: (metrics.maxContentWidth ?? 0) + 2 * metrics.gutter,
        paddingHorizontal: metrics.gutter,
        paddingTop: Spacing.four,
      })
      expect(
        StyleSheet.flatten(view.getByTestId("page").props.style).paddingTop ??
          0,
      ).toBe(0)
      expect(
        view.container.queryAll(
          (node) => node.props.keyboardShouldPersistTaps !== undefined,
        ),
      ).toHaveLength(0)
    },
  )

  it("lets a virtualized owner consume the measured lane directly", async () => {
    const view = await render(
      <RootPage testID="page">
        {({ laneStyle }) => <View testID="list-owner" style={laneStyle} />}
      </RootPage>,
    )
    expect(view.queryByTestId("page-lane")).toBeNull()
    expect(view.getByTestId("list-owner")).toBeTruthy()
    expect(
      StyleSheet.flatten(view.getByTestId("page").props.style).paddingTop ?? 0,
    ).toBe(0)
  })

  it.each([
    ["light" as const, Colors.light.background],
    ["dark" as const, Colors.dark.background],
  ])("uses the %s theme surface", async (scheme, backgroundColor) => {
    mockUseColorScheme.mockReturnValue(scheme)
    const view = await render(
      <RootPage testID="page">
        <View />
      </RootPage>,
    )
    expect(
      StyleSheet.flatten(view.getByTestId("page").props.style),
    ).toMatchObject({ backgroundColor })
  })
})

describe("RootPage under a transparent header", () => {
  const renderUnderHeader = (scrollsUnderHeader: boolean) =>
    render(
      <HeaderHeightContext.Provider value={100}>
        <RootPage testID="page" scrollsUnderHeader={scrollsUnderHeader}>
          <View />
        </RootPage>
      </HeaderHeightContext.Provider>,
    )
  const paddingTop = (view: Awaited<ReturnType<typeof renderUnderHeader>>) =>
    StyleSheet.flatten(view.getByTestId("page").props.style).paddingTop

  it("pads a non-scrolling page below the iOS header", async () => {
    expect(Platform.OS).toBe("ios")
    expect(paddingTop(await renderUnderHeader(false))).toBe(100)
  })

  it("leaves a self-insetting scroll page flush under the header", async () => {
    expect(paddingTop(await renderUnderHeader(true))).toBeUndefined()
  })
})

describe("headerScrollProps", () => {
  it("insets and bounces a scroller that fills in under the header", () => {
    expect(headerScrollProps(true)).toEqual({
      contentInsetAdjustmentBehavior: "automatic",
      alwaysBounceVertical: true,
    })
  })

  it("keeps an empty-state scroller still below the padded header", () => {
    expect(headerScrollProps(false)).toEqual({
      contentInsetAdjustmentBehavior: "never",
      alwaysBounceVertical: false,
    })
  })
})

describe("PageIntro", () => {
  it("supports caption-only native-title composition", async () => {
    const view = await render(<PageIntro caption="Supporting context" />)
    expect(view.getByText("Supporting context")).toBeTruthy()
    expect(view.queryByRole("header")).toBeNull()
  })

  it("renders an optional heading before its caption", async () => {
    const view = await render(
      <PageIntro title="Heading" caption="Supporting context" />,
    )
    expect(view.getByRole("header")).toHaveTextContent("Heading")
    expect(
      view
        .getAllByText(/Heading|Supporting context/)
        .map((n) => n.props.children),
    ).toEqual(["Heading", "Supporting context"])
  })
})
