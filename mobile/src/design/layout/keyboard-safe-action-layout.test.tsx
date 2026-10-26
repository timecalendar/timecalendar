import { act, fireEvent, render } from "@testing-library/react-native"
import type { ReactNode } from "react"
import { DeviceEventEmitter, StyleSheet, Text, View } from "react-native"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"

import { usePlatform } from "@/test-support/platform"

import { KeyboardSafeActionLayout } from "./keyboard-safe-action-layout"

jest.mock("react-native", () => {
  const React = jest.requireActual<typeof import("react")>("react")
  const actual =
    jest.requireActual<typeof import("react-native")>("react-native")
  function TransparentKeyboardAvoidingView({
    children,
    ...props
  }: {
    children?: ReactNode
    [key: string]: unknown
  }) {
    return React.createElement(
      actual.View,
      { ...props, nativeID: "keyboard-avoiding-view" },
      children,
    )
  }

  const descriptors = Object.getOwnPropertyDescriptors(actual)
  Reflect.deleteProperty(descriptors, "KeyboardAvoidingView")
  return Object.defineProperties(
    { KeyboardAvoidingView: TransparentKeyboardAvoidingView },
    descriptors,
  )
})

const STATUS_BAR = 48

describe.each(["ios" as const, "android" as const])(
  "KeyboardSafeActionLayout on %s",
  (platform) => {
    usePlatform(platform)

    it("keeps scrollable content before a sibling measured action region", async () => {
      const view = await render(
        <KeyboardSafeActionLayout
          testID="form"
          contentContainerStyle={{ paddingTop: 10 }}
          actionContainerStyle={{ paddingBottom: 12 }}
          actions={
            <View testID="action">
              <Text>Save</Text>
            </View>
          }
        >
          <View testID="field">
            <Text>Field</Text>
          </View>
        </KeyboardSafeActionLayout>,
      )
      const content = view.getByTestId("form-content")
      const windowOwner = view.getByTestId("form-window-owner")
      expect(content).toHaveProp("keyboardShouldPersistTaps", "handled")
      expect(windowOwner).toContainElement(view.getByTestId("form"))
      expect(
        StyleSheet.flatten(content.props.contentContainerStyle),
      ).toMatchObject({
        paddingTop: 10,
      })
      expect(StyleSheet.flatten(content.props.style)).toMatchObject({ flex: 1 })
      expect(view.getByTestId("form-actions")).toContainElement(
        view.getByTestId("action"),
      )
      expect(content).toContainElement(view.getByTestId("field"))
      expect(content).not.toContainElement(view.getByTestId("action"))
      expect(
        StyleSheet.flatten(view.getByTestId("form").props.style),
      ).not.toHaveProperty("position", "absolute")
    })
  },
)

// The jest preset shares one mocked measureInWindow across every host view.
const { measureInWindow } = jest.requireActual<{
  default: { measureInWindow: jest.Mock }
}>("@react-native/jest-preset/jest/MockNativeMethods").default

const measureOwner = (y: number, height: number) =>
  measureInWindow.mockImplementation(
    (callback: (x: number, y: number, width: number, height: number) => void) =>
      callback(0, y, 390, height),
  )

const renderForm = () =>
  render(
    <SafeAreaInsetsContext.Provider
      value={{ top: STATUS_BAR, bottom: 0, left: 0, right: 0 }}
    >
      <KeyboardSafeActionLayout testID="form" actions={<View />}>
        <View />
      </KeyboardSafeActionLayout>
    </SafeAreaInsetsContext.Provider>,
  )

const layoutOwner = (view: Awaited<ReturnType<typeof renderForm>>) =>
  act(() =>
    fireEvent(view.getByTestId("form-window-owner"), "layout", {
      nativeEvent: { layout: { width: 390, height: 600, x: 0, y: 0 } },
    }),
  )

const emitKeyboard = (
  event: "keyboardDidShow" | "keyboardDidHide",
  screenY: number,
) =>
  act(() => {
    DeviceEventEmitter.emit(event, {
      endCoordinates: { screenX: 0, screenY, width: 390, height: 300 },
    })
  })

