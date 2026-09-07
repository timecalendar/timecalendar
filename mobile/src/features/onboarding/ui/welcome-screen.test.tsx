import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"
import {
  AccessibilityInfo,
  type EmitterSubscription,
  StyleSheet,
} from "react-native"
import { cancelAnimation, withTiming } from "react-native-reanimated"

import {
  getFirstIcalReminderState,
  getOnboardingResolution,
} from "@/features/first-launch/store"
import { remove, STORAGE_KEYS } from "@/storage"
import { Colors, resolveResponsiveLayout } from "@/theme"

import WelcomeScreen from "./welcome-screen"

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }))

type PagerMock = {
  setPage: jest.Mock
  setPageWithoutAnimation: jest.Mock
}

const mockPush = router.push as jest.Mock
const pagerMock = (
  jest.requireMock("react-native-pager-view") as {
    __pagerMock: PagerMock
  }
).__pagerMock

async function flushMicrotasks(turns = 3): Promise<void> {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve()
  }
}

beforeEach(() => {
  mockPush.mockClear()
  remove(STORAGE_KEYS.onboardingResolution)
  remove(STORAGE_KEYS.firstIcalReminderState)
  pagerMock.setPage.mockClear()
  pagerMock.setPageWithoutAnimation.mockClear()
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(false)
  jest.mocked(cancelAnimation).mockClear()
  jest.mocked(withTiming).mockClear()
})

afterEach(() => jest.useRealTimers())

