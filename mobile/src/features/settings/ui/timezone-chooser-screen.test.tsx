import { act, fireEvent, render, within } from "@testing-library/react-native"
import { router, useFocusEffect } from "expo-router"
import {
  AppState,
  type AppStateStatus,
  BackHandler,
  Platform,
  StyleSheet,
} from "react-native"

import { clearTimezoneRuntimeSupportCache } from "@/features/settings/data"
import { SETTINGS_KEYS } from "@/features/settings/prefs"
import { useColorScheme } from "@/hooks/use-color-scheme"
import i18n from "@/i18n"
import { getString, remove, setString } from "@/storage"
import { Colors } from "@/theme"

import TimezoneChooserScreen from "./timezone-chooser-screen"

jest.mock("expo-router", () => {
  const React = jest.requireActual("react")
  const { Pressable, Text, TextInput, View } =
    jest.requireActual("react-native")
  const Toolbar = ({
    children,
    placement,
  }: {
    children?: unknown
    placement?: string
  }) =>
    React.createElement(
      View,
      { testID: `chooser-toolbar-${placement}`, placement },
      children,
    )
  function ToolbarButton({
    children,
    onPress,
  }: {
    children?: unknown
    onPress?: () => void
  }) {
    return React.createElement(
      Pressable,
      { testID: "chooser-close", onPress },
      React.createElement(Text, null, children),
    )
  }
  function ToolbarSearchBarSlot() {
    return React.createElement(View, { testID: "toolbar-search-slot" })
  }
  Toolbar.Button = ToolbarButton
  Toolbar.SearchBarSlot = ToolbarSearchBarSlot
  const SearchBar = (props: {
    allowToolbarIntegration?: boolean
    onCancelButtonPress?: () => void
    onChangeText?: (event: { nativeEvent: { text: string } }) => void
    onClose?: () => void
    placeholder?: string
  }) =>
    React.createElement(TextInput, {
      ...props,
      testID: "timezone-search",
      placeholder: props.placeholder,
      onChangeText: (text: string) =>
        props.onChangeText?.({ nativeEvent: { text } }),
    })
  return {
    router: { back: jest.fn() },
    useFocusEffect: jest.fn(),
    Stack: { Screen: () => null, SearchBar, Toolbar },
  }
})

jest.mock("@/hooks/use-color-scheme", () => ({ useColorScheme: jest.fn() }))

const mockFocusEffect = jest.mocked(useFocusEffect)
const mockColorScheme = jest.mocked(useColorScheme)
const originalPlatform = {
  OS: Platform.OS,
  Version: Platform.Version,
  isPad: Platform.isPad,
}
let focusEffect: (() => void) | undefined

beforeEach(() => {
  mockColorScheme.mockReturnValue("light")
  mockFocusEffect.mockImplementation((callback) => {
    focusEffect = callback
  })
})

afterEach(async () => {
  remove(SETTINGS_KEYS.timezone)
  remove(SETTINGS_KEYS.lastManualTimezone)
  clearTimezoneRuntimeSupportCache()
  jest.mocked(router.back).mockClear()
  Platform.OS = originalPlatform.OS
  Platform.Version = originalPlatform.Version
  Platform.isPad = originalPlatform.isPad
  await i18n.changeLanguage("en")
  jest.restoreAllMocks()
})

