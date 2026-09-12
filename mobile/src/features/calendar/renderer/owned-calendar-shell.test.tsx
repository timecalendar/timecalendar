import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Platform, StyleSheet } from "react-native"
import { State } from "react-native-gesture-handler"
import {
  cancelAnimation,
  useEvent,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated"

import { formatFullDay } from "@/features/calendar/data"
import { Colors } from "@/theme"

import { OwnedCalendarShell } from "./owned-calendar-shell"

describe("OwnedCalendarShell", () => {
  const anchor = new Date("2026-06-15T00:00:00.000Z")
  const onTransitionRequest = jest.fn()
  const onTransitionSettled = jest.fn()
  const onTransitionCancelled = jest.fn()

  function shellProps(heading = "Monday, June 15th, 2026") {
    return {
      heading,
      anchor,
      displayZone: "UTC",
      generation: 0,
      revisionFloor: 0,
      onTransitionRequest,
      onTransitionSettled,
      onTransitionCancelled,
    }
  }

  async function firePan(
    events: { state: State; translationX?: number; velocityX?: number }[],
  ) {
    const handler = jest.mocked(useEvent).mock.results.at(-1)?.value
    for (const event of events) {
      await act(async () => handler({ nativeEvent: event }))
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useReducedMotion).mockReturnValue(false)
  })

  it.each([
    ["en" as const, "Europe/Paris", "Monday, June 15th, 2026"],
    ["fr" as const, "Europe/Paris", "lundi 15 juin 2026"],
    ["en" as const, "Pacific/Noumea", "Tuesday, June 16th, 2026"],
  ])("renders the %s heading in %s", async (locale, zone, expected) => {
    const selectedDate = new Date("2026-06-15T13:30:00.000Z")
    await render(
      <OwnedCalendarShell
        {...shellProps(formatFullDay(selectedDate, locale, zone))}
      />,
    )

    expect(screen.getByRole("header", { name: expected })).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
  })

  it("fills its owner with theme-backed shell and canvas colors", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-shell").props.style,
      ),
    ).toMatchObject({ flex: 1, backgroundColor: Colors.light.background })
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-0").props.style,
      ),
    ).toMatchObject({
      backgroundColor: Colors.light.backgroundElement,
      borderColor: Colors.light.separator,
    })
  })

  it("retains exactly three week pages and hides adjacent semantics", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })

    expect(
      screen.getAllByTestId(/^owned-calendar-page--?\d$/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3)
    expect(
      screen.getByTestId("owned-calendar-page--1", {
        includeHiddenElements: true,
      }),
    ).toHaveProp("importantForAccessibility", "no-hide-descendants")
    expect(screen.getByTestId("owned-calendar-page-0")).toHaveProp(
      "accessibilityLabel",
      "Monday, June 15th, 2026",
    )
    expect(
      screen.getByTestId("owned-calendar-page-1", {
        includeHiddenElements: true,
      }),
    ).toHaveProp("accessibilityElementsHidden", true)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-0").props.style,
      ),
    ).toMatchObject({ width: 320, height: "100%" })
  })

  it.each([
    ["calendar-previous-week", -1, "previous"],
    ["calendar-next-week", 1, "next"],
  ] as const)(
    "settles %s through one revision",
    async (testID, direction, source) => {
      await render(<OwnedCalendarShell {...shellProps()} />)
      await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
        nativeEvent: { layout: { width: 320, height: 500 } },
      })
      await fireEvent.press(screen.getByTestId(testID))

      expect(onTransitionRequest).toHaveBeenCalledWith({
        revision: 1,
        direction,
        source,
      })
      expect(onTransitionSettled).toHaveBeenCalledWith(1)
    },
  )

  it("keeps repeated previous and next actions revisioned and bounded", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    for (const testID of [
      "calendar-next-week",
      "calendar-next-week",
      "calendar-previous-week",
      "calendar-previous-week",
    ]) {
      await fireEvent.press(screen.getByTestId(testID))
    }

    expect(
      onTransitionRequest.mock.calls.map(([request]) => request.revision),
    ).toEqual([1, 2, 3, 4])
    expect(onTransitionSettled.mock.calls).toEqual([[1], [2], [3], [4]])
    expect(
      screen.getAllByTestId(/^owned-calendar-page--?\d$/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3)
  })

  it.each([
    [-140, 0, 1],
    [140, 0, -1],
    [-10, -1600, 1],
    [10, 1600, -1],
  ])(
    "settles a drag/fling (%i, %i) by one page",
    async (translationX, velocityX, direction) => {
      await render(<OwnedCalendarShell {...shellProps()} />)
      await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
        nativeEvent: { layout: { width: 320, height: 500 } },
      })

      await firePan([
        { state: State.BEGAN, translationX: 0, velocityX: 0 },
        { state: State.ACTIVE, translationX, velocityX },
        { state: State.END, translationX, velocityX },
      ])

      expect(onTransitionRequest).toHaveBeenCalledWith({
        revision: 1,
        direction,
        source: "gesture",
      })
      expect(onTransitionSettled).toHaveBeenCalledTimes(1)
      expect(withTiming).toHaveBeenCalledWith(
        -direction * 320,
        { duration: 220 },
        expect.any(Function),
      )
    },
  )

  it("snaps back after a short drag without requesting or announcing a week", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    await firePan([
      { state: State.BEGAN },
      { state: State.ACTIVE, translationX: -20, velocityX: 0 },
      { state: State.END, translationX: -20, velocityX: 0 },
    ])

    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onTransitionSettled).not.toHaveBeenCalled()
    expect(withTiming).toHaveBeenCalledWith(0, { duration: 220 })
  })

  it("invalidates interrupted replacement work", async () => {
    jest.mocked(withTiming).mockImplementationOnce((value) => value)
    await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    await fireEvent.press(screen.getByTestId("calendar-next-week"))
    await firePan([{ state: State.BEGAN }, { state: State.CANCELLED }])

    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(cancelAnimation).toHaveBeenCalled()
  })

  it("settles directly under reduced motion", async () => {
    jest.mocked(useReducedMotion).mockReturnValueOnce(true)
    await render(<OwnedCalendarShell {...shellProps()} />)
    jest.mocked(withTiming).mockClear()
    await fireEvent.press(screen.getByTestId("calendar-next-week"))

    expect(onTransitionSettled).toHaveBeenCalledWith(1)
    expect(withTiming).not.toHaveBeenCalled()
  })

  it.each([
    ["ios", 44],
    ["android", 48],
  ] as const)(
    "uses the %s minimum target and localized labels",
    async (platform, minimumTarget) => {
      const original = Platform.OS
      try {
        Platform.OS = platform
        await render(<OwnedCalendarShell {...shellProps()} />)
        expect(
          screen.getByRole("button", { name: "Previous week" }),
        ).toBeOnTheScreen()
        expect(
          screen.getByRole("button", { name: "Next week" }),
        ).toBeOnTheScreen()
        expect(
          StyleSheet.flatten(
            screen.getByTestId("calendar-next-week").props.style,
          ),
        ).toMatchObject({ minWidth: minimumTarget, minHeight: minimumTarget })
      } finally {
        Platform.OS = original
      }
    },
  )
})
