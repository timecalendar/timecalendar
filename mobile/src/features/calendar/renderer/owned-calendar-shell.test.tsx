import { fireEvent, render, screen } from "@testing-library/react-native"
import { AppState, StyleSheet } from "react-native"
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
      pagePosition: 0,
      revisionFloor: 0,
      onTransitionRequest,
      onTransitionSettled,
      onTransitionCancelled,
    }
  }

  async function firePan(
    events: {
      state: State
      translationX?: number
      translationY?: number
      velocityX?: number
    }[],
  ) {
    for (const event of events) {
      await fireEvent(
        screen.getByTestId("owned-calendar-canvas"),
        "gestureHandlerStateChange",
        {
          nativeEvent: {
            ...event,
            handlerTag: screen.getByTestId("owned-calendar-canvas").props
              .handlerTag,
          },
        },
      )
    }
  }

  beforeEach(() => {
    AppState.currentState = "active"
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

    expect(screen.getByRole("adjustable", { name: expected })).toBeOnTheScreen()
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
        screen.getByTestId("owned-calendar-page-0", {
          includeHiddenElements: true,
        }).props.style,
      ),
    ).toMatchObject({
      backgroundColor: expect.any(String),
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
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
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
        screen.getByTestId("owned-calendar-page-0", {
          includeHiddenElements: true,
        }).props.style,
      ),
    ).toMatchObject({ width: 320, height: "100%" })
  })

  it.each([
    ["decrement", -1, "previous"],
    ["increment", 1, "next"],
  ] as const)(
    "settles %s through one revision",
    async (testID, direction, source) => {
      await render(<OwnedCalendarShell {...shellProps()} />)
      await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
        nativeEvent: { layout: { width: 320, height: 500 } },
      })
      await fireEvent(
        screen.getByTestId("owned-calendar-canvas"),
        "accessibilityAction",
        { nativeEvent: { actionName: testID } },
      )

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
    for (const testID of ["increment", "increment", "decrement", "decrement"]) {
      await fireEvent(
        screen.getByTestId("owned-calendar-canvas"),
        "accessibilityAction",
        { nativeEvent: { actionName: testID } },
      )
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

  it.each([State.END, State.CANCELLED, State.FAILED])(
    "snaps short releases (%s) back to the committed week",
    async (state) => {
      await render(<OwnedCalendarShell {...shellProps()} />)
      await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
        nativeEvent: { layout: { width: 320, height: 500 } },
      })

      await firePan([
        { state: State.BEGAN, translationX: 0, velocityX: 0 },
        { state: State.ACTIVE, translationX: 25, velocityX: 0 },
        { state, translationX: 25, velocityX: 0 },
      ])
      expect(withTiming).toHaveBeenCalledWith(0, { duration: 220 })
      expect(onTransitionRequest).not.toHaveBeenCalled()
    },
  )

  it("does not cancel snap-back when iOS emits BEGAN immediately after END", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 390, height: 500 } },
    })
    await firePan([
      { state: State.BEGAN, translationX: 0, velocityX: 0 },
      { state: State.ACTIVE, translationX: -42.6667, velocityX: 11.7293 },
      { state: State.END, translationX: -42.6667, velocityX: 11.7293 },
    ])
    jest.mocked(cancelAnimation).mockClear()
    await firePan([
      { state: State.BEGAN, translationX: -42.6667, velocityX: 0 },
    ])
    expect(cancelAnimation).not.toHaveBeenCalled()
    expect(onTransitionRequest).not.toHaveBeenCalled()
    await firePan([
      { state: State.BEGAN, translationX: 0, velocityX: 0 },
      { state: State.FAILED, translationX: 3, velocityX: 0 },
    ])
    expect(cancelAnimation).not.toHaveBeenCalled()
  })

  it("rejects a drag that turns into a vertical system gesture", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    await firePan([
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: -30, translationY: -5 },
      { state: State.ACTIVE, translationX: -100, translationY: -250 },
      {
        state: State.END,
        translationX: -150,
        translationY: -300,
        velocityX: -900,
      },
    ])
    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(withTiming).toHaveBeenCalledWith(0, { duration: 220 })
  })

  it("does not interrupt an accepted settle when another touch begins", async () => {
    jest.mocked(withTiming).mockImplementationOnce((value) => value)
    await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    await firePan([{ state: State.BEGAN }, { state: State.CANCELLED }])

    expect(onTransitionCancelled).not.toHaveBeenCalled()
    expect(cancelAnimation).toHaveBeenCalled()
  })

  it("settles directly under reduced motion", async () => {
    jest.mocked(useReducedMotion).mockReturnValueOnce(true)
    await render(<OwnedCalendarShell {...shellProps()} />)
    jest.mocked(withTiming).mockClear()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )

    expect(onTransitionSettled).toHaveBeenCalledWith(1)
    expect(withTiming).not.toHaveBeenCalled()
  })

  it("renders measured preview labels and keeps a week's tint when it becomes current", async () => {
    const result = await render(<OwnedCalendarShell {...shellProps()} />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    expect(
      screen.getAllByText("320 × 500", { includeHiddenElements: true }),
    ).toHaveLength(3)
    expect(
      screen.getByText("2026-06-22", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    const nextColor = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-page-1", {
        includeHiddenElements: true,
      }).props.style,
    ).backgroundColor
    const currentColor = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-page-0", {
        includeHiddenElements: true,
      }).props.style,
    ).backgroundColor
    expect(nextColor).not.toBe(currentColor)
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    expect(withTiming).toHaveBeenCalledWith(
      -320,
      { duration: 220 },
      expect.any(Function),
    )
    await result.rerender(
      <OwnedCalendarShell
        {...shellProps()}
        anchor={new Date("2026-06-22T00:00:00Z")}
        generation={1}
        pagePosition={1}
      />,
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-0", {
          includeHiddenElements: true,
        }).props.style,
      ).backgroundColor,
    ).toBe(nextColor)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-strip").props.style,
      ),
    ).toMatchObject({
      left: 0,
      transform: [{ translateX: -320 }],
    })
  })

  it("registers movement and terminal state events with separate native handler holders", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    const calls = jest.mocked(useEvent).mock.calls
    expect(calls.slice(-2).map((call) => call[1])).toEqual([
      ["onGestureHandlerEvent"],
      ["onGestureHandlerStateChange"],
    ])
    expect(jest.mocked(useEvent).mock.results.at(-2)?.value).not.toBe(
      jest.mocked(useEvent).mock.results.at(-1)?.value,
    )
  })

  it("attaches the native worklet to an animated viewport without a toolbar", async () => {
    await render(<OwnedCalendarShell {...shellProps()} />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.queryByRole("header")).toBeNull()
    expect(screen.getByRole("adjustable")).toHaveProp("accessibilityActions", [
      { name: "decrement", label: "Previous week" },
      { name: "increment", label: "Next week" },
    ])
  })
})
