import { fireEvent, renderHook, within } from "@testing-library/react-native"

import {
  headerBarItem,
  headerBarItems,
  renderHeaderSide,
} from "@/test-support/header-actions"
import { usePlatform } from "@/test-support/platform"
import { Colors } from "@/theme"

import { type HeaderAction, useHeaderActions } from "./header-action"

let mockScheme: "light" | "dark" = "light"
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockScheme,
}))

afterEach(() => {
  mockScheme = "light"
})

const today = (onPress = jest.fn()): HeaderAction => ({
  icon: { ios: "calendar", android: "today" },
  accessibilityLabel: "Go to today",
  testID: "today",
  onPress,
})

const done = (overrides: Partial<HeaderAction> = {}): HeaderAction =>
  ({
    label: "Done",
    accessibilityLabel: "Done editing",
    accessibilityHint: "Saves and closes",
    testID: "done",
    onPress: jest.fn(),
    ...overrides,
  }) as HeaderAction

const iosOnly: HeaderAction = {
  icon: { ios: "plus", android: "add" },
  accessibilityLabel: "Add",
  testID: "add-ios",
  platform: "ios",
  onPress: jest.fn(),
}

const androidOnly: HeaderAction = {
  label: "Skip",
  accessibilityLabel: "Skip this step",
  testID: "skip-android",
  platform: "android",
  onPress: jest.fn(),
}

const optionsFor = async (sides: Parameters<typeof useHeaderActions>[0]) =>
  (await renderHook(() => useHeaderActions(sides))).result.current

describe("useHeaderActions on ios", () => {
  usePlatform("ios")

  it("returns no option for an empty side or a side with only Android items", async () => {
    expect(await optionsFor({})).toEqual({})
    expect(await optionsFor({ left: [androidOnly], right: [] })).toEqual({})
  })

  it("keeps iOS-only items and drops Android-only items", async () => {
    const options = await optionsFor({ right: [iosOnly, androidOnly] })
    expect(
      headerBarItems(options, "right").map((item) => item.identifier),
    ).toEqual(["add-ios"])
    expect(options.headerRight).toBeUndefined()
  })

  it.each(["light", "dark"] as const)(
    "maps an icon item to a native bar button tinted with the %s text color",
    async (scheme) => {
      mockScheme = scheme
      const onPress = jest.fn()
      const options = await optionsFor({ right: [today(onPress)] })
      expect(headerBarItem(options, "right", "today")).toEqual({
        type: "button",
        label: "Go to today",
        icon: { type: "sfSymbol", name: "calendar" },
        tintColor: Colors[scheme].text,
        accessibilityLabel: "Go to today",
        identifier: "today",
        disabled: false,
        onPress,
      })
    },
  )

  it("maps a text item with its visible label, hint and disabled state on the left", async () => {
    const options = await optionsFor({ left: [done({ disabled: true })] })
    const item = headerBarItem(options, "left", "done")
    expect(item).toMatchObject({
      label: "Done",
      accessibilityLabel: "Done editing",
      accessibilityHint: "Saves and closes",
      disabled: true,
      tintColor: Colors.light.text,
    })
    expect(item).not.toHaveProperty("icon")
    expect(options.unstable_headerRightItems).toBeUndefined()
  })
})

describe("useHeaderActions on android", () => {
  usePlatform("android")

  it("returns no option for an empty side or a side with only iOS items", async () => {
    expect(await optionsFor({ left: [iosOnly] })).toEqual({})
  })

  it("renders an icon button named by its label that presses its handler", async () => {
    const onPress = jest.fn()
    const options = await optionsFor({ right: [today(onPress), iosOnly] })
    expect(options.unstable_headerRightItems).toBeUndefined()
    const view = await renderHeaderSide(options, "right")
    expect(view.queryByTestId("add-ios")).toBeNull()
    const button = view.getByTestId("today")
    expect(button.props.accessibilityRole).toBe("button")
    expect(button.props.colors).toEqual({ contentColor: Colors.light.text })
    expect(
      within(button).getByTestId("compose-icon").props.accessibilityLabel,
    ).toBe("Go to today")
    await fireEvent.press(button)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it.each(["light", "dark"] as const)(
    "renders a one-line text button named by its label then hint in %s",
    async (scheme) => {
      mockScheme = scheme
      const onPress = jest.fn()
      const options = await optionsFor({ left: [done({ onPress })] })
      const view = await renderHeaderSide(options, "left")
      const button = view.getByRole("button", {
        name: "Done editing, Saves and closes",
      })
      expect(button.props.testID).toBe("done")
      expect(button.props.colors).toEqual({ contentColor: Colors[scheme].text })
      expect(view.getByText("Done").props.maxLines).toBe(1)
      expect(view.getByText("Done").props.typography).toBe("labelLarge")
      expect(view.getByTestId("compose-host").props.seedColor).toBe(
        Colors[scheme].primary,
      )
      await fireEvent.press(button)
      expect(onPress).toHaveBeenCalledTimes(1)
    },
  )

  it("names a text button by its label alone without a hint", async () => {
    const options = await optionsFor({ right: [androidOnly] })
    const view = await renderHeaderSide(options, "right")
    expect(
      view.getByRole("button", { name: "Skip this step" }).props.testID,
    ).toBe("skip-android")
  })

  it("does not press a disabled action", async () => {
    const onPress = jest.fn()
    const options = await optionsFor({
      right: [{ ...today(onPress), disabled: true }, done({ disabled: true })],
    })
    const view = await renderHeaderSide(options, "right")
    await fireEvent.press(view.getByTestId("today"))
    await fireEvent.press(view.getByTestId("done"))
    expect(onPress).not.toHaveBeenCalled()
    expect(view.getByTestId("today").props.accessibilityState).toEqual({
      disabled: true,
    })
  })
})

it("rejects actions without a name, with both or neither content, or with a tint", () => {
  const icon = { ios: "plus", android: "add" } as const
  const base = { testID: "action", onPress: () => {} }
  const unnamed = { ...base, icon }
  const iconAndLabel = {
    ...base,
    icon,
    label: "Add",
    accessibilityLabel: "Add",
  }
  const empty = { ...base, accessibilityLabel: "Add" }
  // @ts-expect-error an action requires an accessibilityLabel
  const missingName: HeaderAction = unnamed
  // @ts-expect-error an action is an icon or a label, not both
  const both: HeaderAction = iconAndLabel
  // @ts-expect-error an action needs an icon or a label
  const neither: HeaderAction = empty
  const withTint: HeaderAction = {
    ...base,
    label: "Add",
    accessibilityLabel: "Add",
    // @ts-expect-error the chrome owns the tint
    tintColor: "#ff0000",
  }
  expect([missingName, both, neither, withTint]).toHaveLength(4)
})
