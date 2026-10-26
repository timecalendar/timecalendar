import { act, fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./date-time-field.gallery"

const ROW = "gallery-date-time-field"

describe("on Android", () => {
  usePlatform("android")

  it("commits a date and time through both dialogs and updates the row", async () => {
    const view = await renderStory(fixture.Default)
    const before = view.getByTestId(ROW).props.accessibilityLabel as string
    expect(before).toMatch(/^Starts, /)

    await act(async () => {
      fireEvent.press(view.getByTestId(ROW))
    })
    const [date] = view.getAllByRole("adjustable")
    await act(async () => {
      fireEvent.press(date!)
    })
    const [time] = view.getAllByRole("adjustable")
    await act(async () => {
      fireEvent.press(time!)
    })

    expect(view.queryAllByRole("adjustable")).toHaveLength(0)
    expect(view.getByTestId(ROW).props.accessibilityLabel).not.toBe(before)
  })

  it("ignores presses while disabled", async () => {
    const view = await renderStory(fixture.Disabled)
    await act(async () => {
      fireEvent.press(view.getByTestId(ROW))
    })
    expect(view.queryAllByRole("adjustable")).toHaveLength(0)
  })

  it.each([
    ["Error", fixture.Error, "The end must be after the start."],
    ["LongStrings", fixture.LongStrings, undefined],
  ])("shows the %s story's error", async (_name, story, error) => {
    const view = await renderStory(story)
    expect(view.getByTestId(`${ROW}-error`)).toBeOnTheScreen()
    if (error) expect(view.getByTestId(ROW).props.accessibilityHint).toBe(error)
  })
})

it("renders the iOS inline picker", async () => {
  const view = await renderStory(fixture.Default)
  expect(view.getByTestId(ROW).props.accessibilityRole).toBe("adjustable")
})
