import { act, fireEvent, render, within } from "@testing-library/react-native"
import { type NativeStackNavigationOptions, router, Stack } from "expo-router"
import { StyleSheet } from "react-native"
import type { TestInstance } from "test-renderer"

import {
  getChangelogSeenVersion,
  setChangelogSeenVersion,
} from "@/features/changelog/store"
import i18n from "@/i18n"
import { headerBarItem, renderHeaderSide } from "@/test-support/header-actions"
import { usePlatform } from "@/test-support/platform"
import { Colors, TypeRamp } from "@/theme"

import { ChangelogHistoryScreen } from "./changelog-history-screen"
import { ChangelogSheetScreen } from "./changelog-sheet-screen"

jest.mock("expo-router", () => ({
  router: { dismiss: jest.fn() },
  Stack: { Screen: jest.fn(() => null) },
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
  mockStackScreen.mock.lastCall?.[0].options as NativeStackNavigationOptions

beforeEach(async () => {
  jest.clearAllMocks()
  mockStackScreen.mockClear()
  mockGetSeen.mockReturnValue(3)
  await i18n.changeLanguage("en")
})

describe("Changelog screens", () => {
  it.each([390, 768, 1024])(
    "uses one readable lane for history content at %ipx",
    async (width) => {
      const view = await render(<ChangelogHistoryScreen />)
      await act(() =>
        fireEvent(view.getByTestId("changelog-scroll-owner"), "layout", {
          nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
        }),
      )
      expect(
        StyleSheet.flatten(
          view.getByTestId("changelog-responsive-content").props.style,
        ),
      ).toMatchObject({
        maxWidth: width < 600 ? 688 : 768,
        paddingHorizontal: width < 600 ? 24 : 64,
      })
      await view.unmount()
    },
  )

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

  it("persists on native unmount and handles an empty unseen selection", async () => {
    mockGetSeen.mockReturnValue(4)
    const view = await render(<ChangelogSheetScreen />)
    expect(view.queryByText("Version 4.0")).toBeNull()
    await view.unmount()
    expect(mockSetSeen).toHaveBeenCalledWith(4)
    expect(mockDismiss).not.toHaveBeenCalled()
  })
})

function hiddenSubtrees(node: TestInstance): number {
  const own =
    node.props.accessibilityElementsHidden === true &&
    node.props.importantForAccessibility === "no-hide-descendants"
      ? 1
      : 0
  return node.children.reduce<number>(
    (count, child) =>
      typeof child === "string" ? count : count + hiddenSubtrees(child),
    own,
  )
}

describe.each(["ios", "android"] as const)(
  "Changelog release list on %s",
  (platform) => {
    usePlatform(platform)
    const ios = platform === "ios"

    it("titles each release like a list section", async () => {
      const view = await render(<ChangelogHistoryScreen />)
      const title = view.getByRole("header", { name: "Version 4.0" })
      expect(title.props.testID).toBe("changelog-release-4-title")
      expect(StyleSheet.flatten(title.props.style)).toMatchObject({
        fontSize: TypeRamp[ios ? "footnote" : "label"].style.fontSize,
        color: ios ? Colors.light.textSecondary : Colors.light.actionText,
      })
      await view.unmount()
    })

    it("lists each item as a static row in catalog order", async () => {
      const view = await render(<ChangelogHistoryScreen />)
      const release = view.getByTestId("changelog-release-4")
      expect(within(release).queryAllByRole("button")).toHaveLength(0)
      const names = [0, 1, 2].map((index) => {
        const row = view.getByTestId(`changelog-release-4-item-${index}`)
        expect(row.props.accessibilityRole).toBeUndefined()
        expect(hiddenSubtrees(row)).toBeGreaterThan(0)
        return within(row)
          .getAllByLabelText(/, /)
          .map((node) => node.props.accessibilityLabel as string)[0]
      })
      expect(names).toEqual([
        `A fresh new design, ${i18n.t("changelog.item.design.subtitle")}`,
        `A faster calendar, ${i18n.t("changelog.item.speed.subtitle")}`,
        `A truly native feel, ${i18n.t("changelog.item.native.subtitle")}`,
      ])
      expect(view.queryByTestId("changelog-release-4-item-3")).toBeNull()
      await view.unmount()
    })
  },
)

describe("Changelog sheet close on ios", () => {
  usePlatform("ios")

  it("acknowledges through the native Close bar item", async () => {
    const view = await render(<ChangelogSheetScreen />)
    const close = headerBarItem(screenOptions(), "right", "changelog-close")
    expect(close).toMatchObject({
      label: "Close",
      accessibilityLabel: "Close",
      accessibilityHint: "Closes what’s new and marks this version as seen",
    })
    await act(async () => close?.onPress())
    expect(mockSetSeen).toHaveBeenCalledWith(4)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
    await view.unmount()
  })
})

describe("Changelog sheet close on android", () => {
  usePlatform("android")

  it("acknowledges through the Material Close text button", async () => {
    await render(<ChangelogSheetScreen />)
    const header = await renderHeaderSide(screenOptions(), "right")
    const close = header.getByRole("button", {
      name: "Close, Closes what’s new and marks this version as seen",
    })
    expect(close.props.testID).toBe("changelog-close")
    await fireEvent.press(close)
    expect(mockSetSeen).toHaveBeenCalledWith(4)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })
})
