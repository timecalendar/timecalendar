import { fireEvent, render } from "@testing-library/react-native"
import { StyleSheet, View } from "react-native"

import {
  AdaptiveColumnsBreakpoint,
  resolveResponsiveLayout,
  ResponsiveLane,
  TabletBreakpoint,
} from "./responsive-layout"

describe("responsive layout", () => {
  test.each([
    [390, "compact", false],
    [599, "compact", false],
    [600, "tablet", false],
    [768, "tablet", false],
    [800, "tablet", false],
    [834, "tablet", true],
    [1024, "tablet", true],
  ] as const)("resolves %i points", (width, mode, columnsAllowed) => {
    expect(resolveResponsiveLayout(width)).toMatchObject({
      width,
      mode,
      columnsAllowed,
    })
  })

  it("keeps an unknown or nested narrow container compact", () => {
    expect(resolveResponsiveLayout(0)).toMatchObject({
      mode: "compact",
      gutter: 24,
    })
    expect(resolveResponsiveLayout(560)).toMatchObject({
      width: 560,
      mode: "compact",
    })
  })

  it("exposes the contract boundaries", () => {
    expect(TabletBreakpoint).toBe(600)
    expect(AdaptiveColumnsBreakpoint).toBe(834)
    expect(resolveResponsiveLayout(1024, "readable")).toMatchObject({
      maxWidth: 640,
      outerMaxWidth: 768,
      gutter: 64,
    })
    expect(resolveResponsiveLayout(1024, "standard").maxWidth).toBe(800)
    expect(resolveResponsiveLayout(1024, "fullBleed")).toMatchObject({
      maxWidth: undefined,
      gutter: 0,
    })
  })

  it("updates from the lane's own layout measurement", async () => {
    const screen = await render(
      <ResponsiveLane lane="readable" testID="lane">
        <View />
      </ResponsiveLane>,
    )

    expect(
      StyleSheet.flatten(screen.getByTestId("lane").props.style),
    ).toMatchObject({
      maxWidth: 688,
      paddingHorizontal: 24,
    })
    await fireEvent(screen.getByTestId("lane-measure"), "layout", {
      nativeEvent: { layout: { width: 768 } },
    })
    expect(
      StyleSheet.flatten(screen.getByTestId("lane").props.style),
    ).toMatchObject({
      maxWidth: 768,
      paddingHorizontal: 64,
    })
  })
})
