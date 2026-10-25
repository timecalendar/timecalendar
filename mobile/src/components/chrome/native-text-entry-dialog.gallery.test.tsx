import { render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import { usePlatform } from "@/test-support/platform"

import * as fixture from "./native-text-entry-dialog.gallery"

function renderStory(story: { render?: (args: object) => ReactElement }) {
  return render(story.render!({}))
}

describe.each(["ios", "android"] as const)(
  "text entry dialog stories on %s",
  (platform) => {
    usePlatform(platform)

    const disabled = (view: Awaited<ReturnType<typeof render>>) =>
      view.getByTestId("gallery-text-entry-submit").props.accessibilityState
        .disabled

    it("enables submit by default", async () => {
      const view = await renderStory(fixture.Default)
      expect(view.getByTestId("gallery-text-entry-dialog")).toBeOnTheScreen()
      expect(view.getByTestId("gallery-text-entry-input").props.value).toBe(
        "Master 1 Computer Science",
      )
      expect(disabled(view)).toBe(false)
      expect(view.queryByTestId("gallery-text-entry-message")).toBeNull()
    })

    it("disables submit for an empty value", async () => {
      const view = await renderStory(fixture.SubmitDisabled)
      expect(view.getByTestId("gallery-text-entry-input").props.value).toBe("")
      expect(disabled(view)).toBe(true)
    })

    it("locks the field and shows progress while pending", async () => {
      const view = await renderStory(fixture.Pending)
      expect(disabled(view)).toBe(true)
      expect(view.getByTestId("gallery-text-entry-input").props.editable).toBe(
        false,
      )
      expect(
        view.getByTestId(`native-text-entry-dialog-${platform}-progress`),
      ).toBeOnTheScreen()
      expect(view.getByTestId("gallery-text-entry-message")).toHaveTextContent(
        "Enter a name of at most 40 characters",
      )
    })
  },
)
