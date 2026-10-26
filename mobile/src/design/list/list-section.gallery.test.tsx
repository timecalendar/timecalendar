import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./list-section.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

describe.each(["ios", "android"] as const)(
  "list section fixtures on %s",
  (platform) => {
    usePlatform(platform)

    it("renders the same rows through ListSection and the native list seam", async () => {
      const view = await renderStory(fixture.SeamComparison)
      expect(view.getByTestId("gallery-list-section-first")).toBeOnTheScreen()
      expect(
        view.getByTestId("gallery-list-section-native-first"),
      ).toBeOnTheScreen()
      await fireEvent.press(view.getByTestId("gallery-list-section-second"))
      await fireEvent.press(
        view.getByTestId("gallery-list-section-native-second"),
      )
      expect(view.getByTestId("gallery-list-section-count")).toHaveTextContent(
        "Pressed 2 times",
      )
    })

    it("counts presses in the titled story", async () => {
      const view = await renderStory(fixture.Titled)
      await fireEvent.press(view.getByTestId("gallery-list-section-third"))
      expect(view.getByTestId("gallery-list-section-count")).toHaveTextContent(
        "Pressed 1 time",
      )
    })
  },
)
