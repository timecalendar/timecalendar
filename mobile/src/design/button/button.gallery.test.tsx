import { fireEvent } from "@testing-library/react-native"

import { renderStory } from "@/test-support/gallery"

import * as fixture from "./button.gallery"

const variantStories = [
  ["filled", fixture.Filled],
  ["tonal", fixture.Tonal],
  ["outlined", fixture.Outlined],
  ["text", fixture.Text],
  ["destructive", fixture.Destructive],
] as const

it.each(variantStories)(
  "counts presses on enabled %s buttons only",
  async (variant, story) => {
    const view = await renderStory(story)
    for (const size of ["small", "medium", "large"]) {
      await fireEvent.press(
        view.getByTestId(`gallery-button-${variant}-${size}-enabled`),
      )
      await fireEvent.press(
        view.getByTestId(`gallery-button-${variant}-${size}-disabled`),
      )
      await fireEvent.press(
        view.getByTestId(`gallery-button-${variant}-${size}-busy`),
      )
    }
    expect(view.getByTestId("gallery-button-count")).toHaveTextContent(
      "Pressed 3 times",
    )
  },
)

it("exposes busy state and keeps the label on a busy button", async () => {
  const view = await renderStory(fixture.Filled)
  const busy = view.getByTestId("gallery-button-filled-medium-busy")
  expect(busy.props.accessibilityState).toEqual({ disabled: true, busy: true })
  expect(busy).toHaveProp(
    "accessibilityLabel",
    "Continue, Filled, medium, busy",
  )
  expect(
    view.getByTestId("gallery-button-filled-medium-disabled").props
      .accessibilityState,
  ).toEqual({ disabled: true, busy: false })
})

it("counts presses on the icon and long-string buttons", async () => {
  const icons = await renderStory(fixture.Icons)
  await fireEvent.press(icons.getByTestId("gallery-button-trailing-text"))
  await fireEvent.press(icons.getByTestId("gallery-button-icon-busy"))
  expect(icons.getByTestId("gallery-button-count")).toHaveTextContent(
    "Pressed 1 time",
  )

  const long = await renderStory(fixture.LongStrings)
  await fireEvent.press(long.getByTestId("gallery-button-long-word"))
  await fireEvent.press(long.getByTestId("gallery-button-long-row-long"))
  expect(long.getByTestId("gallery-button-count")).toHaveTextContent(
    "Pressed 2 times",
  )
})
