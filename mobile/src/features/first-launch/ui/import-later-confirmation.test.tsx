import { fireEvent, render } from "@testing-library/react-native"
import { Platform, StyleSheet } from "react-native"

import { ImportLaterConfirmation } from "./import-later-confirmation"

describe("ImportLaterConfirmation", () => {
  it("renders shared localized semantics with scalable platform targets", async () => {
    const view = await render(
      <ImportLaterConfirmation
        visible
        cancelLabelKey="firstLaunch.importLater.continueOnboarding"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    )

    expect(
      view.getByRole("header", {
        name: "Use TimeCalendar without an iCal?",
      }),
    ).toBeTruthy()
    expect(
      view.getByText(
        "You can still create personal events and import an iCal later from Settings.",
      ),
    ).toBeTruthy()
    const confirm = view.getByRole("button", {
      name: "Continue without an iCal",
    })
    expect(StyleSheet.flatten(confirm.props.style).minHeight).toBe(
      Platform.OS === "ios" ? 44 : 48,
    )
    expect(view.getByTestId("import-later-confirmation").props).toMatchObject({
      accessibilityViewIsModal: true,
    })
  })

  it("routes cancel, backdrop, platform back, and confirm independently", async () => {
    const onCancel = jest.fn()
    const onConfirm = jest.fn()
    const view = await render(
      <ImportLaterConfirmation
        visible
        cancelLabelKey="firstLaunch.importLater.keepReminder"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    await fireEvent.press(view.getByTestId("import-later-cancel"))
    await fireEvent.press(view.getByTestId("import-later-backdrop"))
    view.getByTestId("import-later-modal").props.onRequestClose()
    expect(onCancel).toHaveBeenCalledTimes(3)
    expect(onConfirm).not.toHaveBeenCalled()

    await fireEvent.press(view.getByTestId("import-later-confirm"))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("uses no transition animation", async () => {
    const view = await render(
      <ImportLaterConfirmation
        visible
        cancelLabelKey="firstLaunch.importLater.keepReminder"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    )

    expect(view.getByTestId("import-later-modal").props.animationType).toBe(
      "none",
    )
  })
})
