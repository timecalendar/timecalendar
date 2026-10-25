import { fireEvent, render } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./native-settings.gallery"

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: (): ReactNode => null },
}))

const checked = (view: Awaited<ReturnType<typeof render>>, testID: string) =>
  view.getByTestId(testID).props.accessibilityState.checked

describe.each(["ios", "android"] as const)(
  "native settings stories on %s",
  (platform) => {
    usePlatform(platform)

    it("renders every row kind with its footer", async () => {
      const view = await renderStory(fixture.Rows)
      for (const id of [
        "gallery-native-settings-navigation",
        "gallery-native-settings-plain",
        "gallery-native-settings-action",
        "gallery-native-settings-value",
        "gallery-native-settings-subtitle",
      ]) {
        expect(view.getByTestId(id)).toBeOnTheScreen()
      }
      expect(
        view.getByText(
          "Section footers explain the rows above them and wrap across several lines when needed.",
        ),
      ).toBeOnTheScreen()
      await fireEvent.press(view.getByTestId("gallery-native-settings-action"))
      expect(
        view.getByTestId("gallery-native-settings-action"),
      ).toHaveTextContent(/1/)
    })

    it("counts destructive presses", async () => {
      const view = await renderStory(fixture.Destructive)
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-destructive"),
      )
      expect(
        view.getByTestId("gallery-native-settings-destructive"),
      ).toHaveTextContent(/1/)
    })

    it("toggles both switches", async () => {
      const view = await renderStory(fixture.Switches)
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-switch-on"),
      )
      expect(checked(view, "gallery-native-settings-switch-on")).toBe(false)
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-switch-off"),
      )
      expect(checked(view, "gallery-native-settings-switch-off")).toBe(true)
    })

    it("selects one choice", async () => {
      const view = await renderStory(fixture.Choices)
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-choice-second"),
      )
      expect(
        view.getByTestId("gallery-native-settings-choice-second").props
          .accessibilityState.selected,
      ).toBe(true)
    })

    it("counts retries in the header caption under a heading", async () => {
      const view = await renderStory(fixture.HeaderAndAlert)
      expect(
        view.getByRole("header", { name: "TimeCalendar" }),
      ).toBeOnTheScreen()
      expect(
        view.getByTestId("gallery-native-settings-error-message"),
      ).toBeOnTheScreen()
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-error-retry"),
      )
      expect(
        view.getByTestId("gallery-native-settings-header-caption"),
      ).toHaveTextContent("Version 1.0 · 1")
    })

    it("shows the floating action on Android only", async () => {
      const view = await renderStory(fixture.FloatingAction)
      if (platform === "ios") {
        expect(view.queryByTestId("gallery-native-settings-fab")).toBeNull()
        return
      }
      await fireEvent.press(view.getByTestId("gallery-native-settings-fab"))
      expect(
        view.getByTestId("gallery-native-settings-fab-count"),
      ).toHaveTextContent(/1/)
    })

    it("opens the radio dialog on Android only", async () => {
      const view = await renderStory(fixture.RadioDialog)
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-dialog-open"),
      )
      if (platform === "ios") {
        expect(view.queryByTestId("gallery-native-settings-dialog")).toBeNull()
        return
      }
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-dialog-second"),
      )
      expect(view.queryByTestId("gallery-native-settings-dialog")).toBeNull()
      expect(
        view.getByTestId("gallery-native-settings-choice-second").props
          .accessibilityState.selected,
      ).toBe(true)

      await fireEvent.press(
        view.getByTestId("gallery-native-settings-dialog-open"),
      )
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-dialog-cancel"),
      )
      expect(view.queryByTestId("gallery-native-settings-dialog")).toBeNull()
    })

    it("renders the long French-length copy", async () => {
      const view = await renderStory(fixture.LongStrings)
      expect(
        view.getByTestId("gallery-native-settings-long-navigation"),
      ).toHaveTextContent(/99\+/)
      expect(
        view.getByTestId("gallery-native-settings-long-word"),
      ).toBeOnTheScreen()
      await fireEvent.press(
        view.getByTestId("gallery-native-settings-long-switch"),
      )
      expect(checked(view, "gallery-native-settings-long-switch")).toBe(false)
    })
  },
)
