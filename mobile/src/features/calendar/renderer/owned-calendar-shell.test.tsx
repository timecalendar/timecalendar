import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native"
import { type ComponentProps, createRef } from "react"
import {
  AccessibilityInfo,
  AppState,
  type ScrollView,
  StyleSheet,
  Text,
} from "react-native"
import { State } from "react-native-gesture-handler"
import {
  fireGestureHandler,
  getByGestureTestId,
} from "react-native-gesture-handler/jest-utils"
import * as Reanimated from "react-native-reanimated"

import {
  buildPagePresentation,
  type CalendarTimelineMode,
  DEFAULT_PIXELS_PER_HOUR,
  HOURS_COLUMN_WIDTH,
  MAX_PIXELS_PER_HOUR,
  MIN_PIXELS_PER_HOUR,
  type PageIndex,
  pageIndexOfInstant,
  pageKey,
  type PagePresentationV1,
  type PagePresenter,
  type TimedCalendarEventV1,
} from "@/features/calendar/data"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import i18n from "@/i18n"
import { accessibilityProbeFixture } from "@/test-support/owned-calendar/accessibility-probe"
import {
  flushUiThread,
  placeCalendarPager,
} from "@/test-support/owned-calendar/pager-driver"
import { Colors } from "@/theme"

import {
  OwnedCalendarShell,
  type OwnedCalendarShellHandle,
} from "./owned-calendar-shell"

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}))
jest.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: jest.fn(() => false),
}))
let mockFontScale = 1
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 400,
    height: 800,
    scale: 1,
    fontScale: mockFontScale,
  }),
}))

const mockUseColorScheme = useColorScheme as jest.Mock

type ShellProps = ComponentProps<typeof OwnedCalendarShell>

const ZONE = "UTC"
const ANCHOR = new Date("2026-06-15T00:00:00.000Z")
const WEEK = { mode: "week", firstWeekday: 1 } as const
const ANCHOR_INDEX = pageIndexOfInstant(WEEK, ANCHOR, ZONE)
const ANCHOR_PAGE = pageKey(WEEK, ANCHOR_INDEX)
const HIDDEN = { includeHiddenElements: true }

interface StyledTestNode {
  props: { style: Parameters<typeof StyleSheet.flatten>[0] }
  children: readonly unknown[]
}

function styledTestNode(node: unknown): StyledTestNode {
  return node as StyledTestNode
}

function presenter({
  mode = "week",
  events = [],
  showWeekends = true,
  increasedContrast = false,
}: {
  mode?: CalendarTimelineMode
  events?: readonly TimedCalendarEventV1[]
  showWeekends?: boolean
  increasedContrast?: boolean
} = {}): PagePresenter {
  const space = { mode, firstWeekday: 1 } as const
  const pages = new Map<PageIndex, PagePresentationV1>()
  return (index) => {
    const cached = pages.get(index)
    if (cached !== undefined) return cached
    const page = buildPagePresentation({
      space,
      index,
      status: "ready",
      events,
      checklist: new Map(),
      environment: {
        locale: "en",
        displayZone: ZONE,
        showWeekends,
        scheme: "light",
        increasedContrast,
        localizedNoTitle: "(No title)",
        t: i18n.t,
      },
    })
    pages.set(index, page)
    return page
  }
}

