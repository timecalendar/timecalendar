import { fireEvent, render } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { usePlatform } from "@/test-support/platform"

import { SettingsGalleryScreen } from "./settings-gallery-screen"

jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    router: { push: jest.fn() },
    Redirect: ({ href }: { href: string }) => (
      <MockText testID="redirect">{href}</MockText>
    ),
    Stack: { Screen: (): ReactNode => null },
  }
})

let mockCapability: "development" | "production" = "development"
jest.mock("@/features/environment", () => ({
  getBackendEnvironmentCapability: () => mockCapability,
}))

beforeEach(() => {
  mockCapability = "development"
})

it("redirects to Settings in production", async () => {
  mockCapability = "production"
  const view = await render(<SettingsGalleryScreen />)
  expect(view.getByTestId("redirect")).toHaveTextContent("/settings")
})

describe.each(["ios", "android"] as const)(
  "SettingsGalleryScreen on %s",
  (platform) => {
    usePlatform(platform)

    it("renders every seam primitive and drives its local state", async () => {
      const view = await render(<SettingsGalleryScreen />)
      for (const id of [
        "settings-gallery-navigation",
        "settings-gallery-plain",
        "settings-gallery-action",
        "settings-gallery-value",
        "settings-gallery-error",
        "settings-gallery-error-message",
        "settings-gallery-header",
      ]) {
        expect(view.getByTestId(id)).toBeOnTheScreen()
      }
      expect(
        view.getAllByText(
          "Section footers explain the rows above them and wrap across several lines when needed.",
        ),
      ).toHaveLength(2)

      expect(
        view.getByRole("header", { name: "TimeCalendar" }),
      ).toBeOnTheScreen()
      await fireEvent.press(view.getByTestId("settings-gallery-error-retry"))
      expect(
        view.getByTestId("settings-gallery-header-caption"),
      ).toHaveTextContent("Version 1.0 · 1")

      await fireEvent.press(view.getByTestId("settings-gallery-switch-on"))
      expect(
        view.getByTestId("settings-gallery-switch-on").props.accessibilityState
          .checked,
      ).toBe(false)
      await fireEvent.press(view.getByTestId("settings-gallery-switch-off"))
      expect(
        view.getByTestId("settings-gallery-switch-off").props.accessibilityState
          .checked,
      ).toBe(true)

      await fireEvent.press(view.getByTestId("settings-gallery-choice-second"))
      expect(
        view.getByTestId("settings-gallery-choice-second").props
          .accessibilityState.selected,
      ).toBe(true)

      await fireEvent.press(view.getByTestId("settings-gallery-action"))
      if (platform === "ios") {
        expect(view.queryByTestId("settings-gallery-dialog")).toBeNull()
        return
      }
      await fireEvent.press(view.getByTestId("settings-gallery-dialog-first"))
      expect(view.queryByTestId("settings-gallery-dialog")).toBeNull()
      expect(
        view.getByTestId("settings-gallery-choice-first").props
          .accessibilityState.selected,
      ).toBe(true)

      await fireEvent.press(view.getByTestId("settings-gallery-action"))
      await fireEvent.press(view.getByTestId("settings-gallery-dialog-cancel"))
      expect(view.queryByTestId("settings-gallery-dialog")).toBeNull()
    })
  },
)
