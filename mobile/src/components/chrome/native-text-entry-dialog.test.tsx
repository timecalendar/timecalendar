import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { StyleSheet } from "react-native"

import { usePlatform } from "@/test-support/platform"
import { resolveResponsiveLayout } from "@/theme"

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

  it("uses one SwiftUI host inside an isolated keyboard-safe readable modal", async () => {
    await render(<NativeTextEntryDialog {...props} />)

    expect(screen.getByTestId("native-text-entry-dialog-ios-host")).toBeTruthy()
    expect(
      screen.getByTestId(props.ids.dialog).props.accessibilityViewIsModal,
    ).toBe(true)
    expect(
      screen.getByTestId("native-text-entry-dialog-keyboard-owner"),
    ).toBeTruthy()

    const lane = screen.getByTestId("native-text-entry-dialog-content")
    await act(() =>
      fireEvent(lane, "layout", {
        nativeEvent: { layout: { width: 1024, height: 640, x: 0, y: 0 } },
      }),
    )
    const content = lane.children[0] as unknown as { props: { style: unknown } }
    const layout = resolveResponsiveLayout(1024, "readable")
    expect(StyleSheet.flatten(content.props.style)).toMatchObject({
      maxWidth: layout.contentWidth + 2 * layout.gutter,
      paddingHorizontal: layout.gutter,
    })
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

  it("keeps backdrop taps inert and exposes native selectors", async () => {
    await render(<NativeTextEntryDialog {...props} />)
    expect(screen.getByTestId(props.ids.input)).toBeTruthy()
    expect(screen.getByTestId(props.ids.cancel)).toBeTruthy()
    expect(screen.getByTestId(props.ids.submit)).toBeTruthy()

    await fireEvent.press(
      screen.getByTestId("native-text-entry-dialog-backdrop"),
    )
    expect(onCancel).not.toHaveBeenCalled()
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