describe("TimezoneChooserScreen", () => {
  it("refreshes current offsets when the app returns to the foreground", async () => {
    let listener: ((state: AppStateStatus) => void) | undefined
    const subscription = { remove: jest.fn() }
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, next) => {
        listener = next
        return subscription
      })
    jest.useFakeTimers().setSystemTime(new Date("2026-01-15T12:00:00Z"))
    const view = await render(<TimezoneChooserScreen />)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("Europe Paris"),
    )
    expect(
      within(view.getByTestId("timezone-result-Europe/Paris")).getByText(
        "UTC+01:00",
      ),
    ).toBeTruthy()
    jest.setSystemTime(new Date("2026-07-15T12:00:00Z"))
    await act(() => listener?.("active"))
    expect(
      within(view.getByTestId("timezone-result-Europe/Paris")).getByText(
        "UTC+02:00",
      ),
    ).toBeTruthy()
    view.unmount()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("owns one inset-aware lazy list and filters common cities", async () => {
    const view = await render(<TimezoneChooserScreen />)
    expect(view.getAllByTestId("timezone-results-list")).toHaveLength(1)
    expect(
      view.getByTestId("timezone-results-list").props
        .contentInsetAdjustmentBehavior,
    ).toBe("automatic")
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("Lyon"),
    )
    expect(view.getByTestId("timezone-result-Europe/Paris")).toBeTruthy()
  })

  it("pins the validated remembered manual zone while automatic mode is active", async () => {
    setString(SETTINGS_KEYS.timezone, "system")
    setString(SETTINGS_KEYS.lastManualTimezone, "Asia/Kathmandu")

    const view = await render(<TimezoneChooserScreen />)

    const first = view.getByTestId("timezone-results-list").props.data[0]
    expect(first.id).toBe("Asia/Kathmandu")
    expect(
      view.getByTestId("timezone-result-Asia/Kathmandu").props
        .accessibilityState.selected,
    ).toBe(false)
  })

  it("selects the exact identifier, writes both keys, and navigates once", async () => {
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneChooserScreen />)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("Kathmandu"),
    )
    await fireEvent.press(view.getByTestId("timezone-result-Asia/Kathmandu"))
    await fireEvent.press(view.getByTestId("timezone-result-Asia/Kathmandu"))
    expect(getString(SETTINGS_KEYS.timezone)).toBe("Asia/Kathmandu")
    expect(getString(SETTINGS_KEYS.lastManualTimezone)).toBe("Asia/Kathmandu")
    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it("clear and list gestures do not navigate or mutate", async () => {
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneChooserScreen />)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("zzzz-no-zone"),
    )
    expect(view.getByTestId("timezone-no-results")).toBeTruthy()
    await act(() => view.getByTestId("timezone-search").props.onChangeText(""))
    fireEvent(view.getByTestId("timezone-results-list"), "scrollBeginDrag")
    expect(getString(SETTINGS_KEYS.timezone)).toBe("Europe/Paris")
    expect(router.back).not.toHaveBeenCalled()
  })

  it("rejects activation when a catalog result is unavailable at runtime", async () => {
    const DateTimeFormat = Intl.DateTimeFormat
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation((locale, options) => {
      if (options?.timeZone === "US/Eastern")
        throw new RangeError("unsupported")
      return new DateTimeFormat(locale, options)
    })
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneChooserScreen />)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("US Eastern"),
    )

    const unavailable = view.getByTestId("timezone-result-US/Eastern")
    expect(unavailable.props.accessibilityState.disabled).toBe(true)
    await fireEvent.press(unavailable)
    expect(getString(SETTINGS_KEYS.timezone)).toBe("Europe/Paris")
    expect(router.back).not.toHaveBeenCalled()
  })

  it("uses the iOS 26 bottom toolbar and clears transient search natively", async () => {
    Platform.OS = "ios"
    jest.spyOn(Platform, "Version", "get").mockReturnValue("26.0")
    jest.spyOn(Platform, "isPad", "get").mockReturnValue(false)
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneChooserScreen />)

    expect(view.getByTestId("chooser-toolbar-bottom")).toBeTruthy()
    expect(view.getByTestId("toolbar-search-slot")).toBeTruthy()
    expect(
      view.getByTestId("timezone-search").props.allowToolbarIntegration,
    ).toBe(true)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("no result"),
    )
    expect(view.getByTestId("timezone-no-results")).toBeTruthy()
    await act(() =>
      view.getByTestId("timezone-search").props.onCancelButtonPress(),
    )
    expect(view.queryByTestId("timezone-no-results")).toBeNull()
  })

  it("closes once on iOS and leaves preferences intact on sheet unmount", async () => {
    Platform.OS = "ios"
    Platform.Version = "18.0"
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneChooserScreen />)

    await fireEvent.press(view.getByTestId("chooser-close"))
    expect(router.back).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(getString(SETTINGS_KEYS.timezone)).toBe("Europe/Paris")
  })

  it("delegates Android back to the native Stack and preserves state on unmount", async () => {
    Platform.OS = "android"
    const backListener = jest.spyOn(BackHandler, "addEventListener")
    setString(SETTINGS_KEYS.timezone, "Europe/Paris")
    const view = await render(<TimezoneChooserScreen />)

    expect(view.queryByTestId("chooser-close")).toBeNull()
    expect(backListener).not.toHaveBeenCalled()
    view.unmount()
    expect(getString(SETTINGS_KEYS.timezone)).toBe("Europe/Paris")
    expect(router.back).not.toHaveBeenCalled()
  })

  it("refreshes offsets when the native route regains focus", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-15T12:00:00Z"))
    const view = await render(<TimezoneChooserScreen />)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("Europe Paris"),
    )
    expect(
      within(view.getByTestId("timezone-result-Europe/Paris")).getByText(
        "UTC+01:00",
      ),
    ).toBeTruthy()

    jest.setSystemTime(new Date("2026-07-15T12:00:00Z"))
    await act(() => focusEffect?.())
    expect(
      within(view.getByTestId("timezone-result-Europe/Paris")).getByText(
        "UTC+02:00",
      ),
    ).toBeTruthy()
    jest.useRealTimers()
  })

  it("renders French labels and follows the current theme separator", async () => {
    await i18n.changeLanguage("fr")
    mockColorScheme.mockReturnValue("dark")
    const view = await render(<TimezoneChooserScreen />)
    await act(() =>
      view.getByTestId("timezone-search").props.onChangeText("Londres"),
    )

    const london = view.getByTestId("timezone-result-Europe/London")
    expect(within(london).getByText("Londres")).toBeTruthy()
    expect(StyleSheet.flatten(london.props.style).borderBottomColor).toBe(
      Colors.dark.separator,
    )
  })
})
