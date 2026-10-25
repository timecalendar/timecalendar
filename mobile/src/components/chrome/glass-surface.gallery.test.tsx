import { fireEvent, render } from "@testing-library/react-native"
import type { ReactElement } from "react"

import * as fixture from "./glass-surface.gallery"

function renderStory(story: { render?: (args: object) => ReactElement }) {
  return render(story.render!({}))
}

it("counts presses on the interactive glass button", async () => {
  const view = await renderStory(fixture.InteractiveButton)
  expect(view.getByTestId("gallery-glass-count")).toHaveTextContent(
    "Pressed 0 times",
  )
  await fireEvent.press(view.getByTestId("gallery-glass-button"))
  expect(view.getByTestId("gallery-glass-count")).toHaveTextContent(
    "Pressed 1 time",
  )
})

it.each([
  ["Regular", fixture.Regular, "regular"],
  ["Clear", fixture.Clear, "clear"],
  ["LongStrings", fixture.LongStrings, "regular"],
])("renders the %s surface over the backdrop", async (_name, story, style) => {
  const view = await renderStory(story)
  expect(view.getByTestId("gallery-glass-backdrop")).toBeOnTheScreen()
  expect(view.getByTestId("gallery-glass-surface").props.glassEffectStyle).toBe(
    style,
  )
})
