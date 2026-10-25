import { fireEvent, render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import { usePlatform } from "@/test-support/platform"

import * as fixture from "./native-settings-numeric-editor.gallery"

function renderStory(story: { render?: (args: object) => ReactElement }) {
  return render(story.render!({}))
}

describe.each(["ios", "android"] as const)(
  "numeric editor stories on %s",
  (platform) => {
    usePlatform(platform)

    const openRow = "gallery-numeric-editor-open"
    const field = "gallery-numeric-editor-field"

    it("opens on mount; the row is behind the dialog only on Android", async () => {
      const view = await renderStory(fixture.Default)
      expect(view.getByTestId(field)).toBeOnTheScreen()
      expect(view.queryByTestId(openRow) !== null).toBe(platform === "android")
      expect(view.queryByTestId("gallery-numeric-editor-message")).toBeNull()
    })

    it("closes on Cancel and the row reopens it with the initial value", async () => {
      const view = await renderStory(fixture.Default)
      await fireEvent.press(view.getByTestId("gallery-numeric-editor-cancel"))
      expect(view.queryByTestId(field)).toBeNull()

      await fireEvent.press(view.getByTestId(openRow))
      expect(view.getByTestId(field).props.value).toBe("30")
    })

    it("closes on Submit and shows the submitted value on the row", async () => {
      const view = await renderStory(fixture.Default)
      await fireEvent.changeText(view.getByTestId(field), "45")
      await fireEvent.press(view.getByTestId("gallery-numeric-editor-submit"))
      expect(view.queryByTestId(field)).toBeNull()
      expect(view.getByTestId(openRow)).toHaveTextContent(/45/)
    })

    it("shows the validation message", async () => {
      const view = await renderStory(fixture.ValidationError)
      expect(
        view.getByTestId("gallery-numeric-editor-message"),
      ).toHaveTextContent("Enter a whole number between 1 and 365")
    })

    it("renders the long strings story", async () => {
      const view = await renderStory(fixture.LongStrings)
      expect(
        view.getByTestId("gallery-numeric-editor-message"),
      ).toBeOnTheScreen()
    })
  },
)
