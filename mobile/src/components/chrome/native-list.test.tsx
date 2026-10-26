import { Section as SwiftSection } from "@expo/ui/swift-ui"
import { fireEvent, render, within } from "@testing-library/react-native"
import { router } from "expo-router"

import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import {
  NativeList,
  NativeListAlert,
  NativeListChoiceRow,
  NativeListFloatingAction,
  NativeListRadioDialog,
  NativeListRow,
  NativeListSection,
  NativeListSwitchRow,
} from "./native-list"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: mockFontScale,
  }),
}))
afterEach(() => {
  mockFontScale = 1
})
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "dark",
}))

describe.each(["ios", "android"] as const)(
  "native list chrome on %s",
  (platform) => {
    usePlatform(platform)

    it("propagates scheme, owns one scroll surface, and preserves row semantics", async () => {
      const action = jest.fn()
      const toggle = jest.fn()
      const select = jest.fn()
      const dialogSelect = jest.fn()
      const view = await render(
        <>
          <NativeList>
            <NativeListSection title="Section" testID="section">
              <NativeListRow
                kind="navigation"
                label="Navigate"
                href="/about"
                testID="nav"
              />
              <NativeListRow
                kind="action"
                label="Act"
                onPress={action}
                testID="action"
              />
              <NativeListRow
                kind="value"
                label="Value"
                value="Read only"
                testID="value"
              />
              <NativeListSwitchRow
                label="Toggle"
                value
                onValueChange={toggle}
                testID="toggle"
                switchTestID="switch"
              />
              <NativeListChoiceRow
                label="Choice"
                selected
                selectedAccessibilityLabel="Selected"
                onSelect={select}
                testID="choice"
              />
            </NativeListSection>
          </NativeList>
          <NativeListRadioDialog
            visible
            title="Dialog"
            cancelLabel="Cancel"
            value="system"
            options={[{ label: "System", value: "system" }]}
            testID="dialog"
            onSelect={dialogSelect}
            onDismiss={jest.fn()}
          />
        </>,
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
        expect(
          within(view.getByTestId("choice")).queryAllByRole("radio"),
        ).toHaveLength(0)

        const dialogOption = view.getByTestId("dialog-system")
        expect(within(dialogOption).queryAllByRole("radio")).toHaveLength(0)
        await fireEvent.press(dialogOption)
        expect(dialogSelect).toHaveBeenCalledTimes(1)
      }
    })
  },
)