async function focusEvent(uid: string) {
  const observer = screen.getByTestId(`owned-calendar-focus-observer-${uid}`)
  await fireEvent(observer, "onAccessibilityFocused", {
    nativeEvent: {
      identity: observer.props.identity,
      dateKey: observer.props.dateKey,
      pageKey: observer.props.pageKey,
    },
  })
}

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
  const onDateCommitted = jest.fn()
  const onVerticalOffsetSettled = jest.fn()
  const onZoomSettled = jest.fn()
  const props = {
    heading: "Monday, June 15th, 2026",
    mode: "week" as const,
    anchor: ANCHOR,
    displayZone: ZONE,
    locale: "en" as const,
    firstWeekday: 1 as const,
    showWeekends: true,
    currentDate: new Date("2026-06-17T12:00:00.000Z"),
    uses24HourClock: true,
    initialVerticalOffset: 0,
    initialPixelsPerHour: 60,
    onDateCommitted,
    onVerticalOffsetSettled,
    onZoomSettled,
  }
  const shell = (overrides: Partial<ShellProps> = {}) => (
    <OwnedCalendarShell {...props} presentPage={presenter()} {...overrides} />
  )
  const renderPlaced = async (element: ReturnType<typeof shell>) => {
    const view = await render(element)
    const pager = await placeCalendarPager()
    return { view, pager }
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
      screen.getByTestId("owned-calendar-date-header-strip", HIDDEN).props
        .style,
    )
    return style.transform[0].translateX as number
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

  /** The pinch's handlers, for a gesture held between its start and its end. */
  const pinchHandlers = () =>
    (
      getByGestureTestId("owned-calendar-pinch") as unknown as {
        handlers: {
          onStart: (event: Record<string, unknown>) => void
          onEnd: (event: Record<string, unknown>, success: boolean) => void
          onFinalize: (event: Record<string, unknown>, success: boolean) => void
        }
      }
    ).handlers

  const holdPinch = () =>
    act(async () => {
      const pinch = pinchHandlers()
      pinch.onStart({
        focalX: 160,
        focalY: 250,
        scale: 1.1,
        numberOfPointers: 2,
      })
    })

  const accessiblePage = (actionName: "increment" | "decrement") =>
    fireEvent(
      screen.getByTestId("owned-calendar-page-control"),
      "accessibilityAction",
      {
        nativeEvent: { actionName },
      },
    )

  /**
   * The Reanimated Jest mock never runs `useAnimatedReaction`. This records
   * each reaction site's latest registration and runs the ones whose prepared
   * value changed, the way the UI thread does after a shared value write.
   */
  const recordAnimatedReactions = () => {
    const sites = new Map<
      string,
      {
        prepare: () => unknown
        react: (value: unknown, previous: unknown) => void
        last: unknown
      }
    >()
    const spy = jest
      .spyOn(Reanimated, "useAnimatedReaction")
      .mockImplementation((prepare, react) => {
        const key = react.toString()
        const site = sites.get(key)
        sites.set(key, {
          prepare,
          react: react as (value: unknown, previous: unknown) => void,
          last: site === undefined ? prepare() : site.last,
        })
      })
    const flush = () => {
      for (const site of sites.values()) {
        const value = site.prepare()
        if (value === site.last) continue
        const previous = site.last
        site.last = value
        site.react(value, previous)
      }
    }
    return { flush, restore: () => spy.mockRestore() }
  }

  beforeEach(() => {
    mockFontScale = 1
    AppState.currentState = "active"
    jest.clearAllMocks()
    mockUseColorScheme.mockReturnValue("light")
    jest.mocked(useReducedMotion).mockReturnValue(false)
  })

  it("uses one adjustable header control outside the native scroll views", async () => {
    await renderPlaced(shell())

    expect(
      screen.getByRole("adjustable", { name: props.heading }),
    ).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-page-control")).toBe(
      screen.getByRole("adjustable", { name: props.heading }),
    )
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "accessible",
      false,
    )
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "contentInsetAdjustmentBehavior",
      "automatic",
    )
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "removeClippedSubviews",
      false,
    )
  })

  it("renders a timed class at its actual time and opens its original UID", async () => {
    const onEventPress = jest.fn()
    const onProbeDiagnostic = jest.fn()
    const event = {
      ...timedEvent(
        "original-42",
        "2026-06-15T10:00:00.000Z",
        "2026-06-15T11:00:00.000Z",
        "Maths",
      ),
      id: "compatibility-alias",
    } satisfies TimedCalendarEventV1
    const presentPage = presenter({ events: [event] })

    const { view } = await renderPlaced(
      shell({ presentPage, onEventPress, onProbeDiagnostic }),
    )

    const anchor = screen.getByTestId("owned-calendar-event-original-42")
    await fireEvent(anchor, "layout", {
      nativeEvent: { layout: { x: 4, y: 600, width: 128, height: 60 } },
    })
    expect(onProbeDiagnostic).toHaveBeenCalledWith({
      kind: "target-frame",
      identity: "synced:original-42",
      order: 0,
      frame: { x: 4, y: 600, width: 128, height: 60 },
    })
    expect(StyleSheet.flatten(anchor.props.style)).toMatchObject({
      top: 600,
      height: 60,
    })
    for (const [scale, top, height] of [
      [40, 398, 44],
      [120, 1200, 120],
    ] as const) {
      await view.rerender(
        shell({ presentPage, onEventPress, initialPixelsPerHour: scale }),
      )
      await view.rerender(
        shell({ presentPage, onEventPress, initialPixelsPerHour: scale }),
      )
      expect(
        StyleSheet.flatten(
          screen.getByTestId("owned-calendar-event-original-42").props.style,
        ),
      ).toMatchObject({ top, height })
    }
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
      ...timedEvent(
        "long-content",
        "2026-06-15T10:00:00.000Z",
        "2026-06-15T11:00:00.000Z",
        title,
      ),
      location,
    } satisfies TimedCalendarEventV1

    await renderPlaced(
      shell({
        presentPage: presenter({ events: [event] }),
        onEventPress: jest.fn(),
      }),
    )

    const anchor = screen.getByTestId("owned-calendar-event-long-content")
    expect(StyleSheet.flatten(anchor.props.style)).toMatchObject({
      left: "0%",
      right: 2,
    })

    const tile = screen.getByRole("button", {
      name: `${title}, 10:00 – 11:00 ${location}`,
    })
    const visual = styledTestNode(tile.children[0])
    expect(visual.children).toHaveLength(4)
    expect(
      StyleSheet.flatten(styledTestNode(visual.children[0]).props.style),
    ).toMatchObject({
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    })
    expect(
      StyleSheet.flatten(styledTestNode(visual.children[2]).props.style),
    ).toMatchObject({
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
    })
    expect(
      StyleSheet.flatten(styledTestNode(visual.children[3]).props.style),
    ).toMatchObject({
      overflow: "hidden",
    })
    const textWindow = styledTestNode(visual.children[3])
    expect(
      StyleSheet.flatten(styledTestNode(textWindow.children[0]).props.style),
    ).toMatchObject({ paddingVertical: 2, transformOrigin: "top" })

    const titleText = screen.getByText(title)
    const locationText = screen.getByText(location)
    expect(titleText.props).toMatchObject({ accessible: false })
    expect(titleText.props.numberOfLines).toBeUndefined()
    expect(titleText.props.ellipsizeMode).toBeUndefined()
    expect(StyleSheet.flatten(titleText.props.style)).toMatchObject({
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 600,
    })
    expect(locationText.props).toMatchObject({ accessible: false })
    expect(locationText.props.numberOfLines).toBeUndefined()
    expect(locationText.props.ellipsizeMode).toBeUndefined()
    expect(StyleSheet.flatten(locationText.props.style)).toMatchObject({
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 400,
    })
  })

  it("keeps tiny interval caps inside the minimum zoom height", async () => {
    await renderPlaced(
      shell({
        presentPage: presenter({
          events: [
            timedEvent(
              "tiny",
              "2026-06-15T10:00:00.000Z",
              "2026-06-15T10:01:00.000Z",
            ),
          ],
        }),
        initialPixelsPerHour: 120,
      }),
    )

    const visual = styledTestNode(
      screen.getByRole("button", { name: /tiny/ }).children[0],
    )
    const cap = StyleSheet.flatten(
      styledTestNode(visual.children[0]).props.style,
    ) as { height: number }
    const bottom = StyleSheet.flatten(
      styledTestNode(visual.children[2]).props.style,
    ) as { top: number; height: number }
    const clip = StyleSheet.flatten(
      styledTestNode(visual.children[3]).props.style,
    ) as { transform: unknown }
    expect(cap.height).toBeLessThanOrEqual(40 / 60 / 2)
    expect(bottom.top + bottom.height).toBe(2)
    expect(clip.transform).toEqual([{ scaleY: 1 }])
  })

  it("keeps inner slice borders absent in increased contrast", async () => {
    await renderPlaced(
      shell({
        presentPage: presenter({
          events: [
            timedEvent(
              "contrast",
              "2026-06-15T10:00:00.000Z",
              "2026-06-15T11:00:00.000Z",
            ),
          ],
          increasedContrast: true,
        }),
      }),
    )

    const visual = styledTestNode(
      screen.getByRole("button", { name: /contrast/ }).children[0],
    )
    const top = StyleSheet.flatten(
      styledTestNode(visual.children[0]).props.style,
    )
    const middle = StyleSheet.flatten(
      styledTestNode(visual.children[1]).props.style,
    )
    const bottom = StyleSheet.flatten(
      styledTestNode(visual.children[2]).props.style,
    )
    expect(top).toMatchObject({ borderWidth: 2, borderBottomWidth: 0 })
    expect(middle).toMatchObject({ borderTopWidth: 0, borderBottomWidth: 0 })
    expect(bottom).toMatchObject({ borderTopWidth: 0, borderWidth: 2 })
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
      const presentPage = presenter({ events })
      const onEventPress = jest.fn()
      const { view } = await renderPlaced(shell({ presentPage, onEventPress }))

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
          shell({ presentPage, onEventPress, initialPixelsPerHour: 120 }),
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

  it.each([MIN_PIXELS_PER_HOUR, DEFAULT_PIXELS_PER_HOUR, MAX_PIXELS_PER_HOUR])(
    "mounts the committed fixture in projection order at %i pixels per hour",
    async (scale) => {
      const presentPage = presenter({ events: accessibilityProbeFixture() })
      const expected = presentPage(ANCHOR_INDEX).accessibilityOrder.map(
        (tile) => tile.identity.uid,
      )
      const onEventPress = jest.fn()
      await renderPlaced(
        shell({
          presentPage,
          onEventPress,
          initialVerticalOffset: 9 * scale,
          initialPixelsPerHour: scale,
        }),
      )

      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(expected.length)
      expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual(
        expected.map((uid) => expect.stringContaining(`Fixture ${uid}`)),
      )
      for (const button of buttons) await fireEvent.press(button)
      expect(onEventPress.mock.calls.map(([uid]) => uid)).toEqual(expected)
      expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
        "removeClippedSubviews",
        false,
      )
      expect(
        screen.getByTestId("owned-calendar-event-probe-early"),
      ).toBeOnTheScreen()
      expect(
        screen.getByTestId("owned-calendar-event-probe-late"),
      ).toBeOnTheScreen()
    },
  )

  it("waits for the matching visible page title when the remembered date is gone", async () => {
    const presentPage = presenter({
      events: [
        timedEvent(
          "removed-date",
          "2026-06-15T10:00:00.000Z",
          "2026-06-15T11:00:00.000Z",
        ),
      ],
    })
    const destination = {
      presentPage,
      anchor: new Date("2026-06-22T00:00:00.000Z"),
      heading: "Monday, June 22nd, 2026",
    }
    const destinationPage = pageKey(WEEK, ANCHOR_INDEX + 1)
    const titleRef = createRef<Text>()
    const onContextSettled = jest.fn()
    const focus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus")
    const titled = (overrides: Partial<ShellProps>) => (
      <>
        <Text ref={titleRef}>June 2026</Text>
        {shell({ ...destination, onContextSettled, ...overrides })}
      </>
    )
    try {
      const { view, pager } = await renderPlaced(
        titled({ anchor: ANCHOR, heading: props.heading }),
      )
      await focusEvent("removed-date")
      await pager.send(0, "onScrollBeginDrag")
      await pager.send(0.6)
      await pager.send(0.6, "onScrollEndDrag")
      await pager.send(0.6, "onMomentumScrollBegin")
      await pager.send(1)
      await pager.send(1, "onMomentumScrollEnd")
      await view.rerender(titled({}))
      expect(focus).not.toHaveBeenCalled()
      const title = {
        node: titleRef.current!,
        label: "June 2026, Monday, June 22nd, 2026",
        contextHeading: destination.heading,
        pageKey: destinationPage,
      }
      await view.rerender(
        titled({ pageTitleTarget: { ...title, pageKey: ANCHOR_PAGE } }),
      )
      expect(focus).not.toHaveBeenCalled()
      await view.rerender(titled({ pageTitleTarget: title }))
      await waitFor(() => expect(focus).toHaveBeenCalledTimes(1))
      expect(onContextSettled).toHaveBeenLastCalledWith(destinationPage, true)
    } finally {
      focus.mockRestore()
    }
  })

  it("reveals an offscreen focus target through the existing vertical owner", async () => {
    const scrollRef = { current: null } as ReturnType<
      typeof Reanimated.useAnimatedRef
    >
    const refSpy = jest
      .spyOn(Reanimated, "useAnimatedRef")
      .mockReturnValue(scrollRef)
    const focus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus")
    const presentPage = presenter({
      events: [
        timedEvent(
          "offscreen-late",
          "2026-06-15T23:00:00.000Z",
          "2026-06-15T23:45:00.000Z",
        ),
      ],
    })
    try {
      const { view } = await renderPlaced(shell({ presentPage }))
      await focusEvent("offscreen-late")
      const scrollTo = jest.spyOn(scrollRef.current as ScrollView, "scrollTo")
      try {
        await view.rerender(shell({ presentPage, routeFocused: false }))
        await view.rerender(shell({ presentPage, routeFocused: true }))
        expect(scrollTo).toHaveBeenCalledWith({
          y: 23 * 60 - 96,
          animated: false,
        })
        await waitFor(() => expect(focus).toHaveBeenCalledTimes(1))
      } finally {
        scrollTo.mockRestore()
      }
    } finally {
      await cleanup()
      focus.mockRestore()
      refSpy.mockRestore()
    }
  })

  it.each([
    ["unmatched identity", { identity: "other" }, {}],
    ["wrong date", { dateKey: "2026-06-16" }, {}],
    ["wrong page", { pageKey: "week:other" }, {}],
    ["route blur", {}, { routeFocused: false }],
  ] as const)(
    "ignores %s as accessibility-focus memory",
    async (_, override, state) => {
      const focus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus")
      const presentPage = presenter({
        events: [
          timedEvent(
            "observed",
            "2026-06-15T10:00:00.000Z",
            "2026-06-15T11:00:00.000Z",
          ),
        ],
      })
      try {
        const { view } = await renderPlaced(
          shell({
            ...state,
            presentPage,
          }),
        )
        const observer = screen.getByTestId(
          "owned-calendar-focus-observer-observed",
        )
        await fireEvent(observer, "onAccessibilityFocused", {
          nativeEvent: {
            identity: observer.props.identity,
            dateKey: observer.props.dateKey,
            pageKey: observer.props.pageKey,
            ...override,
          },
        })
        await fireEvent.press(screen.getByRole("button", { name: /observed/ }))
        await view.rerender(
          shell({ ...state, routeFocused: false, presentPage }),
        )
        await view.rerender(
          shell({ ...state, routeFocused: true, presentPage }),
        )
        expect(focus).not.toHaveBeenCalled()
      } finally {
        focus.mockRestore()
      }
    },
  )

  it.each(["route blur", "page crossing"] as const)(
    "invalidates a pending focus frame on %s",
    async (change) => {
      const presentPage = presenter({
        events: [
          timedEvent(
            "return-target",
            "2026-06-15T10:00:00.000Z",
            "2026-06-15T11:00:00.000Z",
          ),
        ],
      })
      const focus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus")
      const { view, pager } = await renderPlaced(
        shell({ routeFocused: true, presentPage }),
      )
      await focusEvent("return-target")
      let frame: FrameRequestCallback | undefined
      const requestFrame = jest
        .spyOn(global, "requestAnimationFrame")
        .mockImplementation((callback) => {
          frame = callback
          return 73
        })
      const cancelFrame = jest.spyOn(global, "cancelAnimationFrame")
      try {
        await view.rerender(shell({ routeFocused: false, presentPage }))
        await view.rerender(shell({ routeFocused: true, presentPage }))
        const pendingFrame = frame
        expect(pendingFrame).toBeDefined()
        if (change === "route blur") {
          await view.rerender(shell({ routeFocused: false, presentPage }))
        } else {
          await pager.send(0, "onScrollBeginDrag")
          await pager.send(0.6)
          await flushUiThread()
        }
        expect(cancelFrame).toHaveBeenCalledWith(73)
        await act(async () => pendingFrame?.(0))
        expect(focus).not.toHaveBeenCalled()
      } finally {
        requestFrame.mockRestore()
        cancelFrame.mockRestore()
        focus.mockRestore()
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
    const onEventPress = jest.fn()
    await renderPlaced(
      shell({ presentPage: presenter({ events }), onEventPress }),
    )

    expect(screen.getByTestId("owned-calendar-event-tiny-a")).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-event-tiny-b")).toBeOnTheScreen()
    const firstTile = screen.getByRole("button", { name: /Tiny A/ })
    const secondTile = screen.getByRole("button", { name: /Tiny B/ })
    const pointerOverlay = screen.getByTestId(
      "owned-calendar-conflict-synced:tiny-a|synced:tiny-b",
      HIDDEN,
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
  })

  it("keeps point and two-minute visuals faithful behind one minimum target each", async () => {
    const events = [
      {
        ...timedEvent(
          "noon-point",
          "2026-06-15T12:00:00.000Z",
          "2026-06-15T12:00:00.000Z",
        ),
        title: undefined,
        color: "bad",
      },
      {
        ...timedEvent(
          "two-minutes",
          "2026-06-15T13:00:00.000Z",
          "2026-06-15T13:02:00.000Z",
          "Maths",
        ),
        color: "#AA33CC",
        location: "Long room name",
      },
    ] satisfies TimedCalendarEventV1[]
    const onEventPress = jest.fn()
    await renderPlaced(
      shell({ presentPage: presenter({ events }), onEventPress }),
    )

    const pointAnchor = screen.getByTestId("owned-calendar-event-noon-point")
    expect(StyleSheet.flatten(pointAnchor.props.style)).toMatchObject({
      top: 698,
      height: 44,
    })
    expect(
      StyleSheet.flatten(
        styledTestNode(
          styledTestNode(styledTestNode(pointAnchor.children[0]).children[0])
            .children[0],
        ).props.style,
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
        styledTestNode(
          styledTestNode(styledTestNode(tinyAnchor.children[0]).children[0])
            .children[0],
        ).props.style,
      ),
    ).toMatchObject({
      top: 21,
      height: 2,
    })
    expect(screen.getByText("Maths")).toBeOnTheScreen()
    expect(screen.queryByText("Long room name")).toBeNull()
    expect(screen.getAllByRole("button", HIDDEN)).toHaveLength(2)
  })

  it("suppresses tile activation while scroll, pager, or pinch owns movement", async () => {
    const onEventPress = jest.fn()
    const { pager } = await renderPlaced(
      shell({
        presentPage: presenter({
          events: [
            timedEvent(
              "movement-event",
              "2026-06-15T10:00:00.000Z",
              "2026-06-15T11:00:00.000Z",
              "Maths",
            ),
          ],
        }),
        onEventPress,
      }),
    )
    const tile = screen.getByRole("button", {
      name: "Maths, 10:00 – 11:00 B12",
    })
    const canvas = screen.getByTestId("owned-calendar-canvas")

    await fireEvent(canvas, "scrollBeginDrag", scrollEvent(20))
    await fireEvent.press(tile)
    expect(onEventPress).not.toHaveBeenCalled()

    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(20))
    await pager.send(0, "onScrollBeginDrag")
    await fireEvent.press(tile)
    expect(onEventPress).not.toHaveBeenCalled()

    await pager.send(0, "onScrollEndDrag")
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
    await fireEvent.press(tile)
    expect(onEventPress).toHaveBeenCalledWith("movement-event")
  })

  it("shows the current time on today's column with one shaped accessible cue", async () => {
    await renderPlaced(shell())

    const indicator = screen.getByTestId(
      "owned-calendar-now-2026-06-17",
      HIDDEN,
    )
    expect(StyleSheet.flatten(indicator.props.style).top).toBe(716)
    expect(indicator.children).toHaveLength(2)
    expect(indicator).toHaveProp("accessible", true)
    expect(indicator).toHaveProp("accessibilityRole", "text")
    expect(indicator).toHaveProp("accessibilityLabel", "Current time, 12:00")
    expect(screen.queryByTestId("owned-calendar-now-label")).toBeNull()
    expect(screen.getAllByTestId(/^owned-calendar-now-/, HIDDEN)).toHaveLength(
      1,
    )
  })

  it("tracks the settled zoom scale without changing the shared time-grid defaults", async () => {
    const presentPage = presenter()
    const { view } = await renderPlaced(shell({ presentPage }))
    const nowTop = () =>
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-now-2026-06-17", HIDDEN).props.style,
      ).top
    expect(nowTop()).toBe(716)

    await view.rerender(shell({ presentPage, initialPixelsPerHour: 120 }))
    await view.rerender(shell({ presentPage, initialPixelsPerHour: 120 }))
    expect(nowTop()).toBe(1436)
  })

  it("renders no now presentation on a non-today page or a hidden weekend", async () => {
    const view = await render(
      shell({ anchor: new Date("2026-08-03T00:00:00.000Z") }),
    )
    await placeCalendarPager()
    expect(screen.queryByTestId(/^owned-calendar-now-/, HIDDEN)).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()
    await view.unmount()

    await renderPlaced(
      shell({
        currentDate: new Date("2026-06-20T12:00:00.000Z"),
        showWeekends: false,
        presentPage: presenter({ showWeekends: false }),
      }),
    )
    expect(screen.queryByLabelText(/Today/)).toBeNull()
    expect(screen.queryByTestId(/^owned-calendar-now-/, HIDDEN)).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()
  })

  it("keeps hidden-weekend Today meaning and now visibility absent across midnight", async () => {
    const weekdays = {
      showWeekends: false,
      presentPage: presenter({ showWeekends: false }),
    }
    const { view } = await renderPlaced(
      shell({ ...weekdays, currentDate: new Date("2026-06-20T23:59:00.000Z") }),
    )
    jest.clearAllMocks()

    await view.rerender(
      shell({ ...weekdays, currentDate: new Date("2026-06-21T00:00:00.000Z") }),
    )

    expect(screen.queryByLabelText(/Today/)).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()
    expect(onDateCommitted).not.toHaveBeenCalled()
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
      await render(shell({ ref: shellRef, currentDate: new Date(currentDate) }))
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

  it("does not seek again after a clock tick or resize", async () => {
    const presentPage = presenter()
    const { view } = await renderPlaced(
      shell({ presentPage, currentDate: new Date("2026-06-17T09:00:00.000Z") }),
    )

    await view.rerender(
      shell({ presentPage, currentDate: new Date("2026-06-17T12:00:00.000Z") }),
    )
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "layout",
      timedViewportLayout(300, 600),
    )

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-now-2026-06-17", HIDDEN).props.style,
      ).top,
    ).toBe(716)
    expect(onDateCommitted).not.toHaveBeenCalled()
    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
    expect(onZoomSettled).not.toHaveBeenCalled()
  })

  it("renders one pinned seven-day header aligned with its mounted pages", async () => {
    await renderPlaced(shell())

    const header = screen.getByTestId("owned-calendar-date-header")
    const canvas = screen.getByTestId("owned-calendar-canvas")
    expect(header.parent).toBe(canvas.parent)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-page-control", HIDDEN).props.style,
      ).width,
    ).toBe(HOURS_COLUMN_WIDTH)
    expect(screen.getAllByTestId(/^owned-calendar-date-\d{4}-/)).toHaveLength(7)
    const pageCount = screen.getAllByTestId(
      /^owned-calendar-page-week:/,
      HIDDEN,
    ).length
    expect(pageCount).toBeGreaterThan(1)
    expect(
      screen.getAllByTestId(/^owned-calendar-date-\d{4}-/, HIDDEN),
    ).toHaveLength(7 * pageCount)
    expect(
      screen.getAllByTestId(
        /^owned-calendar-column-\d{4}-\d{2}-\d{2}$/,
        HIDDEN,
      ),
    ).toHaveLength(7 * pageCount)
    expect(screen.getByLabelText("MON 15")).toBeOnTheScreen()
    expect(screen.getByLabelText("WED 17, Today")).toBeOnTheScreen()
    const monday = within(screen.getByTestId("owned-calendar-date-2026-06-15"))
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
      fontWeight: 700,
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
    })
    expect(monday.getByText("15").props.adjustsFontSizeToFit).toBeUndefined()
    expect(monday.getByText("15")).toHaveProp("maxFontSizeMultiplier", 1)
    expect(screen.getByTestId("owned-calendar-page-control")).toHaveProp(
      "accessible",
      true,
    )
    const today = within(screen.getByTestId("owned-calendar-date-2026-06-17"))
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
    expect(
      screen.getByTestId(`owned-calendar-date-header-slot-${ANCHOR_PAGE}`),
    ).toHaveProp("accessibilityElementsHidden", false)
    for (const direction of [-1, 1]) {
      expect(
        screen.getByTestId(
          `owned-calendar-date-header-slot-${pageKey(WEEK, ANCHOR_INDEX + direction)}`,
          HIDDEN,
        ),
      ).toHaveProp("importantForAccessibility", "no-hide-descendants")
    }
    expect(screen.queryByRole("button", { name: /Today/ })).toBeNull()
  })

  it("grows the header at the largest text scale while bounding the date badge and gutter icon", async () => {
    mockFontScale = 5
    await renderPlaced(shell())

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-date-header").props.style,
      ).minHeight,
    ).toBe(105)
    const control = screen.getByTestId("owned-calendar-page-control")
    expect(StyleSheet.flatten(control.props.style).minHeight).toBe(56)
    expect(within(control).getByText("‹ ›")).toHaveProp(
      "maxFontSizeMultiplier",
      1,
    )
    const date = within(screen.getByTestId("owned-calendar-date-2026-06-15"))
    expect(date.getByText("15")).toHaveProp("maxFontSizeMultiplier", 1)
    expect(
      StyleSheet.flatten(date.getByText("15").parent?.props.style).width,
    ).toBeLessThanOrEqual(32)
  })

  it("uses gray dates and the filled Today treatment in dark mode", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    await renderPlaced(shell())

    const monday = within(screen.getByTestId("owned-calendar-date-2026-06-15"))
    expect(monday.getByText("M")).toHaveStyle({
      color: Colors.dark.textSecondary,
    })
    expect(monday.getByText("15")).toHaveStyle({
      color: Colors.dark.textSecondary,
    })

    const today = within(screen.getByTestId("owned-calendar-date-2026-06-17"))
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
    await renderPlaced(shell())

    expect(screen.queryByTestId("owned-calendar-hour-label-0")).toBeNull()
    expect(
      screen.getAllByTestId(/^owned-calendar-hour-label-/, HIDDEN),
    ).toHaveLength(23)
    const one = screen.getByTestId("owned-calendar-hour-label-1", HIDDEN)
    expect(one).toHaveTextContent("01:00")
    expect(one).toHaveStyle({
      color: Colors.light.textSecondary,
      fontSize: 11,
      lineHeight: 13,
      fontWeight: 400,
    })
    expect(
      screen.getByTestId("owned-calendar-hour-label-23", HIDDEN),
    ).toHaveTextContent("23:00")
  })

  it("renders one-column day pages, including a hidden-weekend day", async () => {
    await renderPlaced(
      shell({
        mode: "day",
        anchor: new Date("2026-06-20T00:00:00.000Z"),
        showWeekends: false,
        presentPage: presenter({ mode: "day", showWeekends: false }),
      }),
    )

    const pageCount = screen.getAllByTestId(
      /^owned-calendar-page-day:/,
      HIDDEN,
    ).length
    expect(pageCount).toBeGreaterThan(1)
    expect(
      screen.getAllByTestId(/^owned-calendar-date-\d{4}-/, HIDDEN),
    ).toHaveLength(pageCount)
    expect(
      screen.getAllByTestId(/^owned-calendar-column-\d{4}-/, HIDDEN),
    ).toHaveLength(pageCount)
    expect(screen.getByLabelText("SAT 20")).toBeOnTheScreen()
  })

  it.each([
    ["day", "Previous day", "Next day"],
    ["week", "Previous week", "Next week"],
  ] as const)("labels %s paging by its unit", async (mode, previous, next) => {
    await render(shell({ mode, presentPage: presenter({ mode }) }))
    expect(screen.getByTestId("owned-calendar-page-control")).toHaveProp(
      "accessibilityActions",
      [
        { name: "decrement", label: previous },
        { name: "increment", label: next },
      ],
    )
  })

  it("redistributes five weekday cells and restores seven without paging", async () => {
    const { view } = await renderPlaced(shell())
    await view.rerender(
      shell({
        showWeekends: false,
        presentPage: presenter({ showWeekends: false }),
      }),
    )

    const pageCount = screen.getAllByTestId(
      /^owned-calendar-page-week:/,
      HIDDEN,
    ).length
    expect(screen.getAllByTestId(/^owned-calendar-date-\d{4}-/)).toHaveLength(5)
    expect(
      screen.getAllByTestId(/^owned-calendar-date-\d{4}-/, HIDDEN),
    ).toHaveLength(5 * pageCount)
    expect(
      screen.getAllByTestId(
        /^owned-calendar-column-\d{4}-\d{2}-\d{2}$/,
        HIDDEN,
      ),
    ).toHaveLength(5 * pageCount)
    expect(screen.queryByLabelText("SAT 20")).toBeNull()
    expect(screen.queryByLabelText("SUN 21")).toBeNull()

    await view.rerender(shell())
    expect(screen.getAllByTestId(/^owned-calendar-date-\d{4}-/)).toHaveLength(7)
    expect(onDateCommitted).not.toHaveBeenCalled()
  })

  it("moves the header strip with the pager's native offset", async () => {
    const presentPage = presenter()
    const { view, pager } = await renderPlaced(shell({ presentPage }))

    await pager.send(0.25)
    await view.rerender(shell({ presentPage }))

    expect(headerTranslateX()).toBe(-(pager.origin + 0.25 * pager.pageWidth))
  })

  it("keeps the measured header pinned during vertical movement", async () => {
    await renderPlaced(shell())
    const header = screen.getByTestId("owned-calendar-date-header")
    const canvas = screen.getByTestId("owned-calendar-canvas")
    const before = headerTranslateX()

    await fireEvent(canvas, "scrollEndDrag", scrollEvent(480))

    expect(header.parent).toBe(canvas.parent)
    expect(headerTranslateX()).toBe(before)
  })

  it("draws the closing boundary as a filled physical hairline", async () => {
    await renderPlaced(shell())

    const style = StyleSheet.flatten(
      screen.getByTestId("owned-calendar-major-1440", HIDDEN).props.style,
    )
    expect(style).toMatchObject({
      top: 1440,
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.light.separator,
    })
    expect(style).not.toHaveProperty("borderTopWidth")
    expect(
      screen.getByTestId("owned-calendar-column-2026-06-15", HIDDEN).props
        .style,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: Colors.light.separator }),
      ]),
    )
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-minor-30", HIDDEN).props.style,
      ),
    ).toMatchObject({
      backgroundColor: Colors.light.separator,
      opacity: 0.5,
    })
  })

  it("drives labels, boundaries, and content extent from one scale", async () => {
    await renderPlaced(shell({ initialPixelsPerHour: 90 }))

    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-major-1440", HIDDEN).props.style,
      ).top,
    ).toBe(2160)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-hour-label-12", HIDDEN).parent?.props
          .style,
      ).top,
    ).toBe(1073.5)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-day", HIDDEN).props.style,
      ).height,
    ).toBe(2160 + StyleSheet.hairlineWidth)
  })

  it.each([
    ["decrement", "with animation", -1, true, "2026-06-08"],
    ["increment", "with animation", 1, true, "2026-06-22"],
    [
      "increment",
      "without animation for reduced motion",
      1,
      false,
      "2026-06-22",
    ],
  ] as const)(
    "pages on %s %s, then commits the neighbour once it lands",
    async (action, _motion, direction, animated, committedDate) => {
      jest.mocked(useReducedMotion).mockReturnValue(!animated)
      const scrollTo = jest.spyOn(Reanimated, "scrollTo")
      try {
        const { pager } = await renderPlaced(shell())
        scrollTo.mockClear()

        await fireEvent(
          screen.getByTestId("owned-calendar-page-control"),
          "accessibilityAction",
          { nativeEvent: { actionName: action } },
        )
        await flushUiThread()

        expect(scrollTo).toHaveBeenCalledTimes(1)
        expect(scrollTo.mock.calls[0]?.slice(1)).toEqual([
          pager.origin + direction * pager.pageWidth,
          0,
          animated,
        ])
        expect(onDateCommitted).not.toHaveBeenCalled()
        await pager.send(direction)
        expect(onDateCommitted).toHaveBeenCalledTimes(1)
        expect(
          onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10),
        ).toBe(committedDate)
      } finally {
        scrollTo.mockRestore()
      }
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
    try {
      await renderPlaced(shell())
      const canvas = screen.getByTestId("owned-calendar-canvas")
      await fireEvent(canvas, "scrollEndDrag", scrollEvent(600, 12, 80))
      await fireEvent(canvas, "momentumScrollBegin", scrollEvent(600, 12, 80))
      await act(async () => frame?.(0))
      expect(onVerticalOffsetSettled).not.toHaveBeenCalled()
      await fireEvent(canvas, "momentumScrollEnd", scrollEvent(861, 12, 80))
      expect(onVerticalOffsetSettled).toHaveBeenCalledWith(861)
    } finally {
      requestFrame.mockRestore()
    }
  })

  it("stores end-drag when native momentum does not start", async () => {
    let frame: FrameRequestCallback | undefined
    const requestFrame = jest
      .spyOn(global, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frame = callback
        return 1
      })
    try {
      await renderPlaced(shell())
      await fireEvent(
        screen.getByTestId("owned-calendar-canvas"),
        "scrollEndDrag",
        scrollEvent(240, 10),
      )
      await act(async () => frame?.(0))
      expect(onVerticalOffsetSettled).toHaveBeenCalledWith(240)
    } finally {
      requestFrame.mockRestore()
    }
  })

  it("settles one focal-preserving zoom result only after a successful pinch", async () => {
    await render(shell())

    await act(async () => firePinch(State.END))

    expect(onZoomSettled).toHaveBeenCalledTimes(1)
    expect(onZoomSettled).toHaveBeenCalledWith(
      expect.objectContaining({
        pixelsPerHour: 66,
        rawOffset: 25,
        sequence: 1,
        source: "pinch",
      }),
    )
  })

  it("restores the baseline without persistence when pinch is cancelled", async () => {
    await render(shell())

    await act(async () => firePinch(State.CANCELLED))

    expect(onZoomSettled).not.toHaveBeenCalled()
  })

  it("restores a surviving event, then its date, after the committed page's presentation is replaced", async () => {
    const survivor = timedEvent(
      "late-focus",
      "2026-06-15T23:00:00.000Z",
      "2026-06-15T23:45:00.000Z",
    )
    const scrollRef = { current: null } as ReturnType<
      typeof Reanimated.useAnimatedRef
    >
    const refSpy = jest
      .spyOn(Reanimated, "useAnimatedRef")
      .mockReturnValue(scrollRef)
    const focus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus")
    try {
      const { view } = await renderPlaced(
        shell({
          presentPage: presenter({ events: [survivor] }),
        }),
      )
      await focusEvent("late-focus")
      const scrollTo = jest.spyOn(scrollRef.current as ScrollView, "scrollTo")
      const eventReveals = () =>
        scrollTo.mock.calls.filter(
          ([options]) =>
            typeof options === "object" && options.y === 23 * 60 - 96,
        )

      await view.rerender(
        shell({
          routeFocused: false,
          presentPage: presenter({ events: [survivor] }),
        }),
      )
      await view.rerender(
        shell({
          routeFocused: true,
          presentPage: presenter({ events: [survivor] }),
        }),
      )
      await waitFor(() => expect(focus).toHaveBeenCalledTimes(1))
      expect(eventReveals()).toHaveLength(1)

      await view.rerender(
        shell({ routeFocused: false, presentPage: presenter({ events: [] }) }),
      )
      await view.rerender(
        shell({ routeFocused: true, presentPage: presenter({ events: [] }) }),
      )
      expect(screen.queryByTestId("owned-calendar-event-late-focus")).toBeNull()
      await waitFor(() => expect(focus).toHaveBeenCalledTimes(2))
      expect(eventReveals()).toHaveLength(1)
      scrollTo.mockRestore()
    } finally {
      await cleanup()
      focus.mockRestore()
      refSpy.mockRestore()
    }
  })

  it("remembers no accessibility focus while the page is moving", async () => {
    const focus = jest.spyOn(AccessibilityInfo, "setAccessibilityFocus")
    try {
      const presentPage = presenter({
        events: [
          timedEvent(
            "moving",
            "2026-06-15T10:00:00.000Z",
            "2026-06-15T11:00:00.000Z",
          ),
        ],
      })
      const { view, pager } = await renderPlaced(
        shell({
          presentPage,
        }),
      )

      await pager.send(0, "onScrollBeginDrag")
      await pager.send(0.6)
      await flushUiThread()
      await focusEvent("moving")
      await pager.send(0.2)
      await pager.send(0, "onScrollEndDrag")
      await pager.send(0)
      await flushUiThread()
      await view.rerender(shell({ routeFocused: false, presentPage }))
      await view.rerender(shell({ routeFocused: true, presentPage }))

      expect(focus).not.toHaveBeenCalled()
      expect(onDateCommitted).not.toHaveBeenCalled()
    } finally {
      focus.mockRestore()
    }
  })

  it("settles the context of a loading committed page only once it is ready", async () => {
    const onContextSettled = jest.fn()
    const ready = presenter()
    const loading: PagePresenter = (index) => ({
      ...ready(index),
      status: "loading",
      columns: ready(index).columns.map((column) => ({ ...column, tiles: [] })),
    })
    const requestFrame = jest
      .spyOn(global, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0)
        return 1
      })
    try {
      const { view } = await renderPlaced(
        shell({ presentPage: loading, onContextSettled }),
      )
      expect(
        screen.getByTestId(`owned-calendar-page-${ANCHOR_PAGE}`, HIDDEN),
      ).toHaveProp("accessibilityState", { busy: true })
      expect(onContextSettled).not.toHaveBeenCalled()

      await view.rerender(shell({ presentPage: ready, onContextSettled }))

      expect(
        screen.getByTestId(`owned-calendar-page-${ANCHOR_PAGE}`, HIDDEN),
      ).toHaveProp("accessibilityState", { busy: false })
      expect(onContextSettled).toHaveBeenCalledTimes(1)
      expect(onContextSettled).toHaveBeenCalledWith(ANCHOR_PAGE, false)
    } finally {
      requestFrame.mockRestore()
    }
  })

  it("recentres a drag that snaps back to its page without committing", async () => {
    const presentPage = presenter()
    const { view, pager } = await renderPlaced(shell({ presentPage }))

    await pager.send(0, "onScrollBeginDrag")
    await pager.send(0.25)
    await view.rerender(shell({ presentPage }))
    expect(headerTranslateX()).toBe(-(pager.origin + 0.25 * pager.pageWidth))

    await pager.send(0.25, "onScrollEndDrag")
    await pager.send(0)
    await view.rerender(shell({ presentPage }))

    expect(headerTranslateX()).toBe(-pager.origin)
    expect(onDateCommitted).not.toHaveBeenCalled()
    expect(
      screen.getByTestId(`owned-calendar-date-header-slot-${ANCHOR_PAGE}`),
    ).toHaveProp("accessibilityElementsHidden", false)
  })

  it.each([
    [-1, "2026-06-08"],
    [1, "2026-06-22"],
  ] as const)(
    "commits native page %i only once no finger or momentum moves it",
    async (direction, committedDate) => {
      const { pager } = await renderPlaced(shell())

      await pager.send(0, "onScrollBeginDrag")
      await pager.send(direction)
      expect(onDateCommitted).not.toHaveBeenCalled()
      await pager.send(direction * 0.6)
      await pager.send(direction * 0.6, "onScrollEndDrag")
      await pager.send(direction * 0.6, "onMomentumScrollBegin")
      await pager.send(direction)
      expect(onDateCommitted).not.toHaveBeenCalled()

      await pager.send(direction, "onMomentumScrollEnd")

      expect(onDateCommitted).toHaveBeenCalledTimes(1)
      expect(
        onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10),
      ).toBe(committedDate)
    },
  )

  it("ignores a second accessibility action until the first page settles", async () => {
    const scrollTo = jest.spyOn(Reanimated, "scrollTo")
    try {
      const { pager } = await renderPlaced(shell())
      scrollTo.mockClear()

      await accessiblePage("increment")
      await flushUiThread()
      await accessiblePage("increment")
      await flushUiThread()

      expect(scrollTo.mock.calls.map((call) => call.slice(1))).toEqual([
        [pager.origin + pager.pageWidth, 0, true],
      ])
      await pager.send(1)
      expect(onDateCommitted).toHaveBeenCalledTimes(1)
      expect(
        onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10),
      ).toBe("2026-06-22")
    } finally {
      scrollTo.mockRestore()
    }
  })

  it.each([-1, 1])(
    "keeps the landed header through duplicate idle events on page %i",
    async (direction) => {
      const presentPage = presenter()
      const { view, pager } = await renderPlaced(shell({ presentPage }))

      await pager.swipe(0, direction)
      await pager.send(direction, "onMomentumScrollEnd")
      await pager.send(direction, "onScrollEndDrag")
      await pager.send(direction)
      await view.rerender(shell({ presentPage }))

      expect(headerTranslateX()).toBe(
        -(pager.origin + direction * pager.pageWidth),
      )
      expect(onDateCommitted).toHaveBeenCalledTimes(1)
      expect(
        screen.getByTestId(
          `owned-calendar-date-header-slot-${pageKey(WEEK, ANCHOR_INDEX + direction)}`,
        ),
      ).toHaveProp("accessibilityElementsHidden", false)
    },
  )

  it("keeps a late event from another geometry from moving the landed header", async () => {
    const presentPage = presenter()
    const { view, pager } = await renderPlaced(shell({ presentPage }))
    await pager.swipe(0, 1)

    await act(async () => {
      screen.getByTestId("owned-calendar-pager").props.onScroll({
        nativeEvent: {
          contentOffset: { x: pager.origin, y: 0 },
          layoutMeasurement: { width: pager.pageWidth + 40, height: 1000 },
          contentSize: { width: pager.contentWidth, height: 1000 },
        },
      })
    })
    await view.rerender(shell({ presentPage }))

    expect(headerTranslateX()).toBe(-(pager.origin + pager.pageWidth))
    expect(onDateCommitted).toHaveBeenCalledTimes(1)
  })

  it("keeps a swipe going while the weekend is hidden, then commits where it lands", async () => {
    const weekdays = {
      showWeekends: false,
      presentPage: presenter({ showWeekends: false }),
    }
    const { view, pager } = await renderPlaced(shell())
    const scrollOwner = screen.getByTestId("owned-calendar-pager")

    await pager.send(0, "onScrollBeginDrag")
    await pager.send(0.6)
    await view.rerender(shell(weekdays))
    await pager.send(0.6, "onScrollEndDrag")
    await pager.send(1)

    expect(screen.getByTestId("owned-calendar-pager")).toBe(scrollOwner)
    expect(onDateCommitted).toHaveBeenCalledTimes(1)
    expect(onDateCommitted.mock.calls[0]?.[0].toISOString().slice(0, 10)).toBe(
      "2026-06-22",
    )
    expect(screen.getAllByTestId(/^owned-calendar-date-\d{4}-/)).toHaveLength(5)
  })

  it("mounts non-collapsible transparent pages over one hour-line surface", async () => {
    await renderPlaced(shell())

    const pages = screen.getAllByTestId(/^owned-calendar-page-week:/, HIDDEN)
    expect(pages).toHaveLength(5)
    for (const page of pages) {
      expect(page).toHaveProp("collapsable", false)
      expect(
        StyleSheet.flatten(page.props.style).backgroundColor,
      ).toBeUndefined()
    }
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-hour-lines", HIDDEN).props.style,
      ).backgroundColor,
    ).toBe(Colors.light.backgroundElement)
  })

  it.each([true, false])(
    "lets a pinch take the pager and re-aligns its cut drag without committing (pinch succeeded: %s)",
    async (success) => {
      const reactions = recordAnimatedReactions()
      const scrollTo = jest.spyOn(Reanimated, "scrollTo")
      const horizontalScrolls = () =>
        scrollTo.mock.calls
          .filter(([, x]) => x !== 0)
          .map((call) => call.slice(1))
      try {
        const { pager } = await renderPlaced(shell())
        await pager.send(0, "onScrollBeginDrag")
        await pager.send(0.3)
        scrollTo.mockClear()

        await holdPinch()
        await act(async () => reactions.flush())
        await accessiblePage("increment")
        await flushUiThread()
        expect(horizontalScrolls()).toEqual([])

        await act(async () => {
          const pinch = pinchHandlers()
          pinch.onEnd({}, success)
          pinch.onFinalize({}, success)
        })
        await act(async () => reactions.flush())

        expect(horizontalScrolls()).toEqual([[pager.origin, 0, true]])
        await pager.send(0)
        expect(onDateCommitted).not.toHaveBeenCalled()
      } finally {
        scrollTo.mockRestore()
        reactions.restore()
      }
    },
  )

  it("ignores a vertical settle while a pinch blocks it, until the vertical owner starts again", async () => {
    await renderPlaced(shell())
    const canvas = screen.getByTestId("owned-calendar-canvas")

    await act(async () => firePinch(State.END))
    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(901, 24, 96))
    expect(onVerticalOffsetSettled).not.toHaveBeenCalled()

    await act(async () => fireNativeOwnerStart("owned-calendar-native-scroll"))
    await fireEvent(canvas, "scrollBeginDrag", scrollEvent(902, 24, 96))
    await fireEvent(canvas, "momentumScrollEnd", scrollEvent(902, 24, 96))

    expect(onVerticalOffsetSettled).toHaveBeenCalledWith(902)
  })

  it("commits nothing when unmounted during a pinch and a pending accessibility step", async () => {
    const { view } = await renderPlaced(shell())
    await accessiblePage("increment")
    await holdPinch()

    await act(async () => view.unmount())
    await flushUiThread()

    expect(onDateCommitted).not.toHaveBeenCalled()
    expect(onZoomSettled).not.toHaveBeenCalled()
  })
})
