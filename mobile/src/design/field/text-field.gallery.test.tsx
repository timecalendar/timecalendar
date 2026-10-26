import { fireEvent } from "@testing-library/react-native"
import { TextInput } from "react-native"

import { renderStory } from "@/test-support/gallery"

import * as fixture from "./text-field.gallery"

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

it("toggles the error and its hint", async () => {
  const view = await renderStory(fixture.Error)
  const input = () => view.getByTestId("gallery-text-field-input")
  expect(view.getByTestId("gallery-text-field-input-error")).toHaveTextContent(
    "Enter a calendar name.",
  )
  expect(input().props.accessibilityHint).toBe(
    "Enter a calendar name. Shown in your calendar list.",
  )

  await fireEvent.press(view.getByTestId("gallery-text-field-toggle-error"))
  expect(view.queryByTestId("gallery-text-field-input-error")).toBeNull()
  expect(input().props.accessibilityHint).toBe("Shown in your calendar list.")

  await fireEvent.press(view.getByTestId("gallery-text-field-toggle-error"))
  expect(view.getByTestId("gallery-text-field-input-error")).toBeOnTheScreen()
})

it("moves focus from the email field to the message on Next", async () => {
  const focus = jest.spyOn(TextInput.prototype, "focus")
  const view = await renderStory(fixture.Keyboard)
  const email = view.getByTestId("gallery-text-field-email")
  expect(email.props.submitBehavior).toBe("submit")
  await fireEvent(email, "submitEditing")
  expect(focus).toHaveBeenCalledTimes(1)
  focus.mockRestore()
})

it.each([
  [1, "Standard text size."],
  [2, "Accessibility text size is on."],
])("captions the long strings at font scale %p", async (scale, caption) => {
  mockFontScale = scale
  const view = await renderStory(fixture.LongStrings)
  expect(view.getByTestId("gallery-text-field-text-size")).toHaveTextContent(
    caption,
  )
})

it.each([
  ["Default", fixture.Default],
  ["Helper", fixture.Helper],
  ["Multiline", fixture.Multiline],
])("keeps the %s field editable", async (_name, story) => {
  const view = await renderStory(story)
  await fireEvent.changeText(view.getByTestId("gallery-text-field-input"), "L3")
  expect(view.getByTestId("gallery-text-field-input").props.value).toBe("L3")
})

it("renders the disabled field read-only", async () => {
  const view = await renderStory(fixture.Disabled)
  expect(view.getByTestId("gallery-text-field-input").props.editable).toBe(
    false,
  )
})
