import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./color-swatch-field.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

type Story = Parameters<typeof renderStory>[0]

const stories = Object.entries(fixture).filter(
  ([name]) => name !== "default",
) as [string, Story][]

describe.each(["ios", "android"] as const)(
  "color swatch field fixtures on %s",
  (platform) => {
    usePlatform(platform)

    const selection = (swatch: { props: { accessibilityState?: object } }) =>
      swatch.props.accessibilityState as {
        selected?: boolean
        checked?: boolean
      }
    const isSelected = (swatch: Parameters<typeof selection>[0]) => {
      const state = selection(swatch)
      return platform === "ios" ? state.selected : state.checked
    }

    it("lists every story export", () => {
      const exported = Object.keys(fixture).filter((name) => name !== "default")
      expect([...fixture.default.stories].sort()).toEqual(exported.sort())
    })

    it.each(stories)("renders %s", async (_name, story) => {
      const view = await renderStory(story)
      expect(view.toJSON()).not.toBeNull()
    })

    it("moves the selection when a swatch is pressed", async () => {
      const view = await renderStory(fixture.Default)
      const first = () => view.getByTestId("gallery-color-swatch-field-#E91E63")
      const teal = () => view.getByTestId("gallery-color-swatch-field-#009688")
      expect(isSelected(first())).toBe(true)
      expect(isSelected(teal())).toBe(false)

      await fireEvent.press(teal())

      expect(isSelected(first())).toBe(false)
      expect(isSelected(teal())).toBe(true)
    })
  },
)
