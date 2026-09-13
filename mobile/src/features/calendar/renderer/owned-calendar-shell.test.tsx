import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Animated, AppState, StyleSheet } from "react-native"
import { useReducedMotion } from "react-native-reanimated"

import { HOURS_COLUMN_WIDTH } from "@/features/calendar/data"
import { Colors } from "@/theme"

import { OwnedCalendarShell } from "./owned-calendar-shell"

const pagerMock = jest.requireMock<{
  __pagerMock: {
    setPage: jest.Mock
    setPageWithoutAnimation: jest.Mock
    deferNextTransition: () => void
  }
}>("react-native-pager-view").__pagerMock

describe("OwnedCalendarShell", () => {
  const onTransitionRequest = jest.fn()
  const onTransitionSettled = jest.fn()
  const onTransitionCancelled = jest.fn()
  const onVerticalOffsetSettled = jest.fn()
  const props = {
    heading: "Monday, June 15th, 2026",
    anchor: new Date("2026-06-15T00:00:00.000Z"),
    displayZone: "UTC",
    locale: "en" as const,
    firstWeekday: 1 as const,
    showWeekends: true,
    currentDate: new Date("2026-06-17T12:00:00.000Z"),
    uses24HourClock: true,
    initialVerticalOffset: 0,
    generation: 0,
    revisionFloor: 0,
    onTransitionRequest,
    onTransitionSettled,
    onTransitionCancelled,
    onVerticalOffsetSettled,
  }
  const scrollEvent = (y: number, top = 0, bottom = 0) => ({
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentInset: { top, bottom, left: 0, right: 0 },
      contentSize: { width: 320, height: 1441 },
      layoutMeasurement: { width: 320, height: 500 },
    },
  })
  const headerLaneLayout = (width: number) => ({
    nativeEvent: {
      layout: { x: HOURS_COLUMN_WIDTH, y: 0, width, height: 56 },
    },
  })

  const headerTranslateX = () => {
    const style = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-date-header-strip", {
        includeHiddenElements: true,
      }).props.style,
    )
    const translateX = style.transform[0].translateX as
      | number
      | Animated.AnimatedNode
    if (typeof translateX === "number") return translateX
    return (
      translateX as Animated.AnimatedNode & { __getValue: () => number }
    ).__getValue()
  }

  const measureHeaderLane = async (width = 300) => {
    await fireEvent(
      screen.getByTestId("owned-calendar-date-header-viewport"),
      "layout",
      headerLaneLayout(width),
    )
  }

  const mockNativePageScrollEvents = () =>
    jest.spyOn(Animated, "event").mockImplementation(((
      mapping: [
        {
          nativeEvent: {
            position: Animated.Value
            offset: Animated.Value
          }
        },
      ],
    ) => {
      return (event: { nativeEvent: { position: number; offset: number } }) => {
        mapping[0].nativeEvent.position.setValue(event.nativeEvent.position)
        mapping[0].nativeEvent.offset.setValue(event.nativeEvent.offset)
      }
    }) as typeof Animated.event)

  beforeEach(() => {
    AppState.currentState = "active"
    jest.clearAllMocks()
    jest.mocked(useReducedMotion).mockReturnValue(false)
  })

  it("uses one native scroll owner and one centered native pager", async () => {
    await render(<OwnedCalendarShell {...props} />)

    expect(
      screen.getByRole("adjustable", { name: props.heading }),
    ).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "contentInsetAdjustmentBehavior",
      "automatic",
    )
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "removeClippedSubviews",
      false,
    )
    expect(
      screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      }),
    ).toHaveProp("initialPage", 1)
    expect(
      screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      }),
    ).toHaveProp("offscreenPageLimit", 1)
  })

  it("renders one pinned seven-day header aligned with all three pages", async () => {
    await render(<OwnedCalendarShell {...props} />)

    const header = screen.getByTestId("owned-calendar-date-header")
    const canvas = screen.getByTestId("owned-calendar-canvas")
    expect(header.parent).toBe(canvas.parent)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-date-header-gutter", {
          includeHiddenElements: true,
        }).props.style,
      ).width,
    ).toBe(HOURS_COLUMN_WIDTH)
    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(7)
    expect(
      screen.getAllByTestId(/^owned-calendar-date--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(21)
    expect(
      screen.getAllByTestId(/^owned-calendar-column--?\d-\d{4}-\d{2}-\d{2}$/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(21)
    expect(screen.getByLabelText("MON 15")).toBeOnTheScreen()
    expect(screen.getByLabelText("WED 17, Today")).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-date-header-slot-0")).toHaveProp(
      "accessibilityElementsHidden",
      false,
    )
    for (const direction of [-1, 1]) {
      expect(
        screen.getByTestId(`owned-calendar-date-header-slot-${direction}`, {
          includeHiddenElements: true,
        }),
      ).toHaveProp("importantForAccessibility", "no-hide-descendants")
    }
    expect(screen.queryByRole("button", { name: /Today/ })).toBeNull()
  })

  it("redistributes five weekday cells and restores seven without a generation change", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    await view.rerender(<OwnedCalendarShell {...props} showWeekends={false} />)

    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(5)
    expect(
      screen.getAllByTestId(/^owned-calendar-date--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(15)
    expect(
      screen.getAllByTestId(/^owned-calendar-column--?\d-\d{4}-\d{2}-\d{2}$/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(15)
    expect(screen.queryByLabelText("SAT 20")).toBeNull()
    expect(screen.queryByLabelText("SUN 21")).toBeNull()

    await view.rerender(<OwnedCalendarShell {...props} showWeekends />)
    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(7)
    expect(onTransitionRequest).not.toHaveBeenCalled()
  })

  it.each([
    [1, 0.25, -75],
    [0, 0.75, 75],
  ] as const)(
    "projects native page progress %s + %s onto the matching header direction",
    async (position, offset, expectedTranslateX) => {
      const nativeEvent = mockNativePageScrollEvents()
      const view = await render(<OwnedCalendarShell {...props} />)
      await measureHeaderLane()
      const pager = screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      })

      await fireEvent(pager, "pageScroll", {
        nativeEvent: { position, offset },
      })
      await view.rerender(<OwnedCalendarShell {...props} />)

      expect(headerTranslateX()).toBe(expectedTranslateX)
      expect(nativeEvent).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ useNativeDriver: true }),
      )
      expect(
        screen.getAllByTestId(/^owned-calendar-date--?\d-/, {
          includeHiddenElements: true,
        }),
      ).toHaveLength(
        screen.getAllByTestId(/^owned-calendar-column--?\d-/, {
          includeHiddenElements: true,
        }).length,
      )
      nativeEvent.mockRestore()
    },
  )

  it("keeps the measured header pinned during vertical movement", async () => {
    await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    const header = screen.getByTestId("owned-calendar-date-header")
    const canvas = screen.getByTestId("owned-calendar-canvas")

    await fireEvent(canvas, "scrollEndDrag", scrollEvent(480))

    expect(header.parent).toBe(canvas.parent)
    expect(headerTranslateX()).toBe(0)
  })

  it("replaces an accepted destination generation centered exactly once", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(pager, "pageScroll", {
      nativeEvent: { position: 1, offset: 1 },
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )
    await measureHeaderLane()

    expect(headerTranslateX()).toBe(0)
    expect(onTransitionSettled).toHaveBeenCalledTimes(1)
    expect(onTransitionCancelled).not.toHaveBeenCalled()
  })

  it("recenters a native snap-back without committing a transition", async () => {
    const nativeEvent = mockNativePageScrollEvents()
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(pager, "pageScroll", {
      nativeEvent: { position: 1, offset: 0.25 },
    })
    await view.rerender(<OwnedCalendarShell {...props} />)
    expect(headerTranslateX()).toBe(-75)

    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    await view.rerender(<OwnedCalendarShell {...props} />)

    expect(headerTranslateX()).toBe(0)
    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onTransitionSettled).not.toHaveBeenCalled()
    expect(onTransitionCancelled).not.toHaveBeenCalled()
    nativeEvent.mockRestore()
  })

  it("cancels and recenters pending motion when the app becomes inactive", async () => {
    let appStateListener: ((state: "inactive") => void) | undefined
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementationOnce((_type, listener) => {
        appStateListener = listener
        return { remove: jest.fn() }
      })
    const nativeEvent = mockNativePageScrollEvents()
    pagerMock.deferNextTransition()
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    await fireEvent(
      screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      }),
      "pageScroll",
      { nativeEvent: { position: 1, offset: 0.4 } },
    )

    await act(async () => appStateListener?.("inactive"))
    await view.rerender(<OwnedCalendarShell {...props} />)

    expect(headerTranslateX()).toBe(0)
    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(onTransitionSettled).not.toHaveBeenCalled()
    nativeEvent.mockRestore()
  })

  it("cancels pending motion when weekend geometry is replaced", async () => {
    const nativeEvent = mockNativePageScrollEvents()
    pagerMock.deferNextTransition()
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    await view.rerender(<OwnedCalendarShell {...props} showWeekends={false} />)

    expect(headerTranslateX()).toBe(0)
    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(onTransitionSettled).not.toHaveBeenCalled()
    nativeEvent.mockRestore()
  })

  it("cancels pending motion when the page generation is replaced", async () => {
    pagerMock.deferNextTransition()
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )

    expect(headerTranslateX()).toBe(0)
    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(onTransitionSettled).not.toHaveBeenCalled()
  })

  it("cancels pending motion when the measured lane width changes", async () => {
    pagerMock.deferNextTransition()
    await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "decrement" } },
    )
    await measureHeaderLane(280)

    expect(headerTranslateX()).toBe(0)
    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(onTransitionSettled).not.toHaveBeenCalled()
  })

  it("keeps three non-collapsible pages with development identities", async () => {
    await render(<OwnedCalendarShell {...props} />)

    const pages = screen.getAllByTestId(/^owned-calendar-page--?\d$/, {
      includeHiddenElements: true,
    })
    expect(pages).toHaveLength(3)
    expect(pages.every((page) => page.props.collapsable === false)).toBe(true)
    for (const key of ["2026-06-08", "2026-06-15", "2026-06-22"]) {
      expect(
        screen.getByText(key, { includeHiddenElements: true }),
      ).toBeOnTheScreen()
    }
    expect(
      StyleSheet.flatten(pages.at(0)?.props.style).backgroundColor,
    ).not.toBe(StyleSheet.flatten(pages.at(1)?.props.style).backgroundColor)
  })

  it("draws the closing boundary as a filled physical hairline", async () => {
    await render(<OwnedCalendarShell {...props} />)

    const style = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-major-0-1440", {
        includeHiddenElements: true,
      }).props.style,
    )
    expect(style).toMatchObject({
      top: 1440,
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.light.textSecondary,
    })
    expect(style).not.toHaveProperty("borderTopWidth")
  })

  it.each([
    [0, -1],
    [2, 1],
  ] as const)(
    "settles native page %i only after idle",
    async (position, direction) => {
      await render(<OwnedCalendarShell {...props} />)
      const pager = screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      })
      await fireEvent(pager, "pageSelected", { nativeEvent: { position } })
      expect(onTransitionRequest).not.toHaveBeenCalled()
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })
      expect(onTransitionRequest).toHaveBeenCalledWith({
        revision: 1,
        direction,
        source: "gesture",
      })
      expect(onTransitionSettled).toHaveBeenCalledWith(1)
    },
  )

  it("ignores a second accessibility action while a page is pending", async () => {
    pagerMock.deferNextTransition()
    await render(<OwnedCalendarShell {...props} />)
    const canvas = screen.getByTestId("owned-calendar-canvas")

    await fireEvent(canvas, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })
    await fireEvent(canvas, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    })

    expect(onTransitionRequest).toHaveBeenCalledTimes(1)
    expect(onTransitionRequest).toHaveBeenCalledWith({
      revision: 1,
      direction: 1,
      source: "next",
    })
    expect(pagerMock.setPage).toHaveBeenCalledTimes(1)
  })

  it("consumes duplicate idle events once per pager generation", async () => {
    await render(<OwnedCalendarShell {...props} />)
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })

    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })

    expect(onTransitionRequest).toHaveBeenCalledTimes(1)
    expect(onTransitionSettled).toHaveBeenCalledTimes(1)
  })

  it("keeps a week's development tint stable when it becomes center", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    const destinationTint = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-page-1", {
        includeHiddenElements: true,
      }).props.style,
    ).backgroundColor

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-0", {
          includeHiddenElements: true,
        }).props.style,
      ).backgroundColor,
    ).toBe(destinationTint)
  })

  it("ignores events queued by a replaced pager generation", async () => {
    const nativeEvent = mockNativePageScrollEvents()
    const view = await render(<OwnedCalendarShell {...props} />)
    const stalePager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    const staleScroll = stalePager.props.onPageScroll
    const staleSelected = stalePager.props.onPageSelected
    const staleState = stalePager.props.onPageScrollStateChanged

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )
    await act(async () => {
      staleScroll({ nativeEvent: { position: 1, offset: 0.75 } })
      staleSelected({ nativeEvent: { position: 2 } })
      staleState({ nativeEvent: { pageScrollState: "idle" } })
    })
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )

    expect(headerTranslateX()).toBe(0)
    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onTransitionSettled).not.toHaveBeenCalled()
    nativeEvent.mockRestore()
  })

  it.each([
    ["decrement", -1, "previous"],
    ["increment", 1, "next"],
  ] as const)(
    "uses the pager for the %s action",
    async (action, direction, source) => {
      await render(<OwnedCalendarShell {...props} />)
      await fireEvent(
        screen.getByTestId("owned-calendar-canvas"),
        "accessibilityAction",
        {
          nativeEvent: { actionName: action },
        },
      )
      expect(onTransitionRequest).toHaveBeenCalledWith({
        revision: 1,
        direction,
        source,
      })
      expect(onTransitionSettled).toHaveBeenCalledWith(1)
    },
  )

  it("waits for momentum and stores the native final offset", async () => {
    let frame: FrameRequestCallback | undefined
    const requestFrame = jest
      .spyOn(global, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frame = callback
        return 1
      })
    await render(<OwnedCalendarShell {...props} />)
    const canvas = screen.getByTestId("owned-calendar-canvas")
    await fireEvent(canvas, "scrollEndDrag", scrollEvent(600, 12, 80))
    await fireEvent(canvas, "momentumScrollBegin", scrollEvent(600, 12, 80))
    await act(async () => frame?.(0))
    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(861, 12, 80))
    expect(onVerticalOffsetSettled).toHaveBeenCalledWith(861)
    requestFrame.mockRestore()
  })

  it("stores end-drag when native momentum does not start", async () => {
    let frame: FrameRequestCallback | undefined
    const requestFrame = jest
      .spyOn(global, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frame = callback
        return 1
      })
    await render(<OwnedCalendarShell {...props} />)
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "scrollEndDrag",
      scrollEvent(240, 10),
    )
    await act(async () => frame?.(0))
    expect(onVerticalOffsetSettled).toHaveBeenCalledWith(240)
    requestFrame.mockRestore()
  })

  it("settles accessibility paging directly for reduced motion", async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true)
    await render(<OwnedCalendarShell {...props} />)
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      {
        nativeEvent: { actionName: "increment" },
      },
    )
    expect(onTransitionSettled).toHaveBeenCalledWith(1)
  })
})