describe("native list chrome on ios", () => {
  usePlatform("ios")

  it("tints the form with the brand and renders icons, footers, and trailing content", async () => {
    const view = await render(
      <NativeList>
        <NativeListSection title="Section" footer="Footer copy">
          <NativeListRow
            kind="navigation"
            icon={{ ios: "info.circle", android: "info" }}
            label="Navigate"
            value="Value"
            badge="3"
            href="/about"
            testID="nav"
          />
          <NativeListRow
            kind="action"
            icon={{ ios: "envelope", android: "mail" }}
            label="Act"
            value="Secondary"
            badge="1"
            testID="action"
          />
          <NativeListRow
            kind="value"
            icon={{ ios: "server.rack", android: "dns" }}
            label="Value"
            value="Read only"
            testID="value"
          />
          <NativeListSwitchRow
            icon={{ ios: "person", android: "person" }}
            label="Toggle"
            value={false}
            onValueChange={jest.fn()}
            testID="toggle"
          />
          <NativeListChoiceRow
            label="Choice"
            selected
            selectedAccessibilityLabel="Selected"
            onSelect={jest.fn()}
            testID="choice"
          />
        </NativeListSection>
      </NativeList>,
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
      <NativeListAlert
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
    expect(view.queryByTestId("alert")).toBeNull()
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

  it("keeps a row's own testID inside a section with a testID", async () => {
    const view = await render(
      <NativeList>
        <NativeListSection title="Section" testID="section">
          <NativeListRow
            kind="value"
            label="Value"
            value="Read only"
            testID="row"
          />
        </NativeListSection>
      </NativeList>,
    )
    expect(view.getByTestId("row")).toBeOnTheScreen()
    expect(view.queryByTestId("section")).toBeNull()
  })

  it("renders an alert without an action", async () => {
    const view = await render(
      <NativeListAlert
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
        <NativeListChoiceRow
          label="Choice"
          selected={false}
          selectedAccessibilityLabel="Selected"
          onSelect={jest.fn()}
          testID="choice"
        />
        <NativeListRadioDialog
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

describe("native list rows with subtitles, destructive actions, and a FAB on ios", () => {
  usePlatform("ios")

  it("stacks a secondary subtitle, reads it in the default label, and colors destructive labels", async () => {
    const view = await render(
      <NativeList>
        <NativeListSection>
          <NativeListRow
            kind="navigation"
            label="Calendar"
            subtitle="School"
            value="Shown"
            href="/about"
            testID="subtitled"
          />
          <NativeListRow
            kind="action"
            destructive
            label="Delete"
            onPress={jest.fn()}
            testID="destructive"
          />
        </NativeListSection>
      </NativeList>,
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
      <NativeListFloatingAction
        label="Add"
        icon={{ ios: "plus", android: "add" }}
        testID="fab"
        onPress={jest.fn()}
      />,
    )
    expect(view.queryByTestId("fab")).toBeNull()
  })
})

describe("native list chrome on android", () => {
  usePlatform("android")

  it("seeds every Compose host with the brand color", async () => {
    const view = await render(
      <>
        <NativeList />
        <NativeListRadioDialog
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
    const hosts = view.getAllByTestId("compose-host")
    expect(hosts).toHaveLength(2)
    for (const host of hosts) {
      expect(host.props.seedColor).toBe(Colors.dark.primary)
    }
  })

  it("groups section children into positioned segments with Material text roles", async () => {
    const view = await render(
      <NativeList>
        <NativeListSection title="Section" footer="Footer" testID="titled">
          <NativeListRow
            kind="navigation"
            icon={{ ios: "info.circle", android: "info" }}
            label="First"
            value="Supporting"
            badge="4"
            href="/about"
            testID="first"
          />
          {null}
          <NativeListSwitchRow
            icon={{ ios: "person", android: "person" }}
            label="Middle"
            value
            onValueChange={jest.fn()}
            testID="middle"
          />
          <NativeListRow
            kind="value"
            label="Last"
            value="Plain"
            testID="last"
          />
        </NativeListSection>
        <NativeListSection>
          <NativeListChoiceRow
            label="Single"
            selected={false}
            selectedAccessibilityLabel="Selected"
            onSelect={jest.fn()}
            testID="single"
          />
        </NativeListSection>
      </NativeList>,
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
      <NativeListAlert
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
      <NativeListAlert
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
      <NativeListRadioDialog
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
      <NativeListRadioDialog
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
      <NativeList>
        <NativeListSection>
          <NativeListRow
            kind="navigation"
            label="Calendar"
            subtitle="School"
            value="Shown"
            badge="2"
            href="/about"
            testID="subtitled"
          />
          <NativeListRow
            kind="action"
            destructive
            label="Delete"
            onPress={jest.fn()}
            testID="destructive"
          />
        </NativeListSection>
      </NativeList>,
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
        <NativeList reservesFloatingAction>
          <NativeListSection>
            <NativeListRow kind="value" label="Row" testID="row" />
          </NativeListSection>
        </NativeList>
        <NativeListFloatingAction
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
    const view = await render(<NativeList />)
    expect(
      view.getByTestId("compose-lazy-column-scroll-owner").props.contentPadding,
    ).toEqual({ top: 0, bottom: 24 })
  })
})

describe.each(["ios", "android"] as const)(
  "native list dialog placement on %s",
  (platform) => {
    usePlatform(platform)

    it.each([true, false])(
      "rejects a radio dialog (visible=%s) rendered inside the host",
      async (visible) => {
        const consoleError = jest
          .spyOn(console, "error")
          .mockImplementation(() => {})
        await expect(
          render(
            <NativeList>
              <NativeListSection>
                <NativeListRadioDialog
                  visible={visible}
                  title="Dialog"
                  cancelLabel="Cancel"
                  value="a"
                  options={[{ label: "A", value: "a" }]}
                  testID="dialog"
                  onSelect={jest.fn()}
                  onDismiss={jest.fn()}
                />
              </NativeListSection>
            </NativeList>,
          ),
        ).rejects.toThrow(
          "NativeListRadioDialog must render outside NativeList; place it after </NativeList>.",
        )
        consoleError.mockRestore()
      },
    )

    it("accepts a radio dialog rendered after the host", async () => {
      const view = await render(
        <>
          <NativeList />
          <NativeListRadioDialog
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
      expect(view.queryByTestId("dialog") !== null).toBe(platform === "android")
    })
  },
)

describe("iOS list rows at accessibility text sizes", () => {
  usePlatform("ios")

  async function renderRows(fontScale: number) {
    mockFontScale = fontScale
    return render(
      <NativeList>
        <NativeListSection>
          <NativeListRow
            kind="navigation"
            label="Environment"
            value="Production"
            badge="1"
            href="/developer"
            testID="nav"
          />
          <NativeListRow
            kind="action"
            label="Language"
            value="English"
            onPress={jest.fn()}
            testID="action"
          />
          <NativeListRow
            kind="value"
            label="Version"
            value="4.0.0"
            testID="value"
          />
          <NativeListRow
            kind="navigation"
            label="About"
            href="/about"
            testID="plain"
          />
        </NativeListSection>
      </NativeList>,
    )
  }

  it("stacks the label above the value and keeps the chevron trailing", async () => {
    const view = await renderRows(3.571)

    const nav = view.getByTestId("nav")
    const [column] = within(nav).getAllByTestId("swiftui-vstack")
    expect(within(column!).getByText("Environment")).toBeTruthy()
    expect(within(column!).getByText("Production")).toBeTruthy()
    expect(within(column!).getByText("1")).toBeTruthy()
    const row = column!.parent!
    const chevron = within(nav).getByTestId("swiftui-image-chevron.forward", {
      includeHiddenElements: true,
    })
    expect(row.children.indexOf(chevron)).toBeGreaterThan(
      row.children.indexOf(column!),
    )
    expect(
      within(column!).queryByTestId("swiftui-image-chevron.forward", {
        includeHiddenElements: true,
      }),
    ).toBeNull()

    const action = within(view.getByTestId("action"))
    expect(
      within(action.getByTestId("swiftui-vstack")).getByText("English"),
    ).toBeTruthy()

    const title = view.getByTestId("value")
    expect(title).toHaveTextContent("Version")
    const valueColumn = title.parent!
    expect(valueColumn.props.testID).toBe("swiftui-vstack")
    const visibleValue = within(valueColumn).getByText("4.0.0", {
      includeHiddenElements: true,
    })
    expect(visibleValue.props.accessibilityElementsHidden).toBe(true)
    expect(
      view.getAllByText("4.0.0", { includeHiddenElements: true }),
    ).toHaveLength(1)

    expect(
      within(view.getByTestId("plain")).queryByTestId("swiftui-vstack"),
    ).toBeNull()
  })

  it("shrinks a single-word label onto one line instead of breaking it", async () => {
    const view = await renderRows(3.571)

    const word = view.getByText("About")
    expect(word.props.numberOfLines).toBe(1)
    expect(word.props.minimumFontScale).toBe(0.5)
    expect(view.getByTestId("value").props.numberOfLines).toBe(1)
  })

  it("lets a multi-word label wrap at accessibility sizes", async () => {
    mockFontScale = 3.571
    const view = await render(
      <NativeList>
        <NativeListRow
          kind="navigation"
          label="Hidden events"
          href="/hidden-events"
          testID="phrase"
        />
      </NativeList>,
    )
    const phrase = view.getByText("Hidden events")
    expect(phrase.props.numberOfLines).toBeUndefined()
    expect(phrase.props.minimumFontScale).toBeUndefined()
  })

  it("lets a single-word label wrap normally at the default size", async () => {
    const view = await renderRows(1)
    expect(view.getByText("About").props.numberOfLines).toBeUndefined()
  })

  it("keeps the label and value side by side at the default size", async () => {
    const view = await renderRows(1)

    for (const id of ["nav", "action", "value", "plain"]) {
      expect(
        within(view.getByTestId(id)).queryByTestId("swiftui-vstack"),
      ).toBeNull()
    }
    expect(within(view.getByTestId("value")).getByText("4.0.0")).toBeTruthy()
  })

  it("exposes the same accessibility at both sizes", async () => {
    const semantics = async (fontScale: number) => {
      const view = await renderRows(fontScale)
      const result = ["nav", "action", "value"].map((id) => {
        const { accessibilityLabel, accessibilityValue } =
          view.getByTestId(id).props
        return { id, accessibilityLabel, accessibilityValue }
      })
      await view.unmount()
      return result
    }

    const large = await semantics(3.571)
    expect(large).toEqual(await semantics(1))
    expect(large).toEqual([
      {
        id: "nav",
        accessibilityLabel: "Environment",
        accessibilityValue: { text: "Production" },
      },
      {
        id: "action",
        accessibilityLabel: "Language",
        accessibilityValue: { text: "English" },
      },
      {
        id: "value",
        accessibilityLabel: "Version",
        accessibilityValue: { text: "4.0.0" },
      },
    ])
  })
})

describe("SwiftUI container identifiers on ios", () => {
  usePlatform("ios")

  it("rejects an identifier spread onto a SwiftUI Section", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    await expect(
      render(
        <NativeSettingsHost>
          <SwiftSection {...{ testID: "x" }}>{null}</SwiftSection>
        </NativeSettingsHost>,
      ),
    ).rejects.toThrow(
      "SwiftUI Section received an accessibility identifier; it cascades onto every child (lint-format.md → L12)",
    )
    consoleError.mockRestore()
  })
})
