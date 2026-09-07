import { render } from "@testing-library/react-native"
import { StyleSheet, Text, View } from "react-native"

import { usePlatform } from "@/test-support/platform"

import {
  KeyboardSafeActionLayout,
  resolveKeyboardAvoidingBehavior,
} from "./keyboard-safe-action-layout"

describe.each([
  ["ios" as const, "padding"],
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
    expect(content).toHaveProp("keyboardShouldPersistTaps", "handled")
    expect(
      StyleSheet.flatten(content.props.contentContainerStyle),
    ).toMatchObject({
      paddingTop: 10,
    })
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
