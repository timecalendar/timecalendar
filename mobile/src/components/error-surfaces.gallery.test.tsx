import { fireEvent, render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import * as fixture from "./error-surfaces.gallery"

function renderStory(story: { render?: (args: object) => ReactElement }) {
  return render(story.render!({}))
}

const count = (view: Awaited<ReturnType<typeof renderStory>>) =>
  view.getByTestId("gallery-error-surfaces-count")

it("counts presses on both state actions", async () => {
  const view = await renderStory(fixture.State)
  await fireEvent.press(view.getByTestId("gallery-error-surfaces-primary"))
  await fireEvent.press(view.getByTestId("gallery-error-surfaces-secondary"))
  expect(count(view)).toHaveTextContent("Pressed 2 times")
})

it("ignores presses while the state is busy", async () => {
  const view = await renderStory(fixture.StateBusy)
  await fireEvent.press(view.getByTestId("gallery-error-surfaces-primary"))
  await fireEvent.press(view.getByTestId("gallery-error-surfaces-secondary"))
  expect(count(view)).toHaveTextContent("Pressed 0 times")
})

it.each([
  ["Notice", fixture.Notice, "button"],
  ["NoticeCompact", fixture.NoticeCompact, "link"],
])("counts presses on the %s action", async (_name, story, role) => {
  const view = await renderStory(story)
  const action = view.getByTestId("gallery-error-surfaces-notice-action")
  expect(action.props.accessibilityRole).toBe(role)
  await fireEvent.press(action)
  expect(count(view)).toHaveTextContent("Pressed 1 time")
})

it("keeps the field editable beside its error", async () => {
  const view = await renderStory(fixture.FieldError)
  const input = view.getByTestId("gallery-error-surfaces-input")
  await fireEvent.changeText(input, "abc")
  expect(input.props.value).toBe("abc")
  expect(input.props["aria-describedby"]).toBe(
    "gallery-error-surfaces-field-error",
  )
  expect(
    view.getByTestId("gallery-error-surfaces-field-error"),
  ).toBeOnTheScreen()
})

it("counts presses on every long-string action", async () => {
  const view = await renderStory(fixture.LongStrings)
  for (const action of view.getAllByRole("button")) {
    await fireEvent.press(action)
  }
  expect(count(view)).toHaveTextContent("Pressed 3 times")
})
