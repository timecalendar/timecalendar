import { fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"

import { usePlatform } from "@/test-support/platform"

import {
  NativeSettingsChoiceRow,
  NativeSettingsHost,
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
              onSelect={select}
              testID="choice"
            />
          </NativeSettingsSection>
        </NativeSettingsHost>,
      )
      const host = view.getByTestId(
        platform === "ios" ? "swiftui-host" : "compose-host",
      )
      expect(host.props.colorScheme).toBe("dark")
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
      await fireEvent.press(view.getByTestId("switch"))
      expect(toggle).toHaveBeenCalledTimes(1)
      expect(view.getByTestId("choice").props.accessibilityState.selected).toBe(
        true,
      )
    })
  },
)
