import { render, screen } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { usePlatform } from "@/test-support/platform"

import { GalleryStoryScreen } from "./gallery-story-screen"

const mockScreenOptions = jest.fn()
let mockStory = "native-settings--switches"
jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    router: { push: jest.fn() },
    useLocalSearchParams: () => ({ story: mockStory }),
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

beforeEach(() => {
  mockStory = "native-settings--switches"
})

describe.each(["ios", "android"] as const)(
  "GalleryStoryScreen on %s",
  (platform) => {
    usePlatform(platform)

    it("renders the requested story under its translated title", async () => {
      await render(<GalleryStoryScreen />)
      expect(mockScreenOptions).toHaveBeenLastCalledWith({ title: "Switches" })
      expect(
        screen.getByTestId("gallery-native-settings-switch-on"),
      ).toBeOnTheScreen()
      expect(screen.queryByTestId("redirect")).toBeNull()
    })

    it("renders a dialog story", async () => {
      mockStory = "native-text-entry-dialog--submit-disabled"
      await render(<GalleryStoryScreen />)
      expect(mockScreenOptions).toHaveBeenLastCalledWith({
        title: "Submit disabled",
      })
      expect(screen.getByTestId("gallery-text-entry-dialog")).toBeOnTheScreen()
    })

    it("redirects an unknown id to the index", async () => {
      mockStory = "does-not-exist"
      await render(<GalleryStoryScreen />)
      expect(screen.getByTestId("redirect")).toHaveTextContent(
        "/developer/gallery",
      )
    })
  },
)
