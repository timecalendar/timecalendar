import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native"
import { createRef } from "react"
import { AppState, StyleSheet } from "react-native"
import { State } from "react-native-gesture-handler"
import {
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils"
import { useEvent, useReducedMotion } from "react-native-reanimated"

import {
  buildCalendarTimelinePresentation,
  HOURS_COLUMN_WIDTH,
  planCalendarThreePageRange,
  type TimedCalendarEventV1,
} from "@/features/calendar/data"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/theme"

import {
  OwnedCalendarShell,
  type OwnedCalendarShellHandle,
} from "./owned-calendar-shell"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}))

const mockUseColorScheme = useColorScheme as jest.Mock

interface StyledTestNode {
  props: { style: Parameters<typeof StyleSheet.flatten>[0] }
  children: readonly unknown[]
}

function styledTestNode(node: unknown): StyledTestNode {
  return node as StyledTestNode
}

const pagerMock = jest.requireMock<{
  __pagerMock: {
    setPage: jest.Mock
    setPageWithoutAnimation: jest.Mock
    deferNextTransition: () => void
  }
}>("react-native-pager-view").__pagerMock

function timedEvent(
  uid: string,
  startsAt: string,
  endsAt: string,
  title = uid,
): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title,
    color: "#112233",
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    location: "B12",
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "calendar-1",
  }
}

