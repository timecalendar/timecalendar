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
        "status-view",
        "error-surfaces",
        "button",
        "button-row",
        "text-field",
        "date-time-field",
        "list-row",
        "list-section",
        "separator",
        "badge",
        "color-dot",
        "native-list",
        "native-text-entry-dialog",
        "native-list-numeric-editor",
        "menu-view",
        "header-action",
        "floating-action",
        "date-time-picker",
        "glass-surface",
        "design-tokens",
      ])
      const androidOnly = ["icon--glyphs", "native-list--radio-dialog"]
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
          "status-view--loading-screen",
          "status-view--loading-section",
          "status-view--loading-inline",
          "status-view--empty-screen",
          "status-view--empty-screen-artwork",
          "status-view--empty-section",
          "status-view--empty-inline",
          "status-view--error-screen",
          "status-view--error-retry-busy",
          "status-view--error-section",
          "status-view--long-strings",
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
          "button-row--pair",
          "button-row--long-strings",
          "text-field--default",
          "text-field--helper",
          "text-field--error",
          "text-field--disabled",
          "text-field--multiline",
          "text-field--keyboard",
          "text-field--long-strings",
          "date-time-field--default",
          "date-time-field--error",
          "date-time-field--disabled",
          "date-time-field--long-strings",
          "list-row--plain",
          "list-row--grouped",
          "list-row--states",
          "list-row--leading",
          "list-row--static",
          "list-row--overline",
          "list-row--long-strings",
          "list-section--titled",
          "list-section--single",
          "list-section--seam-comparison",
          "list-section--long-strings",
          "separator--insets",
          "badge--tones",
          "badge--sizes",
          "badge--with-icon",
          "badge--accessibility",
          "badge--long-strings",
          "color-dot--sizes",
          "color-dot--presets",
          "color-dot--rings",
          "color-dot--stack",
          "native-list--rows",
          "native-list--destructive",
          "native-list--switches",
          "native-list--choices",
          "native-list--header-and-alert",
          "native-list--radio-dialog",
          "native-list--long-strings",
          "native-text-entry-dialog--default",
          "native-text-entry-dialog--submit-disabled",
          "native-text-entry-dialog--pending",
          "native-list-numeric-editor--default",
          "native-list-numeric-editor--validation-error",
          "native-list-numeric-editor--long-strings",
          "menu-view--default",
          "menu-view--states",
          "menu-view--long-strings",
          "header-action--icons",
          "header-action--text",
          "header-action--both-sides",
          "header-action--disabled",
          "header-action--platform-only",
          "header-action--long-strings",
          "floating-action--default",
          "floating-action--over-list",
          "floating-action--over-scroll",
          "floating-action--long-label",
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
        screen.getByTestId("gallery-story-native-list--switches"),
      )
      expect(router.push).toHaveBeenLastCalledWith({
        pathname: "/developer/gallery/[story]",
        params: { story: "native-list--switches" },
      })
    })
  },
)
