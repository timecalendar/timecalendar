import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./color-dot.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

type Story = Parameters<typeof renderStory>[0]

const stories = Object.entries(fixture).filter(
  ([name]) => name !== "default",
) as [string, Story][]

describe.each(["ios", "android"] as const)(
  "color dot fixtures on %s",
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

    it("caps the stack at five ringed dots and counts the rest", async () => {
      const view = await renderStory(fixture.Stack)
      expect(
        view.queryAllByTestId(/^gallery-color-dot-stack-\d$/, {
          includeHiddenElements: true,
        }),
      ).toHaveLength(5)
      expect(view.getByTestId("gallery-color-dot-overflow")).toHaveTextContent(
        "+2",
      )
      expect(
        view.getByTestId("gallery-color-dot-stack").props.accessibilityLabel,
      ).toBe("7 events")
    })
  },
)