describe("OwnedCalendarShell", () => {
  const onTransitionRequest = jest.fn()
  const onTransitionSettled = jest.fn()
  const onTransitionCancelled = jest.fn()
  const onVerticalOffsetSettled = jest.fn()
  const onZoomSettled = jest.fn()
  const props = {
    heading: "Monday, June 15th, 2026",
    mode: "week" as const,
    anchor: new Date("2026-06-15T00:00:00.000Z"),
    displayZone: "UTC",
    locale: "en" as const,
    firstWeekday: 1 as const,
    showWeekends: true,
    currentDate: new Date("2026-06-17T12:00:00.000Z"),
    uses24HourClock: true,
    initialVerticalOffset: 0,
    initialPixelsPerHour: 60,
    generation: 0,
    revisionFloor: 0,
    onTransitionRequest,
    onTransitionSettled,
    onTransitionCancelled,
    onVerticalOffsetSettled,
    onZoomSettled,
  }
  const scrollEvent = (y: number, top = 0, bottom = 0) => ({
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentInset: { top, bottom, left: 0, right: 0 },
      contentSize: { width: 320, height: 1441 },
      layoutMeasurement: { width: 320, height: 500 },
    },
  })
  const timedViewportLayout = (width: number, height = 500) => ({
    nativeEvent: {
      layout: { x: 0, y: 0, width: width + HOURS_COLUMN_WIDTH, height },
    },
  })

  const headerTranslateX = () => {
    const style = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-date-header-strip", {
        includeHiddenElements: true,
      }).props.style,
    )
    return style.transform[0].translateX as number
  }

  const measureHeaderLane = async (width = 300) => {
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "layout",
      timedViewportLayout(width),
    )
  }

  const firePinch = (finalState: State = State.END) => {
    fireGestureHandler(getByGestureTestId("owned-calendar-pinch"), [
      { state: State.BEGAN, numberOfPointers: 1 },
      {
        state: State.ACTIVE,
        numberOfPointers: 2,
        focalX: 160,
        focalY: 250,
        scale: 1,
      },
      {
        state: State.ACTIVE,
        numberOfPointers: 2,
        focalX: 160,
        focalY: 250,
        scale: 1.1,
      },
      { state: finalState, numberOfPointers: 1 },
    ])
  }

  const fireNativeOwnerStart = (
    owner: "owned-calendar-native-scroll" | "owned-calendar-native-pager",
  ) => {
    fireGestureHandler(getByGestureTestId(owner), [
      { state: State.BEGAN, numberOfPointers: 1 },
      { state: State.ACTIVE, numberOfPointers: 1 },
    ])
  }

  beforeEach(() => {
    AppState.currentState = "active"
    jest.clearAllMocks()
    mockUseColorScheme.mockReturnValue("light")
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

  it("renders a timed class at its actual time and opens its original UID", async () => {
    const onEventPress = jest.fn()
    const event = {
      version: 1,
      kind: "timed",
      allDay: false,
      identity: { source: "synced", uid: "original-42" },
      id: "compatibility-alias",
      title: "Maths",
      color: "#112233",
      startsAt: new Date("2026-06-15T10:00:00.000Z"),
      endsAt: new Date("2026-06-15T11:00:00.000Z"),
      location: "B12",
      description: undefined,
      teachers: [],
      tags: [],
      canceled: false,
      userCalendarId: "calendar-1",
    } satisfies TimedCalendarEventV1
    const range = planCalendarThreePageRange({
      anchor: props.anchor,
      mode: props.mode,
      displayZone: props.displayZone,
      firstWeekday: props.firstWeekday,
      showWeekends: props.showWeekends,
    })
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: props.generation,
      events: [event],
    })

    const view = await render(
      <OwnedCalendarShell
        {...props}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )

    const anchor = screen.getByTestId("owned-calendar-event-original-42")
    expect(StyleSheet.flatten(anchor.props.style)).toMatchObject({
      top: 600,
      height: 60,
    })
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        initialPixelsPerHour={40}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        initialPixelsPerHour={40}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-event-original-42").props.style,
      ),
    ).toMatchObject({
      top: 398,
      height: 44,
    })
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        initialPixelsPerHour={120}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        initialPixelsPerHour={120}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-event-original-42").props.style,
      ),
    ).toMatchObject({
      top: 1200,
      height: 120,
    })
    const tile = screen.getByRole("button", {
      name: "Maths, 10:00 – 11:00 B12",
    })
    expect(tile).toHaveProp("accessibilityHint", "View details")
    expect(screen.getByText("Maths")).toBeOnTheScreen()
    expect(screen.getByText("B12")).toBeOnTheScreen()
    await fireEvent.press(tile)
    expect(onEventPress).toHaveBeenCalledWith("original-42")
  })

  it("wraps compact title and location text inside a rounded full-column tile", async () => {
    const title = "Psychocologie du développement"
    const location = "Amphithéâtre Léonard de Vinci"
    const event = {
      version: 1,
      kind: "timed",
      allDay: false,
      identity: { source: "synced", uid: "long-content" },
      id: "long-content",
      title,
      color: "#112233",
      startsAt: new Date("2026-06-15T10:00:00.000Z"),
      endsAt: new Date("2026-06-15T11:00:00.000Z"),
      location,
      description: undefined,
      teachers: [],
      tags: [],
      canceled: false,
      userCalendarId: "calendar-1",
    } satisfies TimedCalendarEventV1
    const presentation = buildCalendarTimelinePresentation({
      range: planCalendarThreePageRange(props),
      generation: props.generation,
      events: [event],
    })

    await render(
      <OwnedCalendarShell
        {...props}
        presentation={presentation}
        onEventPress={jest.fn()}
      />,
    )

    const anchor = screen.getByTestId("owned-calendar-event-long-content")
    expect(StyleSheet.flatten(anchor.props.style)).toMatchObject({
      left: "0%",
      right: 2,
    })

    const tile = screen.getByRole("button", {
      name: `${title}, 10:00 – 11:00 ${location}`,
    })
    expect(
      StyleSheet.flatten(styledTestNode(tile.children[0]).props.style),
    ).toMatchObject({
      borderRadius: 2,
      overflow: "hidden",
    })

    const titleText = screen.getByText(title)
    const locationText = screen.getByText(location)
    expect(titleText.props).toMatchObject({ accessible: false })
    expect(titleText.props.numberOfLines).toBe(1)
    expect(titleText.props.ellipsizeMode).toBeUndefined()
    expect(StyleSheet.flatten(titleText.props.style)).toMatchObject({
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 600,
    })
    expect(locationText.props).toMatchObject({ accessible: false })
    expect(locationText.props.numberOfLines).toBe(1)
    expect(locationText.props.ellipsizeMode).toBeUndefined()
    expect(StyleSheet.flatten(locationText.props.style)).toMatchObject({
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 400,
    })
  })

  it.each([1, 2, 3, 5])(
    "projects %i simultaneous classes into stable equal columns",
    async (count) => {
      const events = Array.from({ length: count }, (_, index) =>
        timedEvent(
          `column-${count}-${index}`,
          "2026-06-15T10:00:00.000Z",
          "2026-06-15T11:00:00.000Z",
        ),
      )
      const presentation = buildCalendarTimelinePresentation({
        range: planCalendarThreePageRange(props),
        generation: props.generation,
        events,
      })
      const onEventPress = jest.fn()
      const view = await render(
        <OwnedCalendarShell
          {...props}
          presentation={presentation}
          onEventPress={onEventPress}
        />,
      )

      for (let index = 0; index < count; index += 1) {
        const style = StyleSheet.flatten(
          screen.getByTestId(`owned-calendar-event-column-${count}-${index}`)
            .props.style,
        )
        expect(style.left).toBe(`${(index / count) * 100}%`)
        expect(style.right).toBe(
          index === count - 1 ? 2 : `${(1 - (index + 1) / count) * 100}%`,
        )
      }
      expect(screen.queryByTestId(/^owned-calendar-conflict-/)).toBeNull()
      expect(screen.getAllByRole("button")).toHaveLength(count)
      for (const button of screen.getAllByRole("button"))
        await fireEvent.press(button)
      expect(onEventPress.mock.calls.map(([uid]) => uid)).toEqual(
        events.map(({ identity }) => identity.uid),
      )

      if (count === 3) {
        const before = events.map(({ identity }) =>
          StyleSheet.flatten(
            screen.getByTestId(`owned-calendar-event-${identity.uid}`).props
              .style,
          ),
        )
        await view.rerender(
          <OwnedCalendarShell
            {...props}
            initialPixelsPerHour={120}
            presentation={presentation}
            onEventPress={onEventPress}
          />,
        )
        const after = events.map(({ identity }) =>
          StyleSheet.flatten(
            screen.getByTestId(`owned-calendar-event-${identity.uid}`).props
              .style,
          ),
        )
        expect(after.map(({ left, right }) => ({ left, right }))).toEqual(
          before.map(({ left, right }) => ({ left, right })),
        )
      }
    },
  )

  it("keeps conflict tiles semantic while a hidden pointer overlay opens the chooser", async () => {
    const events = [
      timedEvent(
        "tiny-a",
        "2026-06-15T10:00:00.000Z",
        "2026-06-15T10:02:00.000Z",
        "Tiny A",
      ),
      timedEvent(
        "tiny-b",
        "2026-06-15T10:03:00.000Z",
        "2026-06-15T10:05:00.000Z",
        "Tiny B",
      ),
    ]
    const presentation = buildCalendarTimelinePresentation({
      range: planCalendarThreePageRange(props),
      generation: props.generation,
      events,
    })
    const onEventPress = jest.fn()
    const view = await render(
      <OwnedCalendarShell
        {...props}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )

    expect(screen.getByTestId("owned-calendar-event-tiny-a")).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-event-tiny-b")).toBeOnTheScreen()
    const firstTile = screen.getByRole("button", { name: /Tiny A/ })
    const secondTile = screen.getByRole("button", { name: /Tiny B/ })
    const pointerOverlay = screen.getByTestId(
      "owned-calendar-conflict-synced:tiny-a|synced:tiny-b",
      { includeHiddenElements: true },
    )
    expect(screen.getAllByRole("button")).toHaveLength(2)
    expect(firstTile).toHaveProp("accessibilityHint", "View details")
    expect(pointerOverlay).toHaveProp("accessible", false)
    expect(pointerOverlay).toHaveProp("accessibilityElementsHidden", true)
    expect(pointerOverlay.props.accessibilityLabel).toBeUndefined()

    await fireEvent.press(secondTile)
    expect(onEventPress).toHaveBeenLastCalledWith("tiny-b")
    onEventPress.mockClear()

    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "scrollBeginDrag",
      scrollEvent(20),
    )
    await fireEvent.press(pointerOverlay)
    expect(screen.queryByTestId("owned-calendar-event-chooser")).toBeNull()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "momentumScrollEnd",
      scrollEvent(20),
    )
    await fireEvent.press(pointerOverlay)
    const chooser = screen.getByTestId("owned-calendar-event-chooser")
    expect(chooser).toHaveProp("accessibilityViewIsModal", true)
    expect(
      within(chooser).getByRole("button", { name: /Tiny A/ }),
    ).toBeOnTheScreen()
    const second = within(chooser).getByRole("button", { name: /Tiny B/ })
    await fireEvent.press(second)
    expect(onEventPress).toHaveBeenCalledTimes(1)
    expect(onEventPress).toHaveBeenCalledWith("tiny-b")

    await fireEvent.press(pointerOverlay)
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }))
    expect(onEventPress).toHaveBeenCalledTimes(1)

    await fireEvent.press(pointerOverlay)
    await fireEvent(
      screen.getByTestId("owned-calendar-event-chooser-modal"),
      "requestClose",
    )
    expect(screen.queryByTestId("owned-calendar-event-chooser")).toBeNull()

    await fireEvent.press(pointerOverlay)
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        generation={1}
        presentation={buildCalendarTimelinePresentation({
          range: planCalendarThreePageRange(props),
          generation: 1,
          events,
        })}
        onEventPress={onEventPress}
      />,
    )
    expect(screen.queryByTestId("owned-calendar-event-chooser")).toBeNull()
  })

  it("keeps point and two-minute visuals faithful behind one minimum target each", async () => {
    const events = [
      {
        version: 1,
        kind: "timed",
        allDay: false,
        identity: { source: "synced", uid: "noon-point" },
        id: "noon-point",
        title: undefined,
        color: "bad",
        startsAt: new Date("2026-06-15T12:00:00.000Z"),
        endsAt: new Date("2026-06-15T12:00:00.000Z"),
        location: "B12",
        description: undefined,
        teachers: [],
        tags: [],
        canceled: false,
        userCalendarId: "calendar-1",
      },
      {
        version: 1,
        kind: "timed",
        allDay: false,
        identity: { source: "synced", uid: "two-minutes" },
        id: "two-minutes",
        title: "Maths",
        color: "#AA33CC",
        startsAt: new Date("2026-06-15T13:00:00.000Z"),
        endsAt: new Date("2026-06-15T13:02:00.000Z"),
        location: "Long room name",
        description: undefined,
        teachers: [],
        tags: [],
        canceled: false,
        userCalendarId: "calendar-1",
      },
    ] satisfies TimedCalendarEventV1[]
    const presentation = buildCalendarTimelinePresentation({
      range: planCalendarThreePageRange(props),
      generation: props.generation,
      events,
      localizedNoTitle: "(No title)",
    })
    const onEventPress = jest.fn()
    await render(
      <OwnedCalendarShell
        {...props}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )

    const pointAnchor = screen.getByTestId("owned-calendar-event-noon-point")
    expect(StyleSheet.flatten(pointAnchor.props.style)).toMatchObject({
      top: 698,
      height: 44,
    })
    expect(
      StyleSheet.flatten(
        styledTestNode(styledTestNode(pointAnchor.children[0]).children[0])
          .props.style,
      ),
    ).toMatchObject({
      top: 20,
      height: 4,
    })
    expect(screen.queryByText("(No title)")).toBeNull()
    const pointButton = screen.getByRole("button", {
      name: "(No title), 12:00 – 12:00 B12",
    })
    await fireEvent.press(pointButton)
    expect(onEventPress).toHaveBeenLastCalledWith("noon-point")

    const tinyAnchor = screen.getByTestId("owned-calendar-event-two-minutes")
    expect(StyleSheet.flatten(tinyAnchor.props.style)).toMatchObject({
      top: 759,
      height: 44,
    })
    expect(
      StyleSheet.flatten(
        styledTestNode(styledTestNode(tinyAnchor.children[0]).children[0]).props
          .style,
      ),
    ).toMatchObject({
      top: 21,
      height: 2,
    })
    expect(screen.getByText("Maths")).toBeOnTheScreen()
    expect(screen.queryByText("Long room name")).toBeNull()
    expect(
      screen.getAllByRole("button", { includeHiddenElements: true }),
    ).toHaveLength(2)
  })

  it("suppresses tile activation while scroll, pager, or pinch owns movement", async () => {
    const onEventPress = jest.fn()
    const event = {
      version: 1,
      kind: "timed",
      allDay: false,
      identity: { source: "synced", uid: "movement-event" },
      id: "movement-event",
      title: "Maths",
      color: "#112233",
      startsAt: new Date("2026-06-15T10:00:00.000Z"),
      endsAt: new Date("2026-06-15T11:00:00.000Z"),
      location: "B12",
      description: undefined,
      teachers: [],
      tags: [],
      canceled: false,
      userCalendarId: "calendar-1",
    } satisfies TimedCalendarEventV1
    const presentation = buildCalendarTimelinePresentation({
      range: planCalendarThreePageRange(props),
      generation: props.generation,
      events: [event],
    })
    await render(
      <OwnedCalendarShell
        {...props}
        presentation={presentation}
        onEventPress={onEventPress}
      />,
    )
    const tile = screen.getByRole("button", {
      name: "Maths, 10:00 – 11:00 B12",
    })
    const canvas = screen.getByTestId("owned-calendar-canvas")
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })

    await fireEvent(canvas, "scrollBeginDrag", scrollEvent(20))
    await fireEvent.press(tile)
    expect(onEventPress).not.toHaveBeenCalled()

    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(20))
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "dragging" },
    })
    await fireEvent.press(tile)
    expect(onEventPress).not.toHaveBeenCalled()

    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    const pinch = getByGestureTestId("owned-calendar-pinch") as unknown as {
      handlers: {
        onBegin?: (event: Record<string, unknown>) => void
        onStart: (event: Record<string, unknown>) => void
        onFinalize: (event: Record<string, unknown>, success: boolean) => void
      }
    }
    await act(async () => {
      pinch.handlers.onBegin?.({})
      pinch.handlers.onStart({ focalX: 160, focalY: 250, scale: 1.1 })
    })
    await fireEvent.press(tile)

    expect(onEventPress).not.toHaveBeenCalled()
    await act(async () => {
      pinch.handlers.onFinalize({}, false)
    })
  })

  it("shows the current time on today's column with one shaped accessible cue", async () => {
    await render(<OwnedCalendarShell {...props} />)

    const indicator = screen.getByTestId("owned-calendar-now-0-2026-06-17", {
      includeHiddenElements: true,
    })
    expect(StyleSheet.flatten(indicator.props.style).top).toBe(720)
    expect(indicator.children).toHaveLength(2)
    expect(indicator).toHaveProp("accessible", true)
    expect(indicator).toHaveProp("accessibilityRole", "text")
    expect(indicator).toHaveProp("accessibilityLabel", "Current time, 12:00")
    expect(screen.queryByTestId("owned-calendar-now-label")).toBeNull()
    expect(
      screen.getAllByTestId(/^owned-calendar-now--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(1)
  })

  it("tracks the settled zoom scale without changing the shared time-grid defaults", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-now-0-2026-06-17", {
          includeHiddenElements: true,
        }).props.style,
      ).top,
    ).toBe(720)

    await view.rerender(
      <OwnedCalendarShell {...props} initialPixelsPerHour={120} />,
    )
    await view.rerender(
      <OwnedCalendarShell {...props} initialPixelsPerHour={120} />,
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-now-0-2026-06-17", {
          includeHiddenElements: true,
        }).props.style,
      ).top,
    ).toBe(1440)
  })

  it("renders no now presentation on a non-today page or a hidden weekend", async () => {
    const view = await render(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-08-03T00:00:00.000Z")}
      />,
    )
    expect(
      screen.queryByTestId(/^owned-calendar-now--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-15T00:00:00.000Z")}
        currentDate={new Date("2026-06-20T12:00:00.000Z")}
        showWeekends={false}
      />,
    )
    expect(screen.queryByLabelText(/Today/)).toBeNull()
    expect(
      screen.queryByTestId(/^owned-calendar-now--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()
  })

  it("keeps hidden-weekend Today meaning and now visibility absent across midnight", async () => {
    const view = await render(
      <OwnedCalendarShell
        {...props}
        currentDate={new Date("2026-06-20T23:59:00.000Z")}
        showWeekends={false}
      />,
    )
    await measureHeaderLane()
    jest.clearAllMocks()

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        currentDate={new Date("2026-06-21T00:00:00.000Z")}
        showWeekends={false}
      />,
    )

    expect(screen.queryByLabelText(/Today/)).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()
    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onTransitionSettled).not.toHaveBeenCalled()
    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
    expect(onZoomSettled).not.toHaveBeenCalled()
  })

  it.each([
    ["midnight", "2026-06-17T00:00:00.000Z", 41.67],
    ["morning", "2026-06-17T09:00:00.000Z", 496.67],
    ["late night", "2026-06-17T23:59:00.000Z", 1138.33],
  ] as const)(
    "applies the fresh-open %s clamp on the first complete viewport",
    async (_label, currentDate, expectedZoomOffset) => {
      const shellRef = createRef<OwnedCalendarShellHandle>()
      await render(
        <OwnedCalendarShell
          {...props}
          ref={shellRef}
          currentDate={new Date(currentDate)}
        />,
      )
      const canvas = screen.getByTestId("owned-calendar-canvas")
      await act(async () => {
        canvas.props.onLayout(timedViewportLayout(300))
        shellRef.current?.requestZoom("in")
      })
      expect(onZoomSettled.mock.lastCall?.[0].rawOffset).toBeCloseTo(
        expectedZoomOffset,
        2,
      )
    },
  )

  it("does not seek again after a clock tick, resize, or generation replacement", async () => {
    const shellRef = createRef<OwnedCalendarShellHandle>()
    const view = await render(
      <OwnedCalendarShell
        {...props}
        ref={shellRef}
        currentDate={new Date("2026-06-17T09:00:00.000Z")}
      />,
    )
    await measureHeaderLane()

    await view.rerender(
      <OwnedCalendarShell
        {...props}
        ref={shellRef}
        currentDate={new Date("2026-06-17T12:00:00.000Z")}
        generation={1}
      />,
    )
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "layout",
      timedViewportLayout(300, 600),
    )

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-now-0-2026-06-17", {
          includeHiddenElements: true,
        }).props.style,
      ).top,
    ).toBe(720)
    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
    expect(onZoomSettled).not.toHaveBeenCalled()
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
    const monday = within(
      screen.getByTestId("owned-calendar-date-0-2026-06-15"),
    )
    expect(monday.getByText("M")).toHaveStyle({
      color: Colors.light.text,
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 500,
    })
    expect(monday.getByText("15")).toHaveStyle({
      color: Colors.light.text,
      width: "100%",
      height: "100%",
      fontSize: 20,
      lineHeight: 32,
      fontWeight: 700,
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
    })
    expect(monday.getByText("15").props.adjustsFontSizeToFit).toBeUndefined()
    const today = within(screen.getByTestId("owned-calendar-date-0-2026-06-17"))
    expect(today.getByText("W")).toHaveStyle({ color: Colors.light.primary })
    expect(today.getByText("17").parent).toHaveStyle({
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.light.primary,
    })
    expect(today.getByText("17")).toHaveStyle({
      color: Colors.light.background,
    })
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

  it("uses gray dates and the filled Today treatment in dark mode", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    await render(<OwnedCalendarShell {...props} />)

    const monday = within(
      screen.getByTestId("owned-calendar-date-0-2026-06-15"),
    )
    expect(monday.getByText("M")).toHaveStyle({
      color: Colors.dark.textSecondary,
    })
    expect(monday.getByText("15")).toHaveStyle({
      color: Colors.dark.textSecondary,
    })

    const today = within(screen.getByTestId("owned-calendar-date-0-2026-06-17"))
    expect(today.getByText("W")).toHaveStyle({ color: Colors.dark.primary })
    expect(today.getByText("17").parent).toHaveStyle({
      backgroundColor: Colors.dark.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
    })
    expect(today.getByText("17")).toHaveStyle({
      color: Colors.dark.background,
    })
  })

  it("omits midnight and uses smaller secondary hour labels", async () => {
    await render(<OwnedCalendarShell {...props} />)

    expect(screen.queryByTestId("owned-calendar-hour-label-0")).toBeNull()
    expect(
      screen.getAllByTestId(/^owned-calendar-hour-label-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(23)
    expect(
      screen.getByTestId("owned-calendar-hour-label-1", {
        includeHiddenElements: true,
      }),
    ).toHaveTextContent("01:00")
    expect(
      screen.getByTestId("owned-calendar-hour-label-1", {
        includeHiddenElements: true,
      }),
    ).toHaveStyle({
      color: Colors.light.textSecondary,
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 400,
    })
    expect(
      screen.getByTestId("owned-calendar-hour-label-23", {
        includeHiddenElements: true,
      }),
    ).toHaveTextContent("23:00")
  })

  it("renders exactly three one-column day pages, including a hidden-weekend day", async () => {
    await render(
      <OwnedCalendarShell
        {...props}
        mode="day"
        anchor={new Date("2026-06-20T00:00:00.000Z")}
        showWeekends={false}
      />,
    )

    expect(
      screen.getAllByTestId(/^owned-calendar-page--?\d$/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3)
    expect(
      screen.getAllByTestId(/^owned-calendar-date--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3)
    expect(
      screen.getAllByTestId(/^owned-calendar-column--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3)
    expect(screen.getByLabelText("SAT 20")).toBeOnTheScreen()
  })

  it.each([
    ["day", "Previous day", "Next day"],
    ["week", "Previous week", "Next week"],
  ] as const)("labels %s paging by its unit", async (mode, previous, next) => {
    await render(<OwnedCalendarShell {...props} mode={mode} />)
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "accessibilityActions",
      [
        { name: "decrement", label: previous },
        { name: "increment", label: next },
      ],
    )
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
      expect(useEvent).toHaveBeenCalledWith(
        expect.any(Function),
        ["onPageScroll"],
        expect.any(Boolean),
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
    },
  )

  it("passes a callable native page-scroll bridge to PagerView", async () => {
    await render(<OwnedCalendarShell {...props} />)

    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })

    expect(typeof pager.props.onPageScroll).toBe("function")
  })

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
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )

    expect(headerTranslateX()).toBe(0)
    expect(onTransitionSettled).toHaveBeenCalledTimes(1)
    expect(onTransitionCancelled).not.toHaveBeenCalled()

    await fireEvent(
      screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      }),
      "pageScroll",
      { nativeEvent: { position: 1, offset: 0.25 } },
    )
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        anchor={new Date("2026-06-22T00:00:00.000Z")}
        generation={1}
      />,
    )
    expect(headerTranslateX()).toBe(-75)
  })

  it("recenters a native snap-back without committing a transition", async () => {
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
  })

  it("cancels and recenters pending motion when the app becomes inactive", async () => {
    let appStateListener: ((state: "inactive") => void) | undefined
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementationOnce((_type, listener) => {
        appStateListener = listener
        return { remove: jest.fn() }
      })
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
    fireGestureHandler(getByGestureTestId("owned-calendar-pinch"), [
      { state: State.BEGAN, numberOfPointers: 1 },
      { state: State.ACTIVE, numberOfPointers: 2, scale: 1.1 },
    ])

    await act(async () => appStateListener?.("inactive"))
    await view.rerender(<OwnedCalendarShell {...props} />)

    expect(headerTranslateX()).toBe(0)
    expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(onTransitionSettled).not.toHaveBeenCalled()
  })

  it("cancels pending motion when weekend geometry is replaced", async () => {
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
      backgroundColor: Colors.light.separator,
    })
    expect(style).not.toHaveProperty("borderTopWidth")
    expect(
      screen.getByTestId("owned-calendar-column-0-2026-06-15", {
        includeHiddenElements: true,
      }).props.style,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: Colors.light.separator }),
      ]),
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-minor-0-30", {
          includeHiddenElements: true,
        }).props.style,
      ),
    ).toMatchObject({
      backgroundColor: Colors.light.separator,
      opacity: 0.5,
    })
  })

  it("drives labels, boundaries, pages, and content extent from one scale", async () => {
    await render(<OwnedCalendarShell {...props} initialPixelsPerHour={90} />)

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-major-0-1440", {
          includeHiddenElements: true,
        }).props.style,
      ).top,
    ).toBe(2160)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-hour-label-12", {
          includeHiddenElements: true,
        }).parent?.props.style,
      ).top,
    ).toBe(1080)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-0", {
          includeHiddenElements: true,
        }).props.style,
      ).height,
    ).toBe(2160 + StyleSheet.hairlineWidth)
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

  it.each([0, 2])(
    "keeps the destination header visible through duplicate idle events on page %s",
    async (page) => {
      const view = await render(<OwnedCalendarShell {...props} />)
      await measureHeaderLane()
      const pager = screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      })

      await fireEvent(pager, "pageScroll", {
        nativeEvent: { position: page, offset: 0 },
      })
      await fireEvent(pager, "pageSelected", {
        nativeEvent: { position: page },
      })
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })
      await view.rerender(<OwnedCalendarShell {...props} />)

      expect(headerTranslateX()).toBe((1 - page) * 300)
      expect(onTransitionRequest).toHaveBeenCalledTimes(1)
      expect(onTransitionSettled).toHaveBeenCalledTimes(1)
    },
  )

  it.each([0, 2])(
    "keeps late scroll events from moving an accepted destination header on page %s",
    async (page) => {
      const view = await render(<OwnedCalendarShell {...props} />)
      await measureHeaderLane()
      const pager = screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      })

      await fireEvent(pager, "pageScroll", {
        nativeEvent: { position: page, offset: 0 },
      })
      await fireEvent(pager, "pageSelected", {
        nativeEvent: { position: page },
      })
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })
      await fireEvent(pager, "pageScroll", {
        nativeEvent: { position: 1, offset: 0 },
      })
      await view.rerender(<OwnedCalendarShell {...props} />)

      expect(headerTranslateX()).toBe((1 - page) * 300)
      expect(onTransitionSettled).toHaveBeenCalledTimes(1)
    },
  )

  it("does not let a replaced pager reset the next swipe's header", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    const staleScroll = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    }).props.onPageScroll
    const nextProps = {
      ...props,
      anchor: new Date("2026-06-22T00:00:00.000Z"),
      generation: 1,
    }
    await view.rerender(<OwnedCalendarShell {...nextProps} />)
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(pager, "pageScroll", {
      nativeEvent: { position: 1, offset: 0.25 },
    })
    await act(async () => {
      staleScroll({ nativeEvent: { position: 2, offset: 0 } })
    })
    await view.rerender(<OwnedCalendarShell {...nextProps} />)

    expect(headerTranslateX()).toBe(-75)
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
    await measureHeaderLane()
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

  it.each([State.END, State.CANCELLED])(
    "gives a two-pointer pinch precedence and rejects the stale page on %s",
    async (finalState) => {
      pagerMock.deferNextTransition()
      await render(<OwnedCalendarShell {...props} />)
      const canvas = screen.getByTestId("owned-calendar-canvas")
      const pager = screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      })
      await fireEvent(canvas, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      })

      await act(async () => firePinch(finalState))
      await fireEvent(pager, "pageSelected", {
        nativeEvent: { position: 2 },
      })
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })

      expect(pagerMock.setPageWithoutAnimation).toHaveBeenCalledWith(1)
      expect(onTransitionCancelled).toHaveBeenCalledWith(1)
      expect(onTransitionSettled).not.toHaveBeenCalled()
    },
  )

  it("gates delayed pre-pinch owner starts and completions until each native owner starts a new epoch", async () => {
    let frame: FrameRequestCallback | undefined
    const requestFrame = jest
      .spyOn(global, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frame = callback
        return 1
      })
    const shellRef = createRef<OwnedCalendarShellHandle>()
    pagerMock.deferNextTransition()
    const view = await render(<OwnedCalendarShell {...props} ref={shellRef} />)
    await measureHeaderLane()
    let canvas = screen.getByTestId("owned-calendar-canvas")
    let pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent.scroll(canvas, scrollEvent(0, 12, 80))
    await view.rerender(<OwnedCalendarShell {...props} ref={shellRef} />)
    canvas = screen.getByTestId("owned-calendar-canvas")
    pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(canvas, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    })

    await act(async () => firePinch(State.END))
    const pinchOffset = onZoomSettled.mock.lastCall?.[0].rawOffset as number
    await fireEvent(canvas, "scrollBeginDrag", scrollEvent(899, 12, 80))
    await fireEvent.scroll(canvas, scrollEvent(900, 12, 80))
    await fireEvent(canvas, "scrollEndDrag", scrollEvent(901, 12, 80))
    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(902, 12, 80))
    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(903, 12, 80))
    await act(async () => frame?.(0))
    await fireEvent(pager, "pageScroll", {
      nativeEvent: { position: 1, offset: 0.7 },
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "settling" },
    })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 0 } })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    await view.rerender(
      <OwnedCalendarShell
        {...props}
        ref={shellRef}
        initialPixelsPerHour={66}
        initialVerticalOffset={25}
      />,
    )

    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
    expect(onTransitionCancelled).not.toHaveBeenCalled()
    expect(onTransitionSettled).toHaveBeenCalledWith(1)
    expect(headerTranslateX()).toBe(0)
    canvas = screen.getByTestId("owned-calendar-canvas")
    pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })

    await act(async () => shellRef.current?.requestZoom("in"))
    expect(onZoomSettled).toHaveBeenLastCalledWith(
      expect.objectContaining({
        generation: 0,
        pixelsPerHour: 76,
        sequence: 2,
        source: "command",
      }),
    )
    const zoomOffset = onZoomSettled.mock.lastCall?.[0].rawOffset as number
    expect((zoomOffset + 216) / 76).toBeCloseTo((pinchOffset + 216) / 66)

    await act(async () => fireNativeOwnerStart("owned-calendar-native-scroll"))
    await fireEvent(canvas, "scrollBeginDrag", scrollEvent(300, 12, 80))
    await fireEvent.scroll(canvas, scrollEvent(300, 12, 80))
    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(300, 12, 80))
    expect(onVerticalOffsetSettled).toHaveBeenCalledWith(300)

    expect(onTransitionRequest).toHaveBeenCalledTimes(1)
    expect(onTransitionSettled).toHaveBeenCalledTimes(1)
    requestFrame.mockRestore()
  })

  it("observes automatic insets while blocked and rejects stale resize completions", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    await measureHeaderLane()
    await view.rerender(<OwnedCalendarShell {...props} />)
    const staleCanvas = screen.getByTestId("owned-calendar-canvas")
    const staleMomentumEnd = staleCanvas.props.onMomentumScrollEnd
    const stalePager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    const staleSelected = stalePager.props.onPageSelected
    const staleState = stalePager.props.onPageScrollStateChanged

    fireGestureHandler(getByGestureTestId("owned-calendar-pinch"), [
      { state: State.BEGAN, numberOfPointers: 1 },
      {
        state: State.ACTIVE,
        numberOfPointers: 2,
        focalX: 160,
        focalY: 250,
        scale: 1.1,
      },
    ])
    await fireEvent.scroll(
      screen.getByTestId("owned-calendar-canvas"),
      scrollEvent(700, 24, 96),
    )
    await view.rerender(<OwnedCalendarShell {...props} />)

    const resizedPager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    expect(resizedPager).not.toBe(stalePager)

    await act(async () => {
      staleMomentumEnd(scrollEvent(901, 24, 96))
      staleSelected({ nativeEvent: { position: 2 } })
      staleState({ nativeEvent: { pageScrollState: "idle" } })
    })

    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
    expect(onTransitionRequest).not.toHaveBeenCalled()
    expect(onTransitionSettled).not.toHaveBeenCalled()

    await act(async () => {
      fireNativeOwnerStart("owned-calendar-native-scroll")
      fireNativeOwnerStart("owned-calendar-native-pager")
    })
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "momentumScrollEnd",
      scrollEvent(902, 24, 96),
    )
    await fireEvent(resizedPager, "pageSelected", {
      nativeEvent: { position: 2 },
    })
    await fireEvent(resizedPager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })

    expect(onVerticalOffsetSettled).toHaveBeenCalledWith(902)
    expect(onTransitionSettled).toHaveBeenCalledWith(1)
  })

  it("settles one focal-preserving zoom result only after a successful pinch", async () => {
    await render(<OwnedCalendarShell {...props} />)

    await act(async () => firePinch(State.END))

    expect(onZoomSettled).toHaveBeenCalledTimes(1)
    expect(onZoomSettled).toHaveBeenCalledWith(
      expect.objectContaining({
        generation: 0,
        pixelsPerHour: 66,
        rawOffset: 25,
        sequence: 1,
        source: "pinch",
      }),
    )
  })

  it("restores the baseline without persistence when pinch is cancelled", async () => {
    await render(<OwnedCalendarShell {...props} />)

    await act(async () => firePinch(State.CANCELLED))

    expect(onZoomSettled).not.toHaveBeenCalled()
  })

  it("invalidates an active pinch on generation replacement", async () => {
    const view = await render(<OwnedCalendarShell {...props} />)
    const stalePager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    const staleSelected = stalePager.props.onPageSelected
    const staleState = stalePager.props.onPageScrollStateChanged
    fireGestureHandler(getByGestureTestId("owned-calendar-pinch"), [
      { state: State.BEGAN, numberOfPointers: 1 },
      { state: State.ACTIVE, numberOfPointers: 2, scale: 1.1 },
    ])

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

  it("cancels pending work on unmount during pinch ownership", async () => {
    pagerMock.deferNextTransition()
    const view = await render(<OwnedCalendarShell {...props} />)
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    fireGestureHandler(getByGestureTestId("owned-calendar-pinch"), [
      { state: State.BEGAN, numberOfPointers: 1 },
      { state: State.ACTIVE, numberOfPointers: 2, scale: 1.1 },
    ])

    await act(async () => view.unmount())

    expect(onTransitionCancelled).toHaveBeenCalledWith(1)
    expect(onTransitionSettled).not.toHaveBeenCalled()
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
