import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./badge.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

type Story = Parameters<typeof renderStory>[0]

const stories = Object.entries(fixture).filter(
  ([name]) => name !== "default",
) as [string, Story][]

describe.each(["ios", "android"] as const)(
  "badge fixtures on %s",
  (platform) => {
    usePlatform(platform)

    it("lists every story export", () => {
      const exported = Object.keys(fixture).filter((name) => name !== "default")
      expect([...fixture.default.stories].sort()).toEqual(exported.sort())
    })

    it.each(stories)("renders %s", async (_name, story) => {
      const view = await renderStory(story)
      expect(view.toJSON()).not.toBeNull()
    })

    it("reads the count as a phrase and hides the owned badge", async () => {
      const view = await renderStory(fixture.Accessibility)
      expect(
        view.getByRole("text", { name: "2 of 5 checklist items completed" }),
      ).toBeOnTheScreen()
      expect(view.queryByTestId("gallery-badge-hidden")).toBeNull()
      expect(
        view.getByTestId("gallery-badge-owner").props.accessibilityLabel,
      ).toBe("Team meeting, 2 of 5 checklist items completed")
    })

    it("names the text-size branch in the long-strings story", async () => {
      const view = await renderStory(fixture.LongStrings)
      expect(view.getByTestId("gallery-badge-text-size")).toHaveTextContent(
        /text size/,
      )
    })
  },
)
