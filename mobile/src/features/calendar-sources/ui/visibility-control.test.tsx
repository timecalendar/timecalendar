import { fireEvent, render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { VisibilityControl } from "./visibility-control"

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 400,
    height: 800,
    scale: 2,
    fontScale: mockFontScale,
  }),
}))

afterEach(() => {
  mockFontScale = 1
})

it("renders the native checked switch with its accessible contract", async () => {
  const onToggle = jest.fn()
  await render(
    <VisibilityControl
      calendarId="cal-1"
      name="Algorithms"
      visible
      onToggle={onToggle}
    />,
  )

  const visibilitySwitch = screen.getByRole("switch", {
    name: "Show Algorithms in the app",
    checked: true,
  })
  expect(visibilitySwitch.props.accessibilityHint).toBe(
    "Controls whether events from this calendar appear in Home and Calendar",
  )
  await fireEvent(visibilitySwitch, "valueChange", false)
  expect(onToggle).toHaveBeenCalledWith(false)
})

it("stacks the visibility layout at the large-text breakpoint", async () => {
  mockFontScale = 1.4
  await render(
    <VisibilityControl
      calendarId="cal-1"
      name="Algorithms"
      visible={false}
      onToggle={jest.fn()}
    />,
  )

  const style = StyleSheet.flatten(
    screen.getByTestId("user-calendar-visibility-layout-cal-1").props.style,
  )
  expect(style.flexDirection).toBe("column")
  expect(style.alignItems).toBe("stretch")
})
