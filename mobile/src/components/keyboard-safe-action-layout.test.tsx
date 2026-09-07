import { render } from "@testing-library/react-native"
import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

import { usePlatform } from "@/test-support/platform"

import { resolveKeyboardAvoidingBehavior } from "./keyboard-avoiding-behavior"
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
    return React.createElement(actual.View, props, children)
  }

  const descriptors = Object.getOwnPropertyDescriptors(actual)
  Reflect.deleteProperty(descriptors, "KeyboardAvoidingView")
  return Object.defineProperties(
    { KeyboardAvoidingView: TransparentKeyboardAvoidingView },
    descriptors,
  )
})

describe.each([
  ["ios" as const, "height"],
  ["android" as const, "height"],
])("KeyboardSafeActionLayout on %s", (platform, behavior) => {
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
    expect(resolveKeyboardAvoidingBehavior(platform)).toBe(behavior)
    const content = view.getByTestId("form-content")
    const windowOwner = view.getByTestId("form-window-owner")
    expect(content).toHaveProp("keyboardShouldPersistTaps", "handled")
    expect(windowOwner).toContainElement(view.getByTestId("form"))
    expect(view.getByTestId("form")).toHaveProp("keyboardVerticalOffset", 0)
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
})
