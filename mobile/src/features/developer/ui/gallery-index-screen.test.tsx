import { fireEvent, render, screen } from "@testing-library/react-native"
import { router } from "expo-router"
import type { ReactNode } from "react"

import { usePlatform } from "@/test-support/platform"

import { GalleryIndexScreen } from "./gallery-index-screen"

const mockScreenOptions = jest.fn()
jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    router: { push: jest.fn() },
    Redirect: ({ href }: { href: string }) => (
      <MockText testID="redirect">{href}</MockText>
    ),
    Stack: {
      Screen: ({ options }: { options: object }): ReactNode => {
        mockScreenOptions(options)
        return null
      },
    },
  }
})

jest.mock("@/features/environment", () => ({
  getBackendEnvironmentCapability: () => "preview",
}))

describe.each(["ios", "android"] as const)(
  "GalleryIndexScreen on %s",
  (platform) => {
    usePlatform(platform)

    it("lists one section per fixture and one row per story", async () => {
      await render(<GalleryIndexScreen />)
      expect(mockScreenOptions).toHaveBeenLastCalledWith({
        title: "Component gallery",
      })
      const sectionIds =
        platform === "android"
          ? screen
              .getAllByTestId(/^gallery-section-/)
              .map((node) =>
                String(node.props.testID).replace("gallery-section-", ""),
              )
          : [
              ...new Set(
                screen
                  .getAllByTestId(/^gallery-story-/)
                  .map(
                    (node) =>
                      String(node.props.testID)
                        .replace("gallery-story-", "")
                        .split("--")[0],
                  ),
              ),
            ]
      expect(sectionIds).toEqual([
        "root-page",
        "adaptive-content",
        "keyboard-safe-action-layout",
        "themed-text",
        "themed-view",
        "icon",
        "empty-state",
        "error-surfaces",
        "button",
        "native-settings",
        "native-text-entry-dialog",
        "native-settings-numeric-editor",
        "menu-view",
        "date-time-picker",
        "glass-surface",
        "design-tokens",
      ])
      const androidOnly = [
        "icon--glyphs",
        "native-settings--floating-action",
        "native-settings--radio-dialog",
      ]
      const iosOnly = [
        "date-time-picker--date-time",
        "date-time-picker--disabled",
      ]
      expect(
        screen
          .getAllByTestId(/^gallery-story-/)
          .map((node) =>
            String(node.props.testID).replace("gallery-story-", ""),
          ),
      ).toEqual(
        [
          "root-page--default",
          "root-page--caption-only",
          "root-page--scrolls-under-header",
          "root-page--readable-lane",
          "root-page--long-strings",
          "adaptive-content--standard-lane",
          "adaptive-content--readable-lane",
          "adaptive-content--long-strings",
          "keyboard-safe-action-layout--default",
          "keyboard-safe-action-layout--fills-viewport",
          "keyboard-safe-action-layout--long-strings",
          "themed-text--ramp",
          "themed-text--tones",
          "themed-text--long-strings",
          "themed-view--surfaces",
          "icon--scaling",
          "icon--glyphs",
          "empty-state--screen",
          "empty-state--screen-with-artwork",
          "empty-state--section",
          "empty-state--long-strings",
          "error-surfaces--state",
          "error-surfaces--state-busy",
          "error-surfaces--notice",
          "error-surfaces--notice-compact",
          "error-surfaces--field-error",
          "error-surfaces--long-strings",
          "button--filled",
          "button--tonal",
          "button--outlined",
          "button--text",
          "button--destructive",
          "button--icons",
          "button--long-strings",
          "native-settings--rows",
          "native-settings--destructive",
          "native-settings--switches",
          "native-settings--choices",
          "native-settings--header-and-alert",
          "native-settings--floating-action",
          "native-settings--radio-dialog",
          "native-settings--long-strings",
          "native-text-entry-dialog--default",
          "native-text-entry-dialog--submit-disabled",
          "native-text-entry-dialog--pending",
          "native-settings-numeric-editor--default",
          "native-settings-numeric-editor--validation-error",
          "native-settings-numeric-editor--long-strings",
          "menu-view--default",
          "menu-view--states",
          "menu-view--long-strings",
          "date-time-picker--date",
          "date-time-picker--time",
          "date-time-picker--date-time",
          "date-time-picker--bounded",
          "date-time-picker--disabled",
          "glass-surface--regular",
          "glass-surface--clear",
          "glass-surface--interactive-button",
          "glass-surface--long-strings",
          "design-tokens--colors",
          "design-tokens--contrast-pairs",
          "design-tokens--spacing",
          "design-tokens--radii",
          "design-tokens--icon-sizes",
          "design-tokens--elevation",
        ].filter((id) =>
          platform === "android"
            ? !iosOnly.includes(id)
            : !androidOnly.includes(id),
        ),
      )
      expect(
        screen.getByTestId("gallery-story-native-text-entry-dialog--pending"),
      ).toHaveTextContent(/Pending/)
      if (platform === "ios") {
        expect(
          screen.getByTestId("gallery-story-native-text-entry-dialog--pending")
            .props.accessibilityHint,
        ).toBe("Opens this component state")
      }
    })

    it("opens a story by id", async () => {
      await render(<GalleryIndexScreen />)
      await fireEvent.press(
        screen.getByTestId("gallery-story-native-settings--switches"),
      )
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: "/developer/gallery/[story]",
        params: { story: "native-settings--switches" },
      })
    })
  },
)
