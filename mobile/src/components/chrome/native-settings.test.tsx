import { fireEvent, render, within } from "@testing-library/react-native"
import { router } from "expo-router"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import {
  NativeSettingsAlert,
  NativeSettingsChoiceRow,
  NativeSettingsFloatingAction,
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
        await fireEvent.press(view.getByTestId("toggle"))
        expect(toggle).toHaveBeenCalledTimes(1)
        expect(toggle).toHaveBeenLastCalledWith(false)

        toggle.mockClear()
        await fireEvent.press(switchTarget)
        expect(toggle).toHaveBeenCalledTimes(1)
        expect(toggle).toHaveBeenLastCalledWith(false)
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

describe("native settings chrome on ios", () => {
  usePlatform("ios")

  it("tints the form with the brand and renders icons, footers, and trailing content", async () => {
    const view = await render(
      <NativeSettingsHost>
        <NativeSettingsSection title="Section" footer="Footer copy">
          <NativeSettingsRow
            kind="navigation"
            icon={{ ios: "info.circle", android: "info" }}
            label="Navigate"
            value="Value"
            badge="3"
            href="/about"
            testID="nav"
          />
          <NativeSettingsRow
            kind="action"
            icon={{ ios: "envelope", android: "mail" }}
            label="Act"
            value="Secondary"
            badge="1"
            testID="action"
          />
          <NativeSettingsRow
            kind="value"
            icon={{ ios: "server.rack", android: "dns" }}
            label="Value"
            value="Read only"
            testID="value"
          />
          <NativeSettingsSwitchRow
            icon={{ ios: "person", android: "person" }}
            label="Toggle"
            value={false}
            onValueChange={jest.fn()}
            testID="toggle"
          />
          <NativeSettingsChoiceRow
            label="Choice"
            selected
            selectedAccessibilityLabel="Selected"
            onSelect={jest.fn()}
            testID="choice"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>,
    )
    expect(view.getByTestId("swiftui-form-scroll-owner").props.tint).toBe(
      Colors.dark.primary,
    )
    expect(view.getByText("Footer copy")).toBeOnTheScreen()
    const tiles = view.getAllByTestId(/^swiftui-image-(?!checkmark|chevron)/)
    expect(tiles.map((tile) => tile.props.testID)).toEqual([
      "swiftui-image-info.circle",
      "swiftui-image-envelope",
      "swiftui-image-server.rack",
      "swiftui-image-person",
    ])
    expect(tiles[0]?.props.color).toBe(Colors.dark.onPrimary)
    expect(
      within(view.getByTestId("nav")).getByTestId(
        "swiftui-image-chevron.forward",
      ),
    ).toBeOnTheScreen()
    expect(
      within(view.getByTestId("action")).queryByTestId(
        "swiftui-image-chevron.forward",
      ),
    ).toBeNull()
    expect(within(view.getByTestId("nav")).getByText("3")).toBeOnTheScreen()
    expect(
      within(view.getByTestId("action")).getByText("Secondary"),
    ).toBeOnTheScreen()
    expect(within(view.getByTestId("toggle")).getByText("Toggle")).toBeTruthy()
    expect(
      within(view.getByTestId("toggle")).getByTestId("swiftui-image-person"),
    ).toBeOnTheScreen()
    const nav = within(view.getByTestId("nav"))
    expect(nav.getByText("Navigate").props.foreground).toBe(Colors.dark.text)
    expect(nav.getByText("Value").props.foreground).toBe(
      Colors.dark.textSecondary,
    )
    expect(
      nav.getByTestId("swiftui-image-chevron.forward").props.modifiers,
    ).toContainEqual({
      $type: "foregroundStyle",
      value: Colors.dark.textTertiary,
    })
    const action = within(view.getByTestId("action"))
    expect(action.getByText("Act").props.foreground).toBe(Colors.dark.text)
    expect(action.getByText("Secondary").props.foreground).toBe(
      Colors.dark.textSecondary,
    )
    expect(
      within(view.getByTestId("choice")).getByText("Choice").props.foreground,
    ).toBe(Colors.dark.text)
    const checkmark = within(view.getByTestId("choice")).getByTestId(
      "swiftui-image-checkmark",
    )
    expect(checkmark.props.modifiers).toContainEqual({
      $type: "foregroundStyle",
      value: Colors.dark.primary,
    })
    expect(checkmark.props.modifiers).toContainEqual({
      $type: "font",
      value: { textStyle: "subheadline", weight: "semibold" },
    })
  })

  it("renders an alert section with an error glyph, readable copy, and a labelled action", async () => {
    const onPress = jest.fn()
    const view = await render(
      <NativeSettingsAlert
        title="Title"
        message="Message"
        testID="alert"
        messageTestID="alert-message"
        action={{
          label: "Retry",
          accessibilityLabel: "Retry the thing",
          testID: "alert-action",
          onPress,
        }}
      />,
    )
    expect(view.getByTestId("alert")).toBeOnTheScreen()
    expect(
      view.getByTestId("swiftui-image-exclamationmark.triangle.fill").props
        .modifiers,
    ).toContainEqual({ $type: "foregroundStyle", value: Colors.dark.error })
    expect(view.getByText("Title").props.foreground).toBe(Colors.dark.text)
    expect(view.getByTestId("alert-message").props.foreground).toBe(
      Colors.dark.textSecondary,
    )
    const action = view.getByTestId("alert-action")
    expect(action.props.accessibilityLabel).toBe("Retry the thing")
    await fireEvent.press(action)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("renders an alert without an action", async () => {
    const view = await render(
      <NativeSettingsAlert
        title="Title"
        message="Message"
        testID="alert"
        messageTestID="alert-message"
      />,
    )
    expect(view.queryByRole("button")).toBeNull()
  })

  it("omits the checkmark on an unselected choice and never renders the radio dialog", async () => {
    const view = await render(
      <>
        <NativeSettingsChoiceRow
          label="Choice"
          selected={false}
          selectedAccessibilityLabel="Selected"
          onSelect={jest.fn()}
          testID="choice"
        />
        <NativeSettingsRadioDialog
          visible
          title="Dialog"
          cancelLabel="Cancel"
          value="a"
          options={[{ label: "A", value: "a" }]}
          testID="dialog"
          onSelect={jest.fn()}
          onDismiss={jest.fn()}
        />
      </>,
    )
    expect(view.queryByTestId("swiftui-image-checkmark")).toBeNull()
    expect(view.queryByTestId("dialog")).toBeNull()
  })
})

describe("native settings rows with subtitles, destructive actions, and a FAB on ios", () => {
  usePlatform("ios")

  it("stacks a secondary subtitle, reads it in the default label, and colors destructive labels", async () => {
    const view = await render(
      <NativeSettingsHost>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="navigation"
            label="Calendar"
            subtitle="School"
            value="Shown"
            href="/about"
            testID="subtitled"
          />
          <NativeSettingsRow
            kind="action"
            destructive
            label="Delete"
            onPress={jest.fn()}
            testID="destructive"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>,
    )
    const row = view.getByTestId("subtitled")
    expect(row.props.accessibilityLabel).toBe("Calendar, School")
    expect(row.props.accessibilityValue).toEqual({ text: "Shown" })
    expect(within(row).getByText("School").props.foreground).toBe(
      Colors.dark.textSecondary,
    )
    expect(within(row).getByText("Shown").props.foreground).toBe(
      Colors.dark.textSecondary,
    )
    expect(
      within(view.getByTestId("destructive")).getByText("Delete").props
        .foreground,
    ).toBe(Colors.dark.error)
  })

  it("renders no floating action, since iOS adds through the navigation bar", async () => {
    const view = await render(
      <NativeSettingsFloatingAction
        label="Add"
        icon={{ ios: "plus", android: "add" }}
        testID="fab"
        onPress={jest.fn()}
      />,
    )
    expect(view.queryByTestId("fab")).toBeNull()
  })
})

describe("native settings chrome on android", () => {
  usePlatform("android")

  it("seeds every Compose host with the brand color", async () => {
    const view = await render(
      <NativeSettingsHost>
        <NativeSettingsRadioDialog
          visible
          title="Dialog"
          cancelLabel="Cancel"
          value="a"
          options={[{ label: "A", value: "a" }]}
          testID="dialog"
          onSelect={jest.fn()}
          onDismiss={jest.fn()}
        />
      </NativeSettingsHost>,
    )
    const hosts = view.getAllByTestId("compose-host")
    expect(hosts).toHaveLength(2)
    for (const host of hosts) {
      expect(host.props.seedColor).toBe(Colors.dark.primary)
    }
  })

  it("groups section children into positioned segments with Material text roles", async () => {
    const view = await render(
      <NativeSettingsHost>
        <NativeSettingsSection title="Section" footer="Footer" testID="titled">
          <NativeSettingsRow
            kind="navigation"
            icon={{ ios: "info.circle", android: "info" }}
            label="First"
            value="Supporting"
            badge="4"
            href="/about"
            testID="first"
          />
          {null}
          <NativeSettingsSwitchRow
            icon={{ ios: "person", android: "person" }}
            label="Middle"
            value
            onValueChange={jest.fn()}
            testID="middle"
          />
          <NativeSettingsRow
            kind="value"
            label="Last"
            value="Plain"
            testID="last"
          />
        </NativeSettingsSection>
        <NativeSettingsSection>
          <NativeSettingsChoiceRow
            label="Single"
            selected={false}
            selectedAccessibilityLabel="Selected"
            onSelect={jest.fn()}
            testID="single"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>,
    )
    const title = view.getByTestId("titled")
    expect(title.props.color).toBe("#primary")
    expect(title.props.typography).toBe("titleSmall")
    const footer = view.getByText("Footer")
    expect(footer.props.color).toBe("#onSurfaceVariant")
    expect(footer.props.typography).toBe("bodySmall")

    const corners = (id: string) => view.getByTestId(id).props.shape.params
    expect(corners("first")).toEqual({
      topStart: 20,
      topEnd: 20,
      bottomStart: 4,
      bottomEnd: 4,
    })
    expect(corners("middle")).toEqual({
      topStart: 4,
      topEnd: 4,
      bottomStart: 4,
      bottomEnd: 4,
    })
    expect(corners("last")).toEqual({
      topStart: 4,
      topEnd: 4,
      bottomStart: 20,
      bottomEnd: 20,
    })
    expect(corners("single")).toEqual({
      topStart: 20,
      topEnd: 20,
      bottomStart: 20,
      bottomEnd: 20,
    })
    expect(view.getByTestId("first").props.padding).toEqual({
      start: 16,
      top: 0,
      end: 16,
      bottom: 2,
    })
    expect(view.getByTestId("last").props.padding.bottom).toBe(0)
    expect(view.getByTestId("single").props.padding).toEqual({
      start: 16,
      top: 16,
      end: 16,
      bottom: 0,
    })
    expect(view.getByTestId("first").props.colors.containerColor).toBe(
      "#surfaceContainer",
    )

    const headline = view.getByText("First")
    expect(headline.props.typography).toBe("bodyLarge")
    expect(headline.props.color).toBe("#onSurface")
    const supporting = view.getByText("Supporting")
    expect(supporting.props.typography).toBe("bodyMedium")
    expect(supporting.props.color).toBe("#onSurfaceVariant")
    expect(
      within(view.getByTestId("first")).getByTestId("compose-badge"),
    ).toHaveTextContent("4")
    const icons = view.getAllByTestId("compose-icon")
    expect(icons).toHaveLength(2)
    expect(icons[0]?.props.tint).toBe("#onSurfaceVariant")
    expect(icons[0]?.props.source).toBeTruthy()
  })

  it("renders the alert as an error-container card with a trailing text action", async () => {
    const onPress = jest.fn()
    const view = await render(
      <NativeSettingsAlert
        title="Title"
        message="Message"
        testID="alert"
        messageTestID="alert-message"
        action={{
          label: "Retry",
          accessibilityLabel: "Retry the thing",
          testID: "alert-action",
          onPress,
        }}
      />,
    )
    const card = view.getByTestId("alert")
    expect(card.props.colors.containerColor).toBe("#errorContainer")
    expect(card.props.shape).toEqual({ type: "roundedCorner", params: 20 })
    expect(view.getByText("Title").props.typography).toBe("titleMedium")
    expect(view.getByTestId("alert-message").props.color).toBe(
      "#onErrorContainer",
    )
    await fireEvent.press(view.getByTestId("alert-action"))
    expect(onPress).toHaveBeenCalledTimes(1)

    await view.rerender(
      <NativeSettingsAlert
        title="Title"
        message="Message"
        testID="alert"
        messageTestID="alert-message"
      />,
    )
    expect(view.queryByTestId("alert-action")).toBeNull()
  })

  it("renders a full-width Material radio dialog with 56dp selectable rows", async () => {
    const select = jest.fn()
    const dismiss = jest.fn()
    const view = await render(
      <NativeSettingsRadioDialog
        visible
        title="Dialog"
        cancelLabel="Cancel"
        value="b"
        options={[
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ]}
        testID="dialog"
        onSelect={select}
        onDismiss={dismiss}
      />,
    )
    const optionA = view.getByTestId("dialog-a")
    const optionB = view.getByTestId("dialog-b")
    expect(optionA.props.accessibilityRole).toBe("radio")
    expect(optionA.props.minSize).toEqual({ minHeight: 56 })
    expect(optionA.props.accessibilityState.selected).toBe(false)
    expect(optionB.props.accessibilityState.selected).toBe(true)
    expect(view.getByText("A").props.typography).toBe("bodyLarge")
    await fireEvent.press(optionA)
    expect(select).toHaveBeenCalledWith("a")
    await fireEvent.press(view.getByTestId("dialog-cancel"))
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  it("renders nothing while the dialog is hidden", async () => {
    const view = await render(
      <NativeSettingsRadioDialog
        visible={false}
        title="Dialog"
        cancelLabel="Cancel"
        value="a"
        options={[{ label: "A", value: "a" }]}
        testID="dialog"
        onSelect={jest.fn()}
        onDismiss={jest.fn()}
      />,
    )
    expect(view.queryByTestId("compose-host")).toBeNull()
  })

  it("puts a subtitle in supporting text, the value in trailing text, and colors destructive headlines", async () => {
    const view = await render(
      <NativeSettingsHost>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="navigation"
            label="Calendar"
            subtitle="School"
            value="Shown"
            badge="2"
            href="/about"
            testID="subtitled"
          />
          <NativeSettingsRow
            kind="action"
            destructive
            label="Delete"
            onPress={jest.fn()}
            testID="destructive"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>,
    )
    const row = view.getByTestId("subtitled")
    expect(within(row).getByText("School").props.typography).toBe("bodyMedium")
    expect(within(row).getByText("Shown").props.typography).toBe("labelLarge")
    expect(within(row).getByTestId("compose-badge")).toBeTruthy()
    expect(
      within(view.getByTestId("destructive")).getByText("Delete").props.color,
    ).toBe("#error")
  })

  it("renders a brand-seeded FAB and reserves list space for it", async () => {
    const onPress = jest.fn()
    const view = await render(
      <>
        <NativeSettingsHost reservesFloatingAction>
          <NativeSettingsSection>
            <NativeSettingsRow kind="value" label="Row" testID="row" />
          </NativeSettingsSection>
        </NativeSettingsHost>
        <NativeSettingsFloatingAction
          label="Add"
          icon={{ ios: "plus", android: "add" }}
          testID="fab"
          onPress={onPress}
        />
      </>,
    )
    expect(
      view.getByTestId("compose-lazy-column-scroll-owner").props.contentPadding,
    ).toEqual({ top: 0, bottom: 112 })
    expect(view.getByLabelText("Add")).toBeTruthy()
    await fireEvent.press(view.getByTestId("fab"))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(
      view
        .getAllByTestId("compose-host")
        .every((host) => host.props.seedColor === Colors.dark.primary),
    ).toBe(true)
  })

  it("keeps the default list padding without a FAB", async () => {
    const view = await render(<NativeSettingsHost />)
    expect(
      view.getByTestId("compose-lazy-column-scroll-owner").props.contentPadding,
    ).toEqual({ top: 0, bottom: 24 })
  })
})
