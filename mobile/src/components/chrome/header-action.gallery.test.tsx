import { act, fireEvent } from "@testing-library/react-native"
import type { NativeStackNavigationOptions } from "expo-router"

import { renderStory } from "@/test-support/gallery"
import {
  headerBarItem,
  headerBarItems,
  renderHeaderSide,
} from "@/test-support/header-actions"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./header-action.gallery"

let mockOptions: NativeStackNavigationOptions | undefined
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options: NativeStackNavigationOptions }) => {
      mockOptions = options
      return null
    },
  },
}))

afterEach(() => {
  mockOptions = undefined
})

describe("header action stories on ios", () => {
  usePlatform("ios")

  it("declares two right icon bar items and counts presses", async () => {
    const view = await renderStory(fixture.Icons)
    expect(
      headerBarItems(mockOptions, "right").map((item) => item.identifier),
    ).toEqual(["gallery-header-action-today", "gallery-header-action-add"])
    expect(view.getByTestId("gallery-header-action-last")).toHaveTextContent(
      "No action pressed yet",
    )
    const add = headerBarItem(mockOptions, "right", "gallery-header-action-add")
    await act(() => {
      add?.onPress()
      add?.onPress()
    })
    expect(view.getByTestId("gallery-header-action-last")).toHaveTextContent(
      "Add: pressed 2 times",
    )
  })

  it("declares a text item with a hint, a left side, a disabled item and long labels", async () => {
    await renderStory(fixture.Text)
    expect(
      headerBarItem(mockOptions, "right", "gallery-header-action-done"),
    ).toMatchObject({
      label: "Done",
      accessibilityHint: "Saves and closes the page",
    })

    await renderStory(fixture.BothSides)
    expect(
      headerBarItem(mockOptions, "left", "gallery-header-action-cancel"),
    ).toMatchObject({ label: "Cancel" })

    await renderStory(fixture.Disabled)
    expect(
      headerBarItem(mockOptions, "right", "gallery-header-action-done")
        ?.disabled,
    ).toBe(true)

    await renderStory(fixture.LongStrings)
    expect(
      headerBarItem(mockOptions, "right", "gallery-header-action-long-icon")
        ?.accessibilityLabel,
    ).toBe("Add an event")
  })

  it("shows only the iOS item and says so", async () => {
    const view = await renderStory(fixture.PlatformOnly)
    expect(
      headerBarItems(mockOptions, "right").map((item) => item.identifier),
    ).toEqual(["gallery-header-action-ios-only"])
    expect(view.getByText(/shows the iOS-only action/)).toBeOnTheScreen()
  })
})

describe("header action stories on android", () => {
  usePlatform("android")

  it("renders the header buttons and records the last press", async () => {
    const view = await renderStory(fixture.BothSides)
    const left = await renderHeaderSide(mockOptions, "left")
    await fireEvent.press(left.getByTestId("gallery-header-action-cancel"))
    expect(view.getByTestId("gallery-header-action-last")).toHaveTextContent(
      "Cancel: pressed 1 time",
    )
    const right = await renderHeaderSide(mockOptions, "right")
    expect(right.getByRole("button", { name: "Add" }).props.testID).toBe(
      "gallery-header-action-add",
    )
  })

  it("shows only the Android item and says so", async () => {
    const view = await renderStory(fixture.PlatformOnly)
    expect(view.getByText(/shows the Android-only action/)).toBeOnTheScreen()
    const right = await renderHeaderSide(mockOptions, "right")
    expect(right.queryByTestId("gallery-header-action-ios-only")).toBeNull()
    expect(
      right.getByTestId("gallery-header-action-android-only"),
    ).toBeOnTheScreen()
  })

  it("keeps the long text action on one line, named by its label then hint", async () => {
    await renderStory(fixture.LongStrings)
    const right = await renderHeaderSide(mockOptions, "right")
    const text = right.getByTestId("gallery-header-action-long-text")
    expect(text.props.accessibilityLabel).toBe(
      "Add this course to every calendar you follow, Automatically sync the timetables of every programme you follow this year",
    )
  })
})
