import { fireEvent, render } from "@testing-library/react-native"

import { DateTimePicker } from "@/components/chrome"
import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./date-time-picker.gallery"

const PICKED = new Date("2030-01-02T03:04:00.000Z")

const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en", options).format(date)

describe("date and time picker stories on Android", () => {
  usePlatform("android")

  it("opens the dialog on mount and shows a pick on the row", async () => {
    const view = await renderStory(fixture.Date)
    const row = () => view.getByTestId("gallery-date-time-open")
    const opened = new RegExp(
      format(new Date(2030, 0, 2), { dateStyle: "medium" }),
    )
    const picked = new RegExp(
      format(new Date(2030, 0, 5), { dateStyle: "medium" }),
    )
    expect(row()).toHaveTextContent(opened)
    expect(view.getByTestId("gallery-date-time-picker")).toHaveTextContent(
      "2030-01-02T00:00:00.000Z",
    )

    await fireEvent.press(view.getByTestId("gallery-date-time-picker"))
    expect(view.queryByTestId("gallery-date-time-picker")).toBeNull()
    expect(row()).toHaveTextContent(picked)
    expect(row()).not.toHaveTextContent(opened)
  })

  it("opens a late-evening value on its own local day", async () => {
    const view = await render(
      <DateTimePicker
        testID="picker"
        mode="date"
        presentation="dialog"
        value={new Date(2030, 0, 2, 23, 30)}
      />,
    )
    expect(view.getByTestId("picker")).toHaveTextContent(
      "2030-01-02T00:00:00.000Z",
    )
  })

  it("closes on dismiss and the row reopens the dialog", async () => {
    const view = await renderStory(fixture.Time)
    const picker = view.getByTestId("gallery-date-time-picker")
    expect(picker.props.mode).toBe("time")
    expect(picker.props.positiveButton).toEqual({ label: "OK" })
    expect(picker.props.negativeButton).toEqual({ label: "Cancel" })

    await fireEvent(picker, "dismiss")
    expect(view.queryByTestId("gallery-date-time-picker")).toBeNull()
    await fireEvent.press(view.getByTestId("gallery-date-time-open"))
    expect(view.getByTestId("gallery-date-time-picker")).toBeOnTheScreen()
  })

  it("passes the bounds", async () => {
    const view = await renderStory(fixture.Bounded)
    const picker = view.getByTestId("gallery-date-time-picker")
    expect(picker.props.minimumDate).toEqual(new Date(2030, 0, 1))
    expect(picker.props.maximumDate).toEqual(new Date(2030, 0, 31, 23, 59))
  })
})

describe("date and time picker stories on iOS", () => {
  usePlatform("ios")

  it("changes the value through the inline control", async () => {
    const view = await renderStory(fixture.DateTime)
    const options = { dateStyle: "medium", timeStyle: "short" } as const
    expect(view.getByTestId("gallery-date-time-value")).toHaveTextContent(
      format(new Date(2030, 0, 2, 9, 30), options),
    )
    await fireEvent.press(view.getByTestId("gallery-date-time-picker"))
    expect(view.getByTestId("gallery-date-time-value")).toHaveTextContent(
      format(PICKED, options),
    )
  })

  it("disables the control", async () => {
    const view = await renderStory(fixture.Disabled)
    expect(
      view.getByTestId("gallery-date-time-picker").props.accessibilityState,
    ).toEqual({ disabled: true })
  })
})
