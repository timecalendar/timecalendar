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
      expect(
        screen
          .getAllByTestId(/^gallery-section-/)
          .map((node) => node.props.testID),
      ).toEqual([
        "gallery-section-native-settings",
        "gallery-section-native-text-entry-dialog",
      ])
      expect(screen.getAllByTestId(/^gallery-story-/)).toHaveLength(11)
      expect(
        screen.getByTestId("gallery-story-native-text-entry-dialog--pending"),
      ).toHaveTextContent(/Pending/)
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
