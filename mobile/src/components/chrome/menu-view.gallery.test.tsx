import { fireEvent, render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import { usePlatform } from "@/test-support/platform"

import * as fixture from "./menu-view.gallery"

function renderStory(story: { render?: (args: object) => ReactElement }) {
  return render(story.render!({}))
}

describe.each(["ios", "android"] as const)("menu stories on %s", (platform) => {
  usePlatform(platform)

  it("updates the trigger when an action is selected", async () => {
    const view = await renderStory(fixture.Default)
    const trigger = () => view.getByTestId("gallery-menu-trigger")
    expect(trigger().props.accessibilityLabel).toBe("View: Week")

    await fireEvent.press(trigger())
    await fireEvent.press(view.getByTestId("menu-action-agenda"))
    expect(trigger().props.accessibilityLabel).toBe("View: Agenda")
    expect(trigger()).toHaveTextContent("Agenda")
  })

  it("opens through the activate accessibility action", async () => {
    const view = await renderStory(fixture.Default)
    await fireEvent(
      view.getByTestId("gallery-menu-trigger"),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "activate" },
      },
    )
    expect(view.getByTestId("menu-action-day")).toBeOnTheScreen()
  })

  it("marks the current choice and reports other actions", async () => {
    const view = await renderStory(fixture.States)
    await fireEvent.press(view.getByTestId("gallery-menu-trigger"))
    expect(
      view.getByTestId("menu-action-week").props.accessibilityState,
    ).toEqual({ disabled: false, selected: true })
    expect(
      view.getByTestId("menu-action-disabled").props.accessibilityState,
    ).toEqual({ disabled: true, selected: false })

    await fireEvent.press(view.getByTestId("menu-action-delete"))
    expect(view.getByTestId("gallery-menu-last-action")).toHaveTextContent(
      "Last action: delete",
    )
  })

  it("renders the long strings story", async () => {
    const view = await renderStory(fixture.LongStrings)
    await fireEvent.press(view.getByTestId("gallery-menu-trigger"))
    await fireEvent.press(view.getByTestId("menu-action-day"))
    expect(view.getByTestId("gallery-menu-trigger")).toHaveTextContent(
      /Add this course/,
    )
  })
})
