import { fireEvent, render } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { NativeList } from "./native-list"
import { NativeListNumericEditor } from "./native-list-numeric-editor"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "dark",
}))

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

describe("NativeListNumericEditor on iOS", () => {
  usePlatform("ios")

  it("owns one form, numeric keyboard, identifiers, and the current native buffer", async () => {
    const view = await render(<NativeListNumericEditor {...props} />)
    expect(view.getByTestId("swiftui-form-scroll-owner").props.tint).toBe(
      Colors.dark.primary,
    )
    expect(view.getByTestId("swiftui-host").props.colorScheme).toBe("dark")
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

describe("NativeListNumericEditor on Android", () => {
  usePlatform("android")

  it("keeps outside taps inert, maps Back to cancel, and submits the current buffer", async () => {
    const view = await render(<NativeListNumericEditor {...props} />)
    const host = view.getByTestId("compose-host")
    expect(host.props.colorScheme).toBe("dark")
    expect(host.props.seedColor).toBe(Colors.dark.primary)
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

describe.each(["ios", "android"] as const)(
  "NativeListNumericEditor placement on %s",
  (platform) => {
    usePlatform(platform)

    it("rejects rendering inside NativeList", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})
      await expect(
        render(
          <NativeList>
            <NativeListNumericEditor {...props} />
          </NativeList>,
        ),
      ).rejects.toThrow(
        "NativeListNumericEditor must render outside NativeList; place it after </NativeList>.",
      )
      consoleError.mockRestore()
    })

    it("renders as a sibling after NativeList", async () => {
      const view = await render(
        <>
          <NativeList />
          <NativeListNumericEditor {...props} />
        </>,
      )
      expect(view.getByTestId(ids.field)).toBeTruthy()
    })
  },
)
