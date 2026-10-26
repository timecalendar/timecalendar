import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./list-row.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

const COUNT = "gallery-list-row-count"

describe.each(["ios", "android"] as const)(
  "list row fixtures on %s",
  (platform) => {
    usePlatform(platform)

    it("counts presses on an action row and ignores the disabled one", async () => {
      const view = await renderStory(fixture.Plain)
      await fireEvent.press(
        view.getByTestId("gallery-list-row-plain-navigation"),
      )
      await fireEvent.press(view.getByTestId("gallery-list-row-plain-disabled"))
      expect(view.getByTestId(COUNT)).toHaveTextContent("Pressed 1 time")
    })

    it("counts the static row's accessory without activating the row", async () => {
      const view = await renderStory(fixture.Static)
      const row = view.getByTestId("gallery-list-row-static")
      expect(row.props.accessibilityRole).toBeUndefined()
      await fireEvent.press(
        view.getByTestId("gallery-list-row-static-accessory"),
      )
      expect(view.getByTestId(COUNT)).toHaveTextContent("Pressed 1 time")
    })

    it("names the text-size layout in the long-strings story", async () => {
      const view = await renderStory(fixture.LongStrings)
      expect(view.getByTestId("gallery-list-row-text-size")).toHaveTextContent(
        /text size/,
      )
    })
  },
)
