import { render, screen } from "@testing-library/react-native"
import type { NativeStackNavigationOptions } from "expo-router"
import { StyleSheet } from "react-native"

import { headerBarItems, renderHeaderSide } from "@/test-support/header-actions"
import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { CalendarScreenHeader } from "./calendar-screen-header"
import { CalendarViewMenu } from "./calendar-view-menu"

let mockOptions: NativeStackNavigationOptions | undefined
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options: NativeStackNavigationOptions }) => {
      mockOptions = options
      return null
    },
  },
}))

const renderHeader = (onToday: (() => void) | undefined) =>
  render(
    <CalendarScreenHeader
      title="June 2026"
      compactTitle="Jun 2026"
      contextHeading="Week of 15 June"
      pageKey="2026-06-15"
      titleTargetActive={false}
      onTitleTargetChange={jest.fn()}
      view="agenda"
      onViewChange={jest.fn()}
      onToday={onToday}
      onAdd={jest.fn()}
      zoom={null}
    />,
  )

describe("Calendar header on ios", () => {
  usePlatform("ios")

  it("declares Today and Add as native bar items in the label color", async () => {
    await renderHeader(jest.fn())
    expect(
      headerBarItems(mockOptions, "right").map((item) => ({
        identifier: item.identifier,
        icon: item.icon,
        accessibilityLabel: item.accessibilityLabel,
        tintColor: item.tintColor,
      })),
    ).toEqual([
      {
        identifier: "calendar-today",
        icon: { type: "sfSymbol", name: "calendar" },
        accessibilityLabel: "Go to today",
        tintColor: Colors.light.text,
      },
      {
        identifier: "calendar-add",
        icon: { type: "sfSymbol", name: "plus" },
        accessibilityLabel: "Add an event",
        tintColor: Colors.light.text,
      },
    ])
  })

  it("drops Today when the selected date is today", async () => {
    await renderHeader(undefined)
    expect(
      headerBarItems(mockOptions, "right").map((item) => item.identifier),
    ).toEqual(["calendar-add"])
  })
})

describe("Calendar header on android", () => {
  usePlatform("android")

  it("renders Today as a Material icon button and leaves Add to the FAB", async () => {
    await renderHeader(jest.fn())
    const view = await renderHeaderSide(mockOptions, "right")
    const today = view.getByRole("button", { name: "Go to today" })
    expect(today.props.testID).toBe("calendar-today")
    expect(today.props.colors).toEqual({ contentColor: Colors.light.text })
    expect(view.queryByTestId("calendar-add")).toBeNull()
  })
})

describe.each(["ios", "android"] as const)("Calendar view menu on %s", (os) => {
  usePlatform(os)

  it("tints the view menu chevron with the label color", async () => {
    await render(
      <CalendarViewMenu view="week" onChange={jest.fn()} zoom={null} />,
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("calendar-view-chevron").props.style,
      ).borderColor,
    ).toBe(Colors.light.text)
  })
})