const paddingBottom = (view: Awaited<ReturnType<typeof renderForm>>) =>
  StyleSheet.flatten(view.getByTestId("form").props.style).paddingBottom

afterEach(() => {
  measureInWindow.mockReset()
})

describe("KeyboardSafeActionLayout keyboard on iOS", () => {
  usePlatform("ios")

  it("avoids the keyboard by height, offset by the owner's measured window Y", async () => {
    measureOwner(97, 600)
    const view = await renderForm()
    expect(view.getByTestId("form")).toHaveProp("keyboardVerticalOffset", 0)

    await layoutOwner(view)

    expect(view.getByTestId("form")).toHaveProp(
      "nativeID",
      "keyboard-avoiding-view",
    )
    expect(view.getByTestId("form")).toHaveProp("behavior", "height")
    expect(view.getByTestId("form")).toHaveProp("keyboardVerticalOffset", 97)
  })
})

describe("KeyboardSafeActionLayout keyboard on Android", () => {
  usePlatform("android")

  // measureInWindow is below the status bar; keyboardDidShow screenY is not.
  it("insets the actions by the owner's overlap with the keyboard and drops it on hide", async () => {
    measureOwner(56, 600)
    const view = await renderForm()
    expect(view.getByTestId("form")).not.toHaveProp("nativeID")
    expect(paddingBottom(view)).toBe(0)

    await emitKeyboard("keyboardDidShow", 500)
    expect(paddingBottom(view)).toBe(56 + 600 - (500 - STATUS_BAR))

    await emitKeyboard("keyboardDidHide", 750)
    expect(paddingBottom(view)).toBe(0)
  })

  it("recomputes on layout while the keyboard is up, so a resized window is not avoided twice", async () => {
    measureOwner(56, 600)
    const view = await renderForm()
    await emitKeyboard("keyboardDidShow", 500)
    expect(paddingBottom(view)).toBe(204)

    measureOwner(56, 500 - STATUS_BAR - 56)
    await layoutOwner(view)
    expect(paddingBottom(view)).toBe(0)
  })

  it("drops a measurement that resolves after the keyboard hid", async () => {
    let resolveMeasure = () => {}
    measureInWindow.mockImplementation(
      (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => {
        resolveMeasure = () => callback(0, 97, 390, 600)
      },
    )
    const view = await renderForm()
    await emitKeyboard("keyboardDidShow", 400)
    await emitKeyboard("keyboardDidHide", 750)
    await act(() => resolveMeasure())
    expect(paddingBottom(view)).toBe(0)
  })

  it("ignores owner layout while the keyboard is hidden", async () => {
    measureOwner(97, 600)
    const view = await renderForm()
    await layoutOwner(view)
    expect(measureInWindow).not.toHaveBeenCalled()
    expect(paddingBottom(view)).toBe(0)
  })

  it("stops listening once unmounted", async () => {
    measureOwner(97, 600)
    const view = await renderForm()
    await view.unmount()
    await emitKeyboard("keyboardDidShow", 400)
    expect(measureInWindow).not.toHaveBeenCalled()
  })
})

describe("KeyboardSafeActionLayout header inset", () => {
  const renderLayout = (scrollsUnderHeader: boolean) =>
    render(
      <KeyboardSafeActionLayout
        testID="form"
        scrollsUnderHeader={scrollsUnderHeader}
        actions={<View />}
      >
        <View />
      </KeyboardSafeActionLayout>,
    )

  it("insets its scroller under the header by default", async () => {
    const content = (
      await render(
        <KeyboardSafeActionLayout testID="form" actions={<View />}>
          <View />
        </KeyboardSafeActionLayout>,
      )
    ).getByTestId("form-content")
    expect(content).toHaveProp("contentInsetAdjustmentBehavior", "automatic")
    expect(content).toHaveProp("alwaysBounceVertical", true)
  })

  it("keeps viewport-filling content still below the header", async () => {
    const content = (await renderLayout(false)).getByTestId("form-content")
    expect(content).toHaveProp("contentInsetAdjustmentBehavior", "never")
    expect(content).toHaveProp("alwaysBounceVertical", false)
  })
})
