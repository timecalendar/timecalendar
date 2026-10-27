import { useColorScheme } from "@/hooks/use-color-scheme"
import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"

import * as fixture from "./thumbnail.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

type Story = Parameters<typeof renderStory>[0]

const stories = Object.entries(fixture).filter(
  ([name]) => name !== "default",
) as [string, Story][]

const hidden = { includeHiddenElements: true }

describe.each(["ios", "android"] as const)(
  "thumbnail fixtures on %s",
  (platform) => {
    usePlatform(platform)

    it("lists every story export", () => {
      const exported = Object.keys(fixture).filter((name) => name !== "default")
      expect([...fixture.default.stories].sort()).toEqual(exported.sort())
    })

    describe.each(["light", "dark"] as const)("in %s", (scheme) => {
      beforeEach(() => mockUseColorScheme.mockReturnValue(scheme))

      it.each(stories)("renders %s", async (_name, story) => {
        const view = await renderStory(story)
        expect(view.toJSON()).not.toBeNull()
      })
    })

    it("shows the monogram fixture's letter", async () => {
      mockUseColorScheme.mockReturnValue("light")
      const view = await renderStory(fixture.Monogram)
      expect(
        view.getByTestId("gallery-thumbnail-monogram-monogram", hidden),
      ).toHaveTextContent("É")
    })

    it("draws one fixture per size", async () => {
      mockUseColorScheme.mockReturnValue("light")
      const view = await renderStory(fixture.Sizes)
      expect(
        view.getAllByTestId(/^gallery-thumbnail-size-\w+-tile$/, hidden),
      ).toHaveLength(2)
    })
  },
)
