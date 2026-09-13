import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AppState, StyleSheet } from "react-native"
import { useReducedMotion } from "react-native-reanimated"

import { Colors } from "@/theme"

import { OwnedCalendarShell } from "./owned-calendar-shell"

const pagerMock = jest.requireMock<{
  __pagerMock: {
    setPage: jest.Mock
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
    const view = await render(<OwnedCalendarShell {...props} />)
    const stalePager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
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
      staleSelected({ nativeEvent: { position: 2 } })
      staleState({ nativeEvent: { pageScrollState: "idle" } })
    })

    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onTransitionSettled).not.toHaveBeenCalled()
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
