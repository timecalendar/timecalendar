import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"
import { usePlatform } from "@/test-support/platform"
import { Layout } from "@/theme"

import * as fixture from "./floating-action.gallery"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

const stories = [
  fixture.Default,
  fixture.OverList,
  fixture.OverScroll,
  fixture.LongLabel,
]

describe("floating action stories on ios", () => {
  usePlatform("ios")

  it.each(stories.map((story) => [story.name, story] as const))(
    "%s renders no FAB and says why",
    async (_name, story) => {
      const view = await renderStory(story)
      expect(view.queryByTestId("gallery-floating-action")).toBeNull()
      expect(
        view.getByText("Android only: iOS adds through the navigation bar."),
      ).toBeOnTheScreen()
    },
  )
})

describe("floating action stories on android", () => {
  usePlatform("android")

  it.each(stories.map((story) => [story.name, story] as const))(
    "%s counts FAB presses",
    async (_name, story) => {
      const view = await renderStory(story)
      expect(
        view.queryByText("Android only: iOS adds through the navigation bar."),
      ).toBeNull()
      await fireEvent.press(view.getByTestId("gallery-floating-action"))
      expect(
        view.getByTestId("gallery-floating-action-count"),
      ).toHaveTextContent(/1/)
    },
  )

  it("reserves the FAB clearance under the list and the scroll view", async () => {
    const list = await renderStory(fixture.OverList)
    expect(
      list.getByTestId("compose-lazy-column-scroll-owner").props.contentPadding,
    ).toEqual({ top: 0, bottom: Layout.fabClearance })
    expect(list.getByTestId("gallery-floating-action-last-row")).toBeTruthy()

    const scroll = await renderStory(fixture.OverScroll)
    expect(
      scroll.getByTestId("gallery-floating-action-scroll").props
        .contentContainerStyle,
    ).toMatchObject({ paddingBottom: Layout.fabClearance })
  })

  it("names the FAB with the long label", async () => {
    const view = await renderStory(fixture.LongLabel)
    expect(view.getByLabelText("Add an event")).toBeTruthy()
  })
})
