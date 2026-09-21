import { act, fireEvent, render, within } from "@testing-library/react-native"
import { router } from "expo-router"
import { AppState, type AppStateStatus } from "react-native"

import { SETTINGS_KEYS } from "@/features/settings/prefs"
import { getString, remove, setString } from "@/storage"

import TimezoneChooserScreen from "./timezone-chooser-screen"

jest.mock("expo-router", () => {
  const React = jest.requireActual("react")
  const { Pressable, Text, TextInput, View } =
    jest.requireActual("react-native")
  const Toolbar = ({ children }: { children?: unknown }) =>
    React.createElement(View, null, children)
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
    onChangeText?: (event: { nativeEvent: { text: string } }) => void
    placeholder?: string
  }) =>
    React.createElement(TextInput, {
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

afterEach(() => {
  remove(SETTINGS_KEYS.timezone)
  remove(SETTINGS_KEYS.lastManualTimezone)
  jest.mocked(router.back).mockClear()
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
})
