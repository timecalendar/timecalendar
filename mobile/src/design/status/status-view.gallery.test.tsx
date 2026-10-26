import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"

import * as fixture from "./status-view.gallery"

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: mockFontScale,
  }),
}))

beforeEach(() => {
  mockFontScale = 1
})

const count = (view: Awaited<ReturnType<typeof renderStory>>) =>
  view.getByTestId("gallery-status-view-count")

it("counts presses on the retry and secondary actions", async () => {
  const view = await renderStory(fixture.ErrorScreen)
  await fireEvent.press(view.getByTestId("gallery-status-view-primary"))
  await fireEvent.press(view.getByTestId("gallery-status-view-secondary"))
  expect(count(view)).toHaveTextContent("Pressed 2 times")
})

it("ignores presses while the retry is busy", async () => {
  const view = await renderStory(fixture.ErrorRetryBusy)
  const retry = view.getByTestId("gallery-status-view-primary")
  expect(retry.props.accessibilityState).toEqual({ disabled: true, busy: true })
  await fireEvent.press(retry)
  await fireEvent.press(view.getByTestId("gallery-status-view-secondary"))
  expect(count(view)).toHaveTextContent("Pressed 0 times")
})

it.each([
  ["EmptyScreenArtwork", fixture.EmptyScreenArtwork, "primary"],
  ["EmptySection", fixture.EmptySection, "secondary"],
  ["ErrorSection", fixture.ErrorSection, "primary"],
])("counts the %s action", async (_name, story, action) => {
  const view = await renderStory(story)
  await fireEvent.press(view.getByTestId(`gallery-status-view-${action}`))
  expect(count(view)).toHaveTextContent("Pressed 1 time")
})

it("captions the artwork branch of the long-strings story", async () => {
  const view = await renderStory(fixture.LongStrings)
  expect(
    view.getByTestId("gallery-status-view-artwork-state"),
  ).toHaveTextContent("Artwork shown at this text size")
  expect(
    view.getByTestId("gallery-status-view-artwork", {
      includeHiddenElements: true,
    }),
  ).toBeTruthy()
  for (const action of view.getAllByRole("button")) {
    await fireEvent.press(action)
  }
  expect(count(view)).toHaveTextContent("Pressed 2 times")

  mockFontScale = 2
  const large = await renderStory(fixture.LongStrings)
  expect(
    large.getByTestId("gallery-status-view-artwork-state"),
  ).toHaveTextContent("Artwork hidden at this text size")
  expect(
    large.queryByTestId("gallery-status-view-artwork", {
      includeHiddenElements: true,
    }),
  ).toBeNull()
})
