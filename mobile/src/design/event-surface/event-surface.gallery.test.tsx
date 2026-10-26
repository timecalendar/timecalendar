import { SWATCH_PRESETS } from "@/features/personal-events/ui/color-swatch-presets"
import { useIncreasedContrast } from "@/hooks/use-increased-contrast"
import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"
import { EventFallbackColor } from "@/theme"

import * as fixture from "./event-surface.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/hooks/use-increased-contrast", () => ({
  useIncreasedContrast: jest.fn(),
}))

const mockUseIncreasedContrast = useIncreasedContrast as jest.MockedFunction<
  typeof useIncreasedContrast
>

beforeEach(() => mockUseIncreasedContrast.mockReturnValue(false))

type Story = Parameters<typeof renderStory>[0]

const stories = Object.entries(fixture).filter(
  ([name]) => name !== "default",
) as [string, Story][]

const PALETTE_ID = /^gallery-event-surface-palette-([0-9A-F]{6})$/

describe.each(["ios", "android"] as const)(
  "event surface fixtures on %s",
  (platform) => {
    usePlatform(platform)

    it("lists every story export", () => {
      const exported = Object.keys(fixture).filter((name) => name !== "default")
      expect([...fixture.default.stories].sort()).toEqual(exported.sort())
    })

    it.each(stories)(
      "renders %s with every tile one labelled button",
      async (_name, story) => {
        const view = await renderStory(story)
        const buttons = view.getAllByRole("button")
        expect(buttons.length).toBeGreaterThan(0)
        for (const button of buttons) {
          expect(button.props.accessibilityLabel).toEqual(expect.any(String))
          expect(button.props.accessibilityLabel.length).toBeGreaterThan(0)
        }
      },
    )

    it("draws every swatch preset and the fallback", async () => {
      const view = await renderStory(fixture.Palette)
      const colors = view
        .getAllByRole("button")
        .map((button) => PALETTE_ID.exec(String(button.props.testID))?.[1])
        .map((hex) => `#${hex}`)
      expect(colors).toEqual([...SWATCH_PRESETS, EventFallbackColor])
    })

    it("labels a tile title first", async () => {
      const view = await renderStory(fixture.Palette)
      expect(
        view.getByRole("button", {
          name: "Lecture in #E91E63, 09:00 – 10:30, Room B204",
        }),
      ).toBeOnTheScreen()
    })

    it.each([
      [false, /off/],
      [true, /on:/],
    ])("names the increased-contrast state (%s)", async (enabled, caption) => {
      mockUseIncreasedContrast.mockReturnValue(enabled)
      const view = await renderStory(fixture.IncreasedContrast)
      expect(
        view.getByTestId("gallery-event-surface-contrast"),
      ).toHaveTextContent(caption)
    })

    it("hides the checklist pill inside the tile's name", async () => {
      const view = await renderStory(fixture.Checklist)
      expect(
        view.queryByTestId("gallery-event-surface-checklist-partial-pill"),
      ).toBeNull()
      expect(
        view.getAllByRole("button", {
          name: /2 of 5 checklist items completed$/,
        }),
      ).toHaveLength(2)
    })

    it("names the text-size branch in the long-strings story", async () => {
      const view = await renderStory(fixture.LongStrings)
      expect(
        view.getByTestId("gallery-event-surface-text-size"),
      ).toHaveTextContent(/text size/)
    })
  },
)
