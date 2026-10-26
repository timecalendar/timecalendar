import { fireEvent, render, screen } from "@testing-library/react-native"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { NativeList } from "./native-list"
import { NativeTextEntryDialog } from "./native-text-entry-dialog"

const onCancel = jest.fn()
const onChange = jest.fn()
const onSubmit = jest.fn()

const props = {
  title: "Rename calendar",
  initialValue: "ENSEEIHT",
  label: "Calendar name",
  placeholder: "My timetable",
  message: null,
  cancelLabel: "Cancel",
  submitLabel: "Save",
  pending: false,
  submitDisabled: false,
  ids: {
    dialog: "user-calendar-rename-dialog",
    input: "user-calendar-rename-input",
    message: "user-calendar-rename-message",
    cancel: "user-calendar-rename-cancel",
    submit: "user-calendar-rename-save",
  },
  onCancel,
  onChange,
  onSubmit,
}

beforeEach(() => jest.clearAllMocks())

describe("NativeTextEntryDialog on iOS", () => {
  usePlatform("ios")

  it("presents a native brand-tinted sheet that cannot be swiped away while saving", async () => {
    const view = await render(<NativeTextEntryDialog {...props} />)

    expect(screen.getByTestId("native-text-entry-dialog-ios-host")).toBeTruthy()
    const groupModifiers = () =>
      screen.getByTestId("swiftui-group").props.modifiers as {
        $type: string
        value: unknown
      }[]
    const modifierOf = (type: string) =>
      groupModifiers().find((modifier) => modifier.$type === type)?.value
    expect(modifierOf("presentationDetents")).toEqual(["medium", "large"])
    expect(modifierOf("presentationDragIndicator")).toBe("visible")
    expect(modifierOf("tint")).toBe(Colors.light.primary)
    expect(modifierOf("interactiveDismissDisabled")).toBe(false)
    expect(screen.getByText("Rename calendar")).toBeTruthy()
    expect(
      groupModifiers().some(
        (modifier) => modifier.$type === "accessibilityIdentifier",
      ),
    ).toBe(false)

    await view.rerender(<NativeTextEntryDialog {...props} pending />)
    expect(modifierOf("interactiveDismissDisabled")).toBe(true)
    expect(
      screen.getByTestId(props.ids.cancel).props.accessibilityState.disabled,
    ).toBe(true)
  })

  it("identifies the title and each control as distinct leaves", async () => {
    await render(<NativeTextEntryDialog {...props} />)

    expect(screen.getByTestId(props.ids.dialog)).toHaveTextContent(
      "Rename calendar",
    )
    for (const id of [props.ids.cancel, props.ids.submit, props.ids.input]) {
      expect(id).not.toBe(props.ids.dialog)
      expect(screen.getAllByTestId(id)).toHaveLength(1)
    }
    expect(screen.getByTestId(props.ids.input)).not.toBe(
      screen.getByTestId(props.ids.submit),
    )
  })

  it("cancels when the sheet is swiped down", async () => {
    await render(<NativeTextEntryDialog {...props} />)
    await fireEvent(
      screen.getByTestId("swiftui-bottom-sheet"),
      "isPresentedChange",
      true,
    )
    expect(onCancel).not.toHaveBeenCalled()
    await fireEvent(
      screen.getByTestId("swiftui-bottom-sheet"),
      "isPresentedChange",
      false,
    )
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("submits from the keyboard only while saving is allowed", async () => {
    const view = await render(<NativeTextEntryDialog {...props} />)
    await fireEvent(screen.getByTestId(props.ids.input), "submitEditing")
    expect(onSubmit).toHaveBeenCalledWith("ENSEEIHT")

    await view.rerender(<NativeTextEntryDialog {...props} submitDisabled />)
    await fireEvent(screen.getByTestId(props.ids.input), "submitEditing")
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("submits the current native buffer and preserves it across busy/error rerenders", async () => {
    const view = await render(<NativeTextEntryDialog {...props} />)
    await fireEvent.changeText(
      screen.getByTestId(props.ids.input),
      "Fast draft",
    )
    expect(onChange).toHaveBeenCalledWith("Fast draft")

    await view.rerender(
      <NativeTextEntryDialog {...props} pending message="Could not save" />,
    )
    expect(screen.getByTestId(props.ids.input).props.value).toBe("Fast draft")
    expect(
      screen.getByTestId("native-text-entry-dialog-ios-progress"),
    ).toBeTruthy()
    expect(
      screen.getByTestId(props.ids.submit).props.accessibilityState.disabled,
    ).toBe(true)

    await view.rerender(
      <NativeTextEntryDialog {...props} message="Could not save" />,
    )
    await fireEvent.press(screen.getByTestId(props.ids.submit))
    expect(onSubmit).toHaveBeenCalledWith("Fast draft")
  })

  it("disables auto-capitalization and autocorrect only for code input", async () => {
    const view = await render(<NativeTextEntryDialog {...props} />)
    expect(screen.getByTestId(props.ids.input).props.autoCapitalize).toBe(
      undefined,
    )
    expect(screen.getByTestId(props.ids.input).props.autoCorrect).toBe(
      undefined,
    )

    await view.rerender(<NativeTextEntryDialog {...props} inputKind="code" />)
    expect(screen.getByTestId(props.ids.input).props.autoCapitalize).toBe(
      "none",
    )
    expect(screen.getByTestId(props.ids.input).props.autoCorrect).toBe(false)
  })

  it("exposes native selectors and cancels from the sheet header", async () => {
    await render(<NativeTextEntryDialog {...props} message="Too long" />)
    expect(screen.getByTestId(props.ids.input)).toBeTruthy()
    expect(screen.getByTestId(props.ids.message)).toHaveTextContent("Too long")
    expect(screen.getByTestId(props.ids.submit)).toBeTruthy()
    await fireEvent.press(screen.getByTestId(props.ids.cancel))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe("NativeTextEntryDialog on Android", () => {
  usePlatform("android")

  it("uses Material 3 dialog primitives with deliberate dismissal and IME policy", async () => {
    await render(<NativeTextEntryDialog {...props} message="Could not save" />)

    expect(
      screen.getByTestId("native-text-entry-dialog-android-host"),
    ).toBeTruthy()
    const dialog = screen.getByTestId(props.ids.dialog)
    expect(dialog.props.properties).toEqual({
      dismissOnBackPress: true,
      dismissOnClickOutside: false,
      usePlatformDefaultWidth: true,
      decorFitsSystemWindows: true,
    })
    expect(
      screen.getByTestId("native-text-entry-dialog-android-content"),
    ).toBeTruthy()
    expect(screen.getByTestId(props.ids.message)).toBeTruthy()

    await fireEvent(dialog, "dismissRequest")
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("marks only validation failures as invalid and preserves operation retry input", async () => {
    const view = await render(
      <NativeTextEntryDialog
        {...props}
        message="Name too long"
        messageKind="validation"
      />,
    )
    expect(
      screen.getByTestId(props.ids.input).props.accessibilityState.invalid,
    ).toBe(true)
    await view.rerender(
      <NativeTextEntryDialog
        {...props}
        message="Could not save"
        messageKind="operation"
      />,
    )
    expect(
      screen.getByTestId(props.ids.input).props.accessibilityState.invalid,
    ).toBe(false)
    expect(screen.getByTestId(props.ids.message)).toHaveTextContent(
      "Could not save",
    )
    await fireEvent.changeText(
      screen.getByTestId(props.ids.input),
      "Preserved name",
    )
    await fireEvent.press(screen.getByTestId(props.ids.submit))
    expect(onSubmit).toHaveBeenCalledWith("Preserved name")
  })

  it("disables autocorrect only for code input", async () => {
    const view = await render(<NativeTextEntryDialog {...props} />)
    expect(screen.getByTestId(props.ids.input).props.autoCorrect).toBe(
      undefined,
    )

    await view.rerender(<NativeTextEntryDialog {...props} inputKind="code" />)
    expect(screen.getByTestId(props.ids.input).props.autoCapitalize).toBe(
      "none",
    )
    expect(screen.getByTestId(props.ids.input).props.autoCorrect).toBe(false)
  })

  it("submits the current Compose buffer and keeps native actions while pending", async () => {
    const view = await render(<NativeTextEntryDialog {...props} />)
    await fireEvent.changeText(
      screen.getByTestId(props.ids.input),
      "Fast draft",
    )
    await view.rerender(<NativeTextEntryDialog {...props} pending />)

    expect(screen.getByTestId(props.ids.input).props.value).toBe("Fast draft")
    expect(screen.getByTestId(props.ids.cancel)).toBeTruthy()
    expect(screen.getByTestId(props.ids.submit)).toBeTruthy()
    expect(
      screen.getByTestId("native-text-entry-dialog-android-progress"),
    ).toBeTruthy()

    await view.rerender(<NativeTextEntryDialog {...props} />)
    await fireEvent.press(screen.getByTestId(props.ids.submit))
    expect(onSubmit).toHaveBeenCalledWith("Fast draft")
  })
})

describe.each(["ios", "android"] as const)(
  "NativeTextEntryDialog placement on %s",
  (platform) => {
    usePlatform(platform)

    it("rejects rendering inside NativeList", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})
      await expect(
        render(
          <NativeList>
            <NativeTextEntryDialog {...props} />
          </NativeList>,
        ),
      ).rejects.toThrow(
        "NativeTextEntryDialog must render outside NativeList; place it after </NativeList>.",
      )
      consoleError.mockRestore()
    })

    it("renders as a sibling after NativeList", async () => {
      const view = await render(
        <>
          <NativeList />
          <NativeTextEntryDialog {...props} />
        </>,
      )
      expect(view.getByTestId(props.ids.input)).toBeTruthy()
    })
  },
)