describe("WelcomeScreen", () => {
  it("keeps one compact gutter and readable tablet caps for page and actions", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)
    const owners = [
      getByTestId("onboarding-page-content-welcome"),
      getByTestId("onboarding-footer-content"),
    ]

    for (const width of [390, 1024]) {
      for (const owner of owners) {
        await fireEvent(owner, "layout", {
          nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } },
        })
      }

      const layout = resolveResponsiveLayout(width, "readable")
      expect(layout.contentWidth).toBe(width === 390 ? 342 : 640)
      for (const owner of owners) {
        const content = owner.children[0] as unknown as {
          props: { style: unknown }
        }
        expect(StyleSheet.flatten(content.props.style)).toMatchObject({
          maxWidth: layout.maxContentWidth! + 2 * layout.gutter,
          paddingHorizontal: layout.gutter,
        })
      }
    }
    await act(flushMicrotasks)
  })

  it("renders the three localized pages in welcome-first order", async () => {
    const { getAllByRole, getByText } = await render(<WelcomeScreen />)

    expect(getByText("Welcome to TimeCalendar!")).toBeTruthy()
    expect(getByText("See your university timetable")).toBeTruthy()
    expect(getByText("See your schedule")).toBeTruthy()
    expect(
      getByText("We fetch your calendar directly from your school"),
    ).toBeTruthy()
    expect(getByText("Get notified")).toBeTruthy()
    expect(
      getByText("Be alerted when a class is added, changed or cancelled"),
    ).toBeTruthy()
    expect(
      getAllByRole("header").map((heading) => heading.props.children),
    ).toEqual(["Welcome to TimeCalendar!", "See your schedule", "Get notified"])

    await act(flushMicrotasks)
  }, 15_000)

  it("updates the controls and grouped indicator from a native swipe event", async () => {
    const { getByTestId, queryByTestId } = await render(<WelcomeScreen />)

    await fireEvent(getByTestId("onboarding-pager"), "pageSelected", {
      nativeEvent: { position: 2 },
    })

    expect(
      getByTestId("onboarding-page-indicator").props.accessibilityLabel,
    ).toBe("Page 3 of 3")
    expect(queryByTestId("onboarding-skip")).toBeNull()
    expect(queryByTestId("onboarding-next")).toBeNull()
    expect(getByTestId("onboarding-welcome-cta")).toBeTruthy()
    expect(
      StyleSheet.flatten(getByTestId("onboarding-page-indicator-2").props.style)
        .backgroundColor,
    ).toBe(Colors.light.primary)

    await act(flushMicrotasks)
  })

  it("advances both pages through the animated imperative pager API", async () => {
    const { getByTestId, queryByTestId } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)

    await fireEvent.press(getByTestId("onboarding-next"))
    expect(pagerMock.setPage).toHaveBeenLastCalledWith(1)
    expect(
      getByTestId("onboarding-page-indicator").props.accessibilityLabel,
    ).toBe("Page 2 of 3")

    await fireEvent.press(getByTestId("onboarding-next"))
    expect(pagerMock.setPage).toHaveBeenLastCalledWith(2)
    expect(queryByTestId("onboarding-next")).toBeNull()
    expect(queryByTestId("onboarding-skip")).toBeNull()
  })

  it("confirms Skip without entering school selection and keeps the reminder pending", async () => {
    const { getByRole, getByTestId, queryByTestId } = await render(
      <WelcomeScreen />,
    )

    await fireEvent.press(getByTestId("onboarding-skip"))
    expect(getByTestId("import-later-confirmation")).toBeTruthy()
    expect(mockPush).not.toHaveBeenCalled()
    expect(getOnboardingResolution()).toBeUndefined()

    await fireEvent.press(getByRole("button", { name: "Continue setup" }))
    expect(queryByTestId("import-later-confirmation")).toBeNull()
    expect(getOnboardingResolution()).toBeUndefined()

    await fireEvent.press(getByTestId("onboarding-skip"))
    await fireEvent.press(
      getByRole("button", { name: "Continue without an iCal" }),
    )
    expect(getOnboardingResolution()).toBe("skipped")
    expect(getFirstIcalReminderState()).toBe("pending")
  })

  it("pushes the school step from the final CTA", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)

    await fireEvent(getByTestId("onboarding-pager"), "pageSelected", {
      nativeEvent: { position: 2 },
    })
    await fireEvent.press(getByTestId("onboarding-welcome-cta"))
    expect(mockPush).toHaveBeenLastCalledWith("/onboarding/school")
    expect(mockPush).toHaveBeenCalledTimes(1)

    await act(flushMicrotasks)
  })

  it("groups decorative dots and images behind translated control labels", async () => {
    const { getByRole, getByTestId } = await render(<WelcomeScreen />)

    expect(getByRole("button", { name: "Next page" })).toBeTruthy()
    expect(
      getByRole("button", {
        name: "Skip university calendar setup",
      }),
    ).toBeTruthy()
    expect(getByTestId("onboarding-page-indicator").props.accessible).toBe(true)
    expect(getByTestId("onboarding-page-indicator-0").props.accessible).toBe(
      false,
    )
    expect(
      getByTestId("onboarding-illustration-welcome", {
        includeHiddenElements: true,
      }).props.accessible,
    ).toBe(false)

    await act(flushMicrotasks)
  })

  it("settles Reanimated entrance and indicator styles when motion is allowed", async () => {
    jest.useFakeTimers()
    const { getByTestId, rerender } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)
    await act(async () => jest.advanceTimersByTime(300))
    await rerender(<WelcomeScreen />)

    expect(withTiming).toHaveBeenCalledWith(1, { duration: 300 })
    expect(
      StyleSheet.flatten(getByTestId("onboarding-welcome-entrance").props.style)
        .opacity,
    ).toBe(1)
    jest.mocked(withTiming).mockClear()
    await fireEvent.press(getByTestId("onboarding-next"))
    await act(async () => jest.advanceTimersByTime(150))
    await rerender(<WelcomeScreen />)

    expect(pagerMock.setPage).toHaveBeenCalledWith(1)
    expect(withTiming).toHaveBeenCalledWith(24, { duration: 150 })
    expect(
      [0, 1, 2].map(
        (index) =>
          StyleSheet.flatten(
            getByTestId(`onboarding-page-indicator-${index}`).props.style,
          ).width,
      ),
    ).toEqual([16, 24, 16])
    expect(
      StyleSheet.flatten(getByTestId("onboarding-page-indicator-1").props.style)
        .backgroundColor,
    ).toBe(Colors.light.primary)
    jest.runOnlyPendingTimers()
  })

  it("snaps paging and decorative styles without timers under reduced motion", async () => {
    jest.useFakeTimers()
    jest
      .mocked(AccessibilityInfo.isReduceMotionEnabled)
      .mockResolvedValueOnce(true)
    const { getByTestId } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)

    await fireEvent.press(getByTestId("onboarding-next"))

    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(pagerMock.setPage).not.toHaveBeenCalled()
    expect(
      StyleSheet.flatten(getByTestId("onboarding-welcome-entrance").props.style)
        .opacity,
    ).toBe(1)
    expect(
      StyleSheet.flatten(getByTestId("onboarding-page-indicator-1").props.style)
        .width,
    ).toBe(24)
    expect(withTiming).not.toHaveBeenCalled()
  })

  it("honors preference changes and cleans up animation subscriptions", async () => {
    jest.useFakeTimers()
    let changeListener: ((enabled: boolean) => void) | undefined
    const remove = jest.fn()
    jest
      .mocked(AccessibilityInfo.addEventListener)
      .mockImplementationOnce((_event, listener) => {
        changeListener = listener as unknown as (enabled: boolean) => void
        return { remove } as unknown as EmitterSubscription
      })
    const { getByTestId, unmount } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)
    const cancellationsBeforePreferenceChange =
      jest.mocked(cancelAnimation).mock.calls.length

    await act(async () => changeListener?.(true))
    jest.clearAllTimers()
    await fireEvent.press(getByTestId("onboarding-next"))
    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(
      StyleSheet.flatten(getByTestId("onboarding-welcome-entrance").props.style)
        .opacity,
    ).toBe(1)
    expect(jest.mocked(cancelAnimation).mock.calls.length).toBeGreaterThan(
      cancellationsBeforePreferenceChange,
    )
    const cancellationsBeforeUnmount =
      jest.mocked(cancelAnimation).mock.calls.length

    await unmount()
    expect(remove).toHaveBeenCalled()
    expect(jest.mocked(cancelAnimation).mock.calls.length).toBeGreaterThan(
      cancellationsBeforeUnmount,
    )
  })
})
