import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"

import * as fixture from "./primary-action.gallery"

it("counts presses on the default story", async () => {
  const view = await renderStory(fixture.Default)
  expect(view.getByTestId("gallery-primary-action-count")).toHaveTextContent(
    "Pressed 0 times",
  )
  await fireEvent.press(view.getByTestId("gallery-primary-action"))
  expect(view.getByTestId("gallery-primary-action-count")).toHaveTextContent(
    "Pressed 1 time",
  )
})

it.each([
  ["Disabled", fixture.Disabled, { disabled: true, busy: false }],
  ["Busy", fixture.Busy, { disabled: true, busy: true }],
])("ignores presses on the %s story", async (_name, story, state) => {
  const view = await renderStory(story)
  const action = view.getByTestId("gallery-primary-action")
  expect(action.props.accessibilityState).toEqual(state)
  await fireEvent.press(action)
  expect(view.getByTestId("gallery-primary-action-count")).toHaveTextContent(
    "Pressed 0 times",
  )
})

it("counts presses on both long-string actions", async () => {
  const view = await renderStory(fixture.LongStrings)
  await fireEvent.press(view.getByTestId("gallery-primary-action"))
  await fireEvent.press(view.getByTestId("gallery-primary-action-word"))
  expect(view.getByTestId("gallery-primary-action-count")).toHaveTextContent(
    "Pressed 2 times",
  )
})
