import { render, screen } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { usePlatform } from "@/test-support/platform"

import { GalleryStoryScreen } from "./gallery-story-screen"

const mockScreenOptions = jest.fn()
let mockStory = "native-settings--switches"
let mockCapability = "preview"
const mockNavigation = { getState: jest.fn(), reset: jest.fn() }
jest.mock("expo-router", () => {
  const { Text: MockText } = jest.requireActual("react-native")
  return {
    router: { push: jest.fn() },
    useLocalSearchParams: () => ({ story: mockStory }),
    useNavigation: () => mockNavigation,
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
  getBackendEnvironmentCapability: () => mockCapability,
}))

const tabs = { name: "(tabs)", key: "tabs-1" }
const index = { name: "developer/gallery", key: "gallery-1" }
const story = { name: "developer/gallery/[story]", key: "story-1" }

beforeEach(() => {
  mockStory = "native-settings--switches"
  mockCapability = "preview"
  mockNavigation.getState.mockReturnValue({ index: 1, routes: [tabs, story] })
  mockNavigation.reset.mockClear()
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

    it("renders an Android-only story only on Android", async () => {
      mockStory = "native-settings--radio-dialog"
      await render(<GalleryStoryScreen />)
      if (platform === "ios") {
        expect(screen.getByTestId("redirect")).toHaveTextContent(
          "/developer/gallery",
        )
      } else {
        expect(
          screen.getByTestId("gallery-native-settings-dialog-open"),
        ).toBeOnTheScreen()
      }
    })

    it("redirects an unknown id to the index", async () => {
      mockStory = "does-not-exist"
      await render(<GalleryStoryScreen />)
      expect(screen.getByTestId("redirect")).toHaveTextContent(
        "/developer/gallery",
      )
      expect(mockNavigation.reset).not.toHaveBeenCalled()
    })

    it("puts the index beneath a deep-linked story", async () => {
      await render(<GalleryStoryScreen />)
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 2,
        routes: [
          tabs,
          {
            name: "developer/gallery",
            key: "developer/gallery-anchor-story-1",
          },
          story,
        ],
      })
    })

    it("keeps the stack of a story opened from the index", async () => {
      mockNavigation.getState.mockReturnValue({
        index: 2,
        routes: [tabs, index, story],
      })
      await render(<GalleryStoryScreen />)
      expect(mockNavigation.reset).not.toHaveBeenCalled()
    })

    it("redirects to Settings in production without touching the stack", async () => {
      mockCapability = "production"
      await render(<GalleryStoryScreen />)
      expect(screen.getByTestId("redirect")).toHaveTextContent("/settings")
      expect(mockNavigation.reset).not.toHaveBeenCalled()
    })
  },
)
