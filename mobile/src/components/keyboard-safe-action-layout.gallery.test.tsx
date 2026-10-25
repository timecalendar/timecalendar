import { fireEvent, render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import * as fixture from "./keyboard-safe-action-layout.gallery"

function renderStory(story: { render?: (args: object) => ReactElement }) {
  return render(story.render!({}))
}

it.each([
  ["Default", fixture.Default],
  ["FillsViewport", fixture.FillsViewport],
])("keeps the %s field editable above the action", async (_name, story) => {
  const view = await renderStory(story)
  const input = view.getByTestId("gallery-keyboard-layout-input")
  await fireEvent.changeText(input, "Lyon")
  expect(input.props.value).toBe("Lyon")
  await fireEvent.press(view.getByTestId("gallery-keyboard-layout-submit"))
  expect(view.getByTestId("gallery-keyboard-layout")).toBeOnTheScreen()
})

it("keeps every long-string field independently editable", async () => {
  const view = await renderStory(fixture.LongStrings)
  await fireEvent.changeText(
    view.getByTestId("gallery-keyboard-layout-input-1"),
    "Lyon",
  )
  expect(view.getByTestId("gallery-keyboard-layout-input-1").props.value).toBe(
    "Lyon",
  )
  expect(view.getByTestId("gallery-keyboard-layout-input-4").props.value).toBe(
    "",
  )
  expect(view.getByTestId("gallery-keyboard-layout-submit")).toBeOnTheScreen()
})
