import {
  act,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react-native"
import { type LayoutChangeEvent, StyleSheet, Text } from "react-native"

import {
  AdaptiveContent,
  useAdaptiveLayout,
} from "@/components/adaptive-content"
import { resolveResponsiveLayout, ResponsiveContentWidths } from "@/theme"

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 1024, height: 1366, scale: 2, fontScale: 1 }),
}))

function layoutEvent(width: number): LayoutChangeEvent {
  return {
    nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
  } as LayoutChangeEvent
}

describe("useAdaptiveLayout", () => {
  it("renders a visible compact lane before measuring", async () => {
    const { result } = await renderHook(() => useAdaptiveLayout("readable"))

    expect(result.current.metrics).toEqual(
      resolveResponsiveLayout(0, "readable"),
    )
    expect(result.current.laneStyle).toEqual({
      alignSelf: "center",
      width: "100%",
      maxWidth: ResponsiveContentWidths.readable + 48,
      paddingHorizontal: 24,
    })
  })

  it("uses the measured nested owner instead of the tablet window", async () => {
    const { result } = await renderHook(() => useAdaptiveLayout("standard"))

    await act(() => result.current.onLayout(layoutEvent(599)))

    expect(result.current.metrics).toEqual(
      resolveResponsiveLayout(599, "standard"),
    )
    expect(result.current.metrics.sizeClass).toBe("compact")
    expect(result.current.metrics.isColumnEligible).toBe(false)
    expect(result.current.laneStyle).toEqual({
      alignSelf: "center",
      width: "100%",
      maxWidth: ResponsiveContentWidths.standard + 48,
      paddingHorizontal: 24,
    })
  })

  it("ignores invalid measurements and fills a full-bleed owner", async () => {
    const { result } = await renderHook(() => useAdaptiveLayout("fullBleed"))

    await act(() => result.current.onLayout(layoutEvent(Number.NaN)))
    expect(result.current.metrics).toEqual(
      resolveResponsiveLayout(0, "fullBleed"),
    )

    await act(() => result.current.onLayout(layoutEvent(834)))
    expect(result.current.metrics).toEqual(
      resolveResponsiveLayout(834, "fullBleed"),
    )
    expect(result.current.laneStyle).toEqual({ width: "100%" })
  })
})

describe("AdaptiveContent", () => {
  it("measures its owner while preserving caller view behavior", async () => {
    const callerOnLayout = jest.fn()
    const { getByTestId, getByText } = await render(
      <AdaptiveContent
        lane="readable"
        testID="adaptive-owner"
        style={{ flex: 1 }}
        contentContainerStyle={{ backgroundColor: "pink" }}
        onLayout={callerOnLayout}
      >
        <Text>Visible content</Text>
      </AdaptiveContent>,
    )

    const owner = getByTestId("adaptive-owner")
    const content = getByText("Visible content").parent
    expect(content).not.toBeNull()
    expect(StyleSheet.flatten(owner.props.style)).toEqual({
      width: "100%",
      flex: 1,
    })
    expect(StyleSheet.flatten(content?.props.style)).toEqual({
      alignSelf: "center",
      width: "100%",
      maxWidth: ResponsiveContentWidths.readable + 48,
      paddingHorizontal: 24,
      backgroundColor: "pink",
    })

    await act(() => fireEvent(owner, "layout", layoutEvent(1024)))

    expect(callerOnLayout).toHaveBeenCalledTimes(1)
    expect(StyleSheet.flatten(content?.props.style)).toEqual({
      alignSelf: "center",
      width: "100%",
      maxWidth: ResponsiveContentWidths.readable + 128,
      paddingHorizontal: 64,
      backgroundColor: "pink",
    })
  })
})
