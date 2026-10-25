import { act, fireEvent, render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import { usePlatform } from "@/test-support/platform"

import * as fixture from "./native-text-entry-dialog.gallery"

const PENDING_MS = 3000

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

    it("closes on Cancel and Save, and the open row brings it back", async () => {
      const view = await renderStory(fixture.Default)
      await fireEvent.press(view.getByTestId("gallery-text-entry-cancel"))
      expect(view.queryByTestId("gallery-text-entry-dialog")).toBeNull()

      await fireEvent.press(view.getByTestId("gallery-text-entry-open"))
      expect(view.getByTestId("gallery-text-entry-dialog")).toBeOnTheScreen()

      await fireEvent.press(view.getByTestId("gallery-text-entry-submit"))
      expect(view.queryByTestId("gallery-text-entry-dialog")).toBeNull()
    })

    it("releases the pending lock so the dialog can be cancelled", async () => {
      const releases: (() => void)[] = []
      const realSetTimeout = globalThis.setTimeout
      const spy = jest.spyOn(globalThis, "setTimeout").mockImplementation(((
        handler: () => void,
        delay?: number,
      ) => {
        if (delay === PENDING_MS) {
          releases.push(handler)
          return 0
        }
        return realSetTimeout(handler, delay)
      }) as typeof setTimeout)
      try {
        const view = await renderStory(fixture.Pending)
        expect(disabled(view)).toBe(true)
        expect(releases).toHaveLength(1)

        await act(() => releases[0]?.())
        expect(disabled(view)).toBe(false)
        await fireEvent.press(view.getByTestId("gallery-text-entry-cancel"))
        expect(view.queryByTestId("gallery-text-entry-dialog")).toBeNull()

        await fireEvent.press(view.getByTestId("gallery-text-entry-open"))
        expect(disabled(view)).toBe(true)
      } finally {
        spy.mockRestore()
      }
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
