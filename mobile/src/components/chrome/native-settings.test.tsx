import { fireEvent, render, within } from "@testing-library/react-native"
import { router } from "expo-router"

import { usePlatform } from "@/test-support/platform"

import {
  NativeSettingsChoiceRow,
  NativeSettingsHost,
  NativeSettingsRadioDialog,
  NativeSettingsRow,
  NativeSettingsSection,
  NativeSettingsSwitchRow,
} from "./native-settings"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "dark",
}))

describe.each(["ios", "android"] as const)(
  "native settings chrome on %s",
  (platform) => {
    usePlatform(platform)

    it("propagates scheme, owns one scroll surface, and preserves row semantics", async () => {
      const action = jest.fn()
      const toggle = jest.fn()
      const select = jest.fn()
      const dialogSelect = jest.fn()
      const view = await render(
        <NativeSettingsHost>
          <NativeSettingsSection title="Section" testID="section">
            <NativeSettingsRow
              kind="navigation"
              label="Navigate"
              href="/about"
              testID="nav"
            />
            <NativeSettingsRow
              kind="action"
              label="Act"
              onPress={action}
              testID="action"
            />
            <NativeSettingsRow
              kind="value"
              label="Value"
              value="Read only"
              testID="value"
            />
            <NativeSettingsSwitchRow
              label="Toggle"
              value
              onValueChange={toggle}
              testID="toggle"
              switchTestID="switch"
            />
            <NativeSettingsChoiceRow
              label="Choice"
              selected
              selectedAccessibilityLabel="Selected"
              onSelect={select}
              testID="choice"
            />
          </NativeSettingsSection>
          <NativeSettingsRadioDialog
            visible
            title="Dialog"
            cancelLabel="Cancel"
            value="system"
            options={[{ label: "System", value: "system" }]}
            testID="dialog"
            onSelect={dialogSelect}
            onDismiss={jest.fn()}
          />
        </NativeSettingsHost>,
      )
      const hosts = view.getAllByTestId(
        platform === "ios" ? "swiftui-host" : "compose-host",
      )
      expect(hosts.every((host) => host.props.colorScheme === "dark")).toBe(
        true,
      )
      expect(
        view.getAllByTestId(
          platform === "ios"
            ? "swiftui-form-scroll-owner"
            : "compose-lazy-column-scroll-owner",
        ),
      ).toHaveLength(1)
      await fireEvent.press(view.getByTestId("nav"))
      expect(router.push).toHaveBeenCalledWith("/about")
      await fireEvent.press(view.getByTestId("action"))
      expect(action).toHaveBeenCalledTimes(1)
      expect(view.getByTestId("value").props.accessibilityRole).toBeFalsy()
      const switchTarget = view.getByTestId("switch")
      if (platform === "ios") {
        await fireEvent.press(switchTarget)
        expect(toggle).toHaveBeenCalledTimes(1)
      } else {
        expect(switchTarget.props.onPress).toBeUndefined()
        await fireEvent.press(view.getByTestId("toggle"))
        expect(toggle).toHaveBeenCalledTimes(1)
      }
      await fireEvent.press(view.getByTestId("choice"))
      expect(select).toHaveBeenCalledTimes(1)
      expect(view.getByTestId("choice").props.accessibilityState.selected).toBe(
        true,
      )
      if (platform === "ios") {
        expect(view.getByTestId("choice").props.accessibilityValue.text).toBe(
          "Selected",
        )
      } else {
        const choiceTargets = within(view.getByTestId("choice")).getAllByRole(
          "radio",
        )
        expect(choiceTargets).toHaveLength(1)
        expect(choiceTargets[0]?.props.onPress).toBeUndefined()

        const dialogOption = view.getByTestId("dialog-system")
        const dialogIndicators = within(dialogOption).getAllByRole("radio")
        expect(dialogIndicators).toHaveLength(1)
        expect(dialogIndicators[0]?.props.onPress).toBeUndefined()
        await fireEvent.press(dialogOption)
        expect(dialogSelect).toHaveBeenCalledTimes(1)
      }
    })
  },
)
