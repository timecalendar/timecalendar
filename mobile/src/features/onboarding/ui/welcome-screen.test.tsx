import { act, fireEvent, render } from "@testing-library/react-native"
import { router } from "expo-router"
import {
  AccessibilityInfo,
  Animated,
  type EmitterSubscription,
  StyleSheet,
} from "react-native"

import { Colors } from "@/theme"

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
  jest.useFakeTimers()
  mockPush.mockClear()
  pagerMock.setPage.mockClear()
  pagerMock.setPageWithoutAnimation.mockClear()
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(false)
})

afterEach(async () => {
  await act(async () => jest.runOnlyPendingTimers())
  jest.useRealTimers()
})

describe("WelcomeScreen", () => {
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

  it("pushes the school step from Skip and the final CTA", async () => {
    const { getByTestId } = await render(<WelcomeScreen />)

    await fireEvent.press(getByTestId("onboarding-skip"))
    expect(mockPush).toHaveBeenLastCalledWith("/onboarding/school")

    await fireEvent(getByTestId("onboarding-pager"), "pageSelected", {
      nativeEvent: { position: 2 },
    })
    await fireEvent.press(getByTestId("onboarding-welcome-cta"))
    expect(mockPush).toHaveBeenLastCalledWith("/onboarding/school")
    expect(mockPush).toHaveBeenCalledTimes(2)

    await act(flushMicrotasks)
  })

  it("groups decorative dots and images behind translated control labels", async () => {
    const { getByRole, getByTestId } = await render(<WelcomeScreen />)

    expect(getByRole("button", { name: "Next page" })).toBeTruthy()
    expect(
      getByRole("button", {
        name: "Skip the introduction and choose your school",
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

  it("uses 150ms indicator timing when motion is allowed", async () => {
    const timing = jest.spyOn(Animated, "timing")
    const { getByTestId } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)
    timing.mockClear()

    await fireEvent.press(getByTestId("onboarding-next"))

    expect(pagerMock.setPage).toHaveBeenCalledWith(1)
    expect(timing).toHaveBeenCalledTimes(3)
    expect(timing.mock.calls.map(([, config]) => config.duration)).toEqual([
      150, 150, 150,
    ])
    timing.mockRestore()
  })

  it("snaps paging and indicators under reduced motion", async () => {
    jest
      .mocked(AccessibilityInfo.isReduceMotionEnabled)
      .mockResolvedValueOnce(true)
    const timing = jest.spyOn(Animated, "timing")
    const { getByTestId } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)

    await fireEvent.press(getByTestId("onboarding-next"))

    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(pagerMock.setPage).not.toHaveBeenCalled()
    expect(timing).not.toHaveBeenCalled()
    expect(
      StyleSheet.flatten(getByTestId("onboarding-page-indicator-1").props.style)
        .width,
    ).toBe(24)
    timing.mockRestore()
  })

  it("honors preference changes and cleans up animation subscriptions", async () => {
    let changeListener: ((enabled: boolean) => void) | undefined
    const remove = jest.fn()
    jest
      .mocked(AccessibilityInfo.addEventListener)
      .mockImplementationOnce((_event, listener) => {
        changeListener = listener as unknown as (enabled: boolean) => void
        return { remove } as unknown as EmitterSubscription
      })
    const stop = jest.fn()
    const parallel = jest.spyOn(Animated, "parallel").mockReturnValue({
      start: jest.fn(),
      stop,
      reset: jest.fn(),
    })
    const { getByTestId, unmount } = await render(<WelcomeScreen />)
    await act(flushMicrotasks)

    await act(async () => changeListener?.(true))
    await fireEvent.press(getByTestId("onboarding-next"))
    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)

    await unmount()
    expect(remove).toHaveBeenCalled()
    expect(stop).toHaveBeenCalled()
    parallel.mockRestore()
  })
})
