import { fireEvent, render } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"

import { NativeSettingsNumericEditor } from "./native-settings-numeric-editor"

const ids = {
  container: "numeric-container",
  field: "numeric-field",
  cancel: "numeric-cancel",
  submit: "numeric-submit",
  message: "numeric-message",
}

const props = {
  title: "Days",
  label: "Whole number",
  initialValue: "12",
  cancelLabel: "Cancel",
  submitLabel: "Save",
  validationMessage: "Invalid value",
  ids,
  onCancel: jest.fn(),
  onSubmit: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

describe("NativeSettingsNumericEditor on iOS", () => {
  usePlatform("ios")

  it("owns one form, numeric keyboard, identifiers, and the current native buffer", async () => {
    const view = await render(<NativeSettingsNumericEditor {...props} />)
    expect(view.getAllByTestId("swiftui-form-scroll-owner")).toHaveLength(1)
    expect(view.getByTestId("swiftui-host").props.colorScheme).toMatch(
      /light|dark/,
    )
    expect(view.getByTestId(ids.field).props.keyboardType).toBe("numeric")
    expect(view.getByTestId(ids.field).props.returnKeyType).toBe("done")
    expect(view.getByTestId(ids.message)).toBeTruthy()

    await fireEvent.changeText(view.getByTestId(ids.field), "29")
    await fireEvent.press(view.getByTestId(ids.submit))
    expect(props.onSubmit).toHaveBeenCalledWith("29")
    await fireEvent.press(view.getByTestId(ids.cancel))
    expect(props.onCancel).toHaveBeenCalledTimes(1)
  })
})

describe("NativeSettingsNumericEditor on Android", () => {
  usePlatform("android")

  it("keeps outside taps inert, maps Back to cancel, and submits the current buffer", async () => {
    const view = await render(<NativeSettingsNumericEditor {...props} />)
    expect(view.getByTestId("compose-host").props.colorScheme).toMatch(
      /light|dark/,
    )
    const dialog = view.getByTestId(ids.container)
    expect(dialog.props.properties).toEqual({
      dismissOnBackPress: true,
      dismissOnClickOutside: false,
    })
    expect(view.getByTestId(ids.field).props.keyboardType).toBe("number")

    await fireEvent.changeText(view.getByTestId(ids.field), "30")
    await fireEvent.press(view.getByTestId(ids.submit))
    expect(props.onSubmit).toHaveBeenCalledWith("30")
    await fireEvent(dialog, "dismissRequest")
    expect(props.onCancel).toHaveBeenCalledTimes(1)
  })
})
