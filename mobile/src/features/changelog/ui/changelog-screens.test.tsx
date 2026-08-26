import { act, fireEvent, render } from "@testing-library/react-native"
import { router, Stack } from "expo-router"
import type { ReactElement } from "react"

import {
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "@/features/changelog/store"
import i18n from "@/i18n"

import { ChangelogHistoryScreen } from "./changelog-history-screen"
import { ChangelogSheetScreen } from "./changelog-sheet-screen"

jest.mock("expo-router", () => ({
  router: { dismiss: jest.fn() },
  Stack: { Screen: jest.fn(() => null) },
}))
jest.mock("expo-symbols", () => ({
  SymbolView: ({ name }: { name: unknown }) => {
    const { View } = jest.requireActual("react-native")
    return <View testID={`symbol-${JSON.stringify(name)}`} />
  },
}))
jest.mock("@/features/changelog/store", () => ({
  getChangelogSeenVersion: jest.fn(),
  setChangelogSeenVersion: jest.fn(),
}))

const mockGetSeen = getChangelogSeenVersion as jest.Mock
const mockSetSeen = setChangelogSeenVersion as jest.Mock
const mockDismiss = router.dismiss as jest.Mock
const mockStackScreen = Stack.Screen as unknown as jest.Mock
const screenOptions = () =>
  mockStackScreen.mock.lastCall?.[0].options as {
    title: string
    headerRight?: () => ReactElement<{
      testID: string
      accessibilityLabel: string
      onPress: () => void
    }>
  }

beforeEach(async () => {
  jest.clearAllMocks()
  mockStackScreen.mockClear()
  mockGetSeen.mockReturnValue(3)
  await i18n.changeLanguage("en")
})

describe("Changelog screens", () => {
  it("renders the shared newest-first history content in English", async () => {
    const view = await render(<ChangelogHistoryScreen />)
    expect(view.getByText("Version 4.0").props.accessibilityRole).toBe("header")
    expect(view.getByText("A fresh new design")).toBeTruthy()
    expect(view.getByText("A faster calendar")).toBeTruthy()
    expect(view.getByText("A truly native feel")).toBeTruthy()
    expect(view.getByTestId("changelog-safe-area").props.edges).toEqual({
      top: "off",
      left: "additive",
      right: "additive",
      bottom: "additive",
    })
    expect(screenOptions().title).toBe("What’s new")
    expect(mockSetSeen).not.toHaveBeenCalled()
    await view.unmount()
  })

  it("renders complete French copy through the same content", async () => {
    await i18n.changeLanguage("fr")
    const view = await render(<ChangelogHistoryScreen />)
    expect(view.getByText("Un tout nouveau design")).toBeTruthy()
    expect(view.getByText("Un calendrier plus rapide")).toBeTruthy()
    expect(view.getByText("Une expérience vraiment native")).toBeTruthy()
    expect(view.queryByText(/changelog\./)).toBeNull()
    await view.unmount()
  })

  it("acknowledges before Continue dismisses and remains idempotent on unmount", async () => {
    const events: string[] = []
    mockSetSeen.mockImplementation(() => events.push("write"))
    mockDismiss.mockImplementation(() => events.push("dismiss"))
    const view = await render(<ChangelogSheetScreen />)

    expect(view.getByText("Version 4.0")).toBeTruthy()
    await fireEvent.press(view.getByTestId("changelog-continue"))
    expect(events).toEqual(["write", "dismiss"])
    await view.unmount()
    expect(mockSetSeen).toHaveBeenCalledTimes(1)
  })

  it("acknowledges through the localized header close control", async () => {
    const view = await render(<ChangelogSheetScreen />)
    const headerRight = screenOptions().headerRight as () => ReactElement<{
      testID: string
      accessibilityLabel: string
      onPress: () => void
    }>
    const close = headerRight()
    expect(close.props.testID).toBe("changelog-close")
    expect(close.props.accessibilityLabel).toBe("Close")
    await act(async () => close.props.onPress())
    expect(mockSetSeen).toHaveBeenCalledWith(4)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
    await view.unmount()
  })

  it("persists on native unmount and handles an empty unseen selection", async () => {
    mockGetSeen.mockReturnValue(4)
    const view = await render(<ChangelogSheetScreen />)
    expect(view.queryByText("Version 4.0")).toBeNull()
    await view.unmount()
    expect(mockSetSeen).toHaveBeenCalledWith(4)
    expect(mockDismiss).not.toHaveBeenCalled()
  })
})
