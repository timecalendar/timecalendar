import { fireEvent, render } from "@testing-library/react-native"
import { StyleSheet, View } from "react-native"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors, resolveResponsiveLayout } from "@/theme"

import { PageIntro, RootPage } from "./root-page"

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
      })
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
