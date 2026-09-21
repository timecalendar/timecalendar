import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import * as Localization from "expo-localization"
import { router, useLocalSearchParams } from "expo-router"
import {
  AccessibilityInfo,
  AppState,
  Platform,
  type ScrollView,
  StyleSheet,
} from "react-native"
import * as Reanimated from "react-native-reanimated"

import {
  buildCalendarTimelinePresentation,
  formatFullDay,
  formatMonthYear,
  planCalendarThreePageRange,
  startOfWeekInZone,
  type TimedCalendarEventV1,
  useCalendarClock,
  useCalendarEvents,
  useCalendarTimelinePresentation,
  useSyncCalendars,
} from "@/features/calendar/data"
import { useCalendarEventsSnapshot } from "@/features/calendar/data/events"
import { useChecklistProgress } from "@/features/event-checklists"
import {
  getCalendarZoomPixelsPerHour,
  setCalendarView,
  setCalendarZoomPixelsPerHour,
  setShowWeekends,
  setTimezonePreference,
  SETTINGS_KEYS,
} from "@/features/settings/prefs"
import { remove } from "@/storage"
import { resolveResponsiveLayout } from "@/theme"

import { CalendarScreen } from "./calendar-screen"

jest.mock("@/features/calendar/data", () => {
  const actual = jest.requireActual<typeof import("@/features/calendar/data")>(
    "@/features/calendar/data",
  )
  return {
    ...actual,
    useCalendarClock: jest.fn(),
    useCalendarEvents: jest.fn(),
    useCalendarTimelinePresentation: jest.fn(
      (
        input: Parameters<typeof actual.useCalendarTimelinePresentation>[0],
      ) => ({
        presentation: actual.buildCalendarTimelinePresentation({
          range: actual.planCalendarThreePageRange(input),
          generation: input.generation,
          events: [],
          checklistProgress: new Map(),
        }),
        ready: true,
        error: undefined,
      }),
    ),
    useSyncCalendars: jest.fn(),
  }
})

jest.mock("@/features/event-checklists", () => {
  const actual = jest.requireActual("@/features/event-checklists")
  return { ...actual, useChecklistProgress: jest.fn() }
})

jest.mock("@/features/calendar/data/events", () => ({
  ...jest.requireActual("@/features/calendar/data/events"),
  useCalendarEventsSnapshot: jest.fn(),
}))

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native")
  return {
    router: { push: jest.fn(), setParams: jest.fn() },
    useLocalSearchParams: jest.fn(() => ({})),
    Stack: {
      Screen: ({
        options,
      }: {
        options?: {
          headerTitle?: string | (() => unknown)
          headerLeft?: () => unknown
          headerRight?: () => unknown
        }
      }) => {
        if (!options) return null
        const title =
          typeof options.headerTitle === "function"
            ? options.headerTitle()
            : options.headerTitle
        return React.createElement(
          React.Fragment,
          null,
          title == null
            ? null
            : React.createElement(
                Text,
                { testID: "calendar-header-title" },
                title,
              ),
          options.headerLeft?.(),
          options.headerRight?.(),
        )
      },
    },
  }
})

jest.mock(
  "react-native-safe-area-context",
  () =>
    jest.requireActual<{ default: unknown }>(
      "react-native-safe-area-context/jest/mock",
    ).default,
)

const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const mockUseCalendarEvents = useCalendarEvents as jest.Mock
const mockUseCalendarTimelinePresentation =
  useCalendarTimelinePresentation as jest.Mock
const mockUseCalendarClock = useCalendarClock as jest.Mock
const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockUseChecklistProgress = useChecklistProgress as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockPush = router.push as jest.Mock
const mockSetParams = router.setParams as jest.Mock
const mockSync = jest.fn()
const mockAnnounce = jest.spyOn(AccessibilityInfo, "announceForAccessibility")
const mockUseCalendars = jest.spyOn(Localization, "useCalendars")
const pagerMock = jest.requireMock<{
  __pagerMock: { deferNextTransition: () => void }
}>("react-native-pager-view").__pagerMock

function deviceCalendars(uses24hourClock: boolean | null) {
  return [
    {
      calendar: "gregory",
      uses24hourClock,
      firstWeekday: 1,
      timeZone: ZONE,
    },
  ] as unknown as ReturnType<typeof Localization.useCalendars>
}

function syncState(overrides = {}) {
  return {
    sync: mockSync,
    isSyncing: false,
    isError: false,
    reset: jest.fn(),
    ...overrides,
  }
}

function calendarEvent(
  overrides: Partial<TimedCalendarEventV1> = {},
): TimedCalendarEventV1 {
  const id = overrides.id ?? "synced-1"
  const userCalendarId =
    overrides.userCalendarId === undefined && overrides.id === "personal-1"
      ? undefined
      : (overrides.userCalendarId ?? "calendar-1")
  return {
    version: 1,
    kind: "timed",
    identity: {
      source: userCalendarId === undefined ? "personal" : "synced",
      uid: id,
    },
    id,
    title: "Algorithms",
    color: "#1E88E5",
    startsAt: new Date(2026, 5, 16, 9),
    endsAt: new Date(2026, 5, 16, 10, 30),
    location: "Room A1",
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId,
    ...overrides,
  }
}

async function openCalendarMenu() {
  await fireEvent.press(screen.getByTestId("calendar-view"))
  await waitFor(() => {
    expect(screen.getByTestId("menu-action-week")).toBeOnTheScreen()
  })
}

async function chooseCalendarView(view: "day" | "week" | "agenda") {
  await openCalendarMenu()
  await fireEvent.press(screen.getByTestId(`menu-action-${view}`))
}

beforeEach(() => {
  AppState.currentState = "active"
  mockUseCalendarEvents.mockReturnValue([calendarEvent()])
  mockUseCalendarTimelinePresentation.mockImplementation((input) => ({
    presentation: buildCalendarTimelinePresentation({
      range: planCalendarThreePageRange(input),
      generation: input.generation,
      events: [],
      checklistProgress: new Map(),
    }),
    ready: true,
    error: undefined,
  }))
  mockUseCalendarClock.mockReturnValue(new Date())
  mockUseSyncCalendars.mockReturnValue(syncState())
  mockUseChecklistProgress.mockReturnValue(new Map())
  mockUseLocalSearchParams.mockReturnValue({})
  mockSync.mockReset()
  mockPush.mockReset()
  mockSetParams.mockReset()
  mockAnnounce.mockClear()
  mockUseCalendars.mockReturnValue(deviceCalendars(true))
  remove(SETTINGS_KEYS.showWeekends)
  remove(SETTINGS_KEYS.calendarView)
  remove(SETTINGS_KEYS.calendarZoomPixelsPerHour)
})

describe("CalendarScreen owned shell", () => {
  it.each([
    { position: 0, destination: "2026-06-08" },
    { position: 2, destination: "2026-06-22" },
  ])(
    "keeps $destination visible while the swipe's local read is pending",
    async ({ position, destination }) => {
      setCalendarView("week")
      mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-06-15" })
      const adjacent = calendarEvent({
        title: "Destination class",
        startsAt: new Date(`${destination}T10:00:00Z`),
        endsAt: new Date(`${destination}T11:00:00Z`),
      })
      const loaded = {
        events: [adjacent],
        ready: true,
        error: undefined,
        revision: "loaded",
        counts: {},
      }
      const mockSnapshot = useCalendarEventsSnapshot as jest.Mock
      mockSnapshot.mockReturnValue(loaded)
      mockUseCalendarTimelinePresentation.mockImplementation(
        jest.requireActual<typeof import("@/features/calendar/data")>(
          "@/features/calendar/data",
        ).useCalendarTimelinePresentation,
      )
      const view = await render(<CalendarScreen />)
      const pager = screen.getByTestId("owned-calendar-pager")
      mockSnapshot.mockReturnValue({
        ...loaded,
        events: [],
        ready: false,
        revision: "pending",
      })

      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "dragging" },
      })
      await fireEvent(pager, "pageSelected", { nativeEvent: { position } })
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })

      const centeredDate = screen.getByTestId(
        `owned-calendar-date-0-${destination}`,
      )
      expect(centeredDate).toBeOnTheScreen()
      expect(
        screen.getByRole("button", { name: /^Destination class,/ }),
      ).toBeOnTheScreen()
      const centeredPager = screen.getByTestId("owned-calendar-pager")

      mockSnapshot.mockReturnValue({ ...loaded, revision: "replacement" })
      await view.rerender(<CalendarScreen />)
      expect(screen.getByTestId("owned-calendar-pager")).toBe(centeredPager)
      expect(screen.getByTestId(`owned-calendar-date-0-${destination}`)).toBe(
        centeredDate,
      )
      expect(
        screen.getByRole("button", { name: /^Destination class,/ }),
      ).toBeOnTheScreen()
      expect(mockAnnounce).toHaveBeenCalledTimes(1)
      expect(mockSync).not.toHaveBeenCalled()
    },
  )

  it("rolls Today and the indicator together without changing mounted screen state", async () => {
    setShowWeekends(false)
    mockUseCalendarClock.mockReturnValue(new Date("2026-06-19T23:59:00"))
    const view = await render(<CalendarScreen />)
    const agendaRange = mockUseCalendarEvents.mock.calls.at(-1)?.[0]
    const initialHeader = screen.getByTestId("calendar-header-title").props
      .children

    expect(screen.getByLabelText("FRI 19, Today")).toBeOnTheScreen()
    expect(
      screen.getByTestId("owned-calendar-now-0-2026-06-19", {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen()

    mockAnnounce.mockClear()
    mockUseCalendarEvents.mockClear()
    mockUseCalendarClock.mockReturnValue(new Date("2026-06-20T00:00:00"))
    await view.rerender(<CalendarScreen />)

    expect(screen.queryByLabelText(/Today/)).toBeNull()
    expect(
      screen.queryByTestId(/^owned-calendar-now--?\d-/, {
        includeHiddenElements: true,
      }),
    ).toBeNull()
    expect(screen.queryByLabelText(/Current time/)).toBeNull()
    expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
      initialHeader,
    )
    expect(mockUseCalendarEvents).toHaveBeenLastCalledWith(agendaRange)
    expect(mockAnnounce).not.toHaveBeenCalled()
  })

  it("opens synced and personal timed tiles by their original UID", async () => {
    setCalendarView("day")
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-06-16" })
    const maths = calendarEvent({
      identity: { source: "synced", uid: "class-original" },
      id: "class-compatibility",
      title: "Maths",
      startsAt: new Date("2026-06-16T10:00:00.000Z"),
      endsAt: new Date("2026-06-16T11:00:00.000Z"),
      location: "B12",
    })
    const personal = calendarEvent({
      identity: { source: "personal", uid: "personal-original" },
      id: "personal-compatibility",
      title: "Study",
      startsAt: new Date("2026-06-16T12:00:00.000Z"),
      endsAt: new Date("2026-06-16T13:00:00.000Z"),
      location: undefined,
      userCalendarId: undefined,
    })
    mockUseCalendarTimelinePresentation.mockImplementation((input) => ({
      presentation: buildCalendarTimelinePresentation({
        range: planCalendarThreePageRange(input),
        generation: input.generation,
        events: [maths, personal],
        checklistProgress: new Map(),
      }),
      ready: true,
      error: undefined,
    }))

    await render(<CalendarScreen />)
    await fireEvent.press(
      await screen.findByRole("button", { name: /^Maths,/ }),
    )
    expect(mockPush).toHaveBeenLastCalledWith("/event-details/class-original")
    await fireEvent.press(screen.getByRole("button", { name: /^Study,/ }))
    expect(mockPush).toHaveBeenLastCalledWith(
      "/event-details/personal-original",
    )
  })

  it("pages away and back using only local presentation reads", async () => {
    setCalendarView("day")
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-06-16" })
    const maths = calendarEvent({
      identity: { source: "synced", uid: "maths-offline" },
      id: "maths-offline",
      title: "Maths",
      startsAt: new Date("2026-06-16T10:00:00.000Z"),
      endsAt: new Date("2026-06-16T11:00:00.000Z"),
      location: "B12",
    })
    mockUseCalendarTimelinePresentation.mockImplementation((input) => ({
      presentation: buildCalendarTimelinePresentation({
        range: planCalendarThreePageRange(input),
        generation: input.generation,
        events: [maths],
      }),
      ready: true,
      error: undefined,
    }))
    await render(<CalendarScreen />)
    expect(
      await screen.findByRole("button", { name: /^Maths,/ }),
    ).toBeOnTheScreen()

    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /^Maths,/ })).toBeNull(),
    )
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "decrement" } },
    )
    expect(
      await screen.findByRole("button", { name: /^Maths,/ }),
    ).toBeOnTheScreen()
    expect(mockSync).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("restores persisted Day with a fresh today anchor and one column", async () => {
    setCalendarView("day")
    await render(<CalendarScreen />)

    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(new Date(), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(1)
    await openCalendarMenu()
    expect(
      screen.getByTestId("menu-action-day").props.accessibilityState.selected,
    ).toBe(true)
  })

  it("keeps persisted Day after remount but derives a fresh date", async () => {
    setCalendarView("day")
    const first = await render(<CalendarScreen />)
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    expect(mockAnnounce).toHaveBeenCalledTimes(1)
    await first.unmount()
    mockAnnounce.mockClear()

    await render(<CalendarScreen />)
    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(new Date(), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    await openCalendarMenu()
    expect(
      screen.getByTestId("menu-action-day").props.accessibilityState.selected,
    ).toBe(true)
    expect(mockAnnounce).not.toHaveBeenCalled()
  })

  it("switches Week to Monday Day and preserves the settled clock offset", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-16" })
    await render(<CalendarScreen />)
    await waitFor(() =>
      expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(7),
    )
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "momentumScrollEnd",
      {
        nativeEvent: {
          contentOffset: { x: 0, y: 540 },
          contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
          contentSize: { width: 320, height: 1441 },
          layoutMeasurement: { width: 320, height: 500 },
        },
      },
    )

    await chooseCalendarView("day")
    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(1)
    expect(
      screen.getByTestId("owned-calendar-date-0-2026-09-14"),
    ).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "contentOffset",
      { x: 0, y: 540 },
    )
    expect(mockAnnounce).not.toHaveBeenCalled()
  })

  it("pages Day across a weekend then switches to its containing Week", async () => {
    setCalendarView("day")
    setShowWeekends(false)
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-18" })
    await render(<CalendarScreen />)
    await waitFor(() =>
      expect(
        screen.getByTestId("owned-calendar-date-0-2026-09-18"),
      ).toBeOnTheScreen(),
    )

    for (const label of ["SAT 19", "SUN 20"]) {
      await fireEvent(
        screen.getByTestId("owned-calendar-canvas"),
        "accessibilityAction",
        { nativeEvent: { actionName: "increment" } },
      )
      expect(
        screen.getByLabelText(new RegExp(`^${label}(?:, Today)?$`)),
      ).toBeOnTheScreen()
    }

    await chooseCalendarView("week")
    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(5)
    expect(
      screen.getByTestId("owned-calendar-date-0-2026-09-14"),
    ).toBeOnTheScreen()
    expect(mockAnnounce).toHaveBeenCalledTimes(2)
  })

  it("rejects callbacks from a partial Week drag after switching to Day", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-16" })
    await render(<CalendarScreen />)
    await waitFor(() =>
      expect(
        screen.getByTestId("owned-calendar-date-0-2026-09-14"),
      ).toBeOnTheScreen(),
    )
    const stalePager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    const staleSelected = stalePager.props.onPageSelected
    const staleState = stalePager.props.onPageScrollStateChanged
    await fireEvent(stalePager, "pageScroll", {
      nativeEvent: { position: 1, offset: 0.45 },
    })

    await chooseCalendarView("day")
    await act(async () => {
      staleSelected({ nativeEvent: { position: 2 } })
      staleState({ nativeEvent: { pageScrollState: "idle" } })
    })

    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(1)
    expect(
      screen.getByTestId("owned-calendar-date-0-2026-09-14"),
    ).toBeOnTheScreen()
    expect(mockAnnounce).not.toHaveBeenCalled()
  })
  it.each([
    [false, "1 AM"],
    [true, "01:00"],
    [null, "01:00"],
  ] as const)(
    "passes the device clock preference %s to the gutter",
    async (preference, firstVisibleHour) => {
      mockUseCalendars.mockReturnValue(deviceCalendars(preference))
      await render(<CalendarScreen />)
      expect(screen.queryByTestId("owned-calendar-hour-label-0")).toBeNull()
      expect(
        screen.getByTestId("owned-calendar-hour-label-1", {
          includeHiddenElements: true,
        }),
      ).toHaveTextContent(firstVisibleHour)
    },
  )

  it("restores a settled vertical offset after switching through Agenda", async () => {
    await render(<CalendarScreen />)
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "momentumScrollEnd",
      {
        nativeEvent: {
          contentOffset: { x: 0, y: 400 },
          contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
          contentSize: { width: 320, height: 1441 },
          layoutMeasurement: { width: 320, height: 500 },
        },
      },
    )
    await chooseCalendarView("agenda")
    await chooseCalendarView("week")
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "contentOffset",
      { x: 0, y: 400 },
    )
    expect(mockAnnounce).not.toHaveBeenCalled()
  })

  it("reactively changes only week presentation while retaining seven-day context and offset", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-14" })
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({
        id: "weekend-1",
        startsAt: new Date(2026, 8, 19, 9),
        endsAt: new Date(2026, 8, 19, 10),
      }),
    ])
    await render(<CalendarScreen />)
    await waitFor(() => {
      expect(
        screen.getAllByTestId(/^owned-calendar-date-0-\d{4}-\d{2}-\d{2}$/),
      ).toHaveLength(7)
    })
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "momentumScrollEnd",
      {
        nativeEvent: {
          contentOffset: { x: 0, y: 360 },
          contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
          contentSize: { width: 320, height: 1441 },
          layoutMeasurement: { width: 320, height: 500 },
        },
      },
    )

    await act(async () => setShowWeekends(false))
    expect(
      screen.getAllByTestId(/^owned-calendar-date-0-\d{4}-\d{2}-\d{2}$/),
    ).toHaveLength(5)
    expect(screen.getByTestId("owned-calendar-canvas")).toHaveProp(
      "contentOffset",
      { x: 0, y: 360 },
    )
    const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0]
    expect(range.from).toEqual(new Date(2026, 8, 14))
    expect(range.to).toEqual(new Date(2026, 8, 21))
    expect(mockAnnounce).not.toHaveBeenCalled()

    await chooseCalendarView("agenda")
    expect(screen.getByText("Algorithms")).toBeOnTheScreen()
  })

  it("mounts and remounts the localized heading and full-bleed canvas", async () => {
    const first = await render(<CalendarScreen />)
    const heading = formatFullDay(
      startOfWeekInZone(new Date(), ZONE, 1),
      "en",
      ZONE,
    )
    expect(screen.getByRole("adjustable", { name: heading })).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
    expect(
      StyleSheet.flatten(
        screen.getByTestId("calendar-full-bleed-owner").props.style,
      ).maxWidth,
    ).toBeUndefined()

    await first.unmount()
    await render(<CalendarScreen />)
    expect(screen.getByRole("adjustable", { name: heading })).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
  })

  it("does not describe an intentionally blank shell as empty event data", async () => {
    mockUseCalendarEvents.mockReturnValue([])
    await render(<CalendarScreen />)

    expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
    expect(screen.queryByTestId("calendar-empty")).toBeNull()
  })

  it("consumes a valid one-shot focus date and updates heading and range", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-08-06" })
    await render(<CalendarScreen />)

    await waitFor(() => {
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(new Date(2026, 7, 3), "en", ZONE),
        }),
      ).toBeOnTheScreen()
      expect(mockSetParams).toHaveBeenCalledWith({ focusDate: undefined })
    })
    const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0]
    expect(range.to.getTime() - range.from.getTime()).toBeGreaterThanOrEqual(
      6 * 24 * 60 * 60 * 1000,
    )
  })

  it("ignores an invalid focus date after consuming it", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-02-31" })
    await render(<CalendarScreen />)

    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(startOfWeekInZone(new Date(), ZONE, 1), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    expect(mockSetParams).toHaveBeenCalledWith({ focusDate: undefined })
  })

  it("returns to Today without scrolling the mounted timeline to midnight", async () => {
    const scrollRef = { current: null } as ReturnType<
      typeof Reanimated.useAnimatedRef
    >
    const refSpy = jest
      .spyOn(Reanimated, "useAnimatedRef")
      .mockReturnValue(scrollRef)
    mockUseCalendarClock.mockReturnValue(new Date("2026-06-17T12:00:00"))
    try {
      await render(<CalendarScreen />)
      const canvas = screen.getByTestId("owned-calendar-canvas")
      await fireEvent(canvas, "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 500 } },
      })
      const scrollTo = jest.spyOn(scrollRef.current as ScrollView, "scrollTo")
      try {
        await fireEvent(canvas, "accessibilityAction", {
          nativeEvent: { actionName: "increment" },
        })
        expect(
          screen.getByTestId("owned-calendar-date-0-2026-06-22"),
        ).toBeOnTheScreen()
        scrollTo.mockClear()

        expect(canvas).toHaveProp("scrollsToTop", false)
        await fireEvent.press(screen.getByTestId("calendar-today"))

        expect(
          screen.getByTestId("owned-calendar-date-0-2026-06-17"),
        ).toBeOnTheScreen()
        expect(screen.queryByTestId("calendar-today")).toBeNull()
        expect(screen.getByTestId("owned-calendar-canvas")).toBe(canvas)
        expect(canvas).toHaveProp("scrollsToTop", false)
        expect(scrollTo).not.toHaveBeenCalled()
      } finally {
        scrollTo.mockRestore()
      }
    } finally {
      await cleanup()
      refSpy.mockRestore()
    }
  })

  it("retains Today as an observable selected-date action", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-08-06" })
    await render(<CalendarScreen />)
    await waitFor(() => {
      expect(
        screen.getByText(formatMonthYear(new Date(2026, 7, 3), "en", ZONE)),
      ).toBeOnTheScreen()
    })
    expect(screen.getByTestId("calendar-today")).toBeOnTheScreen()

    await fireEvent.press(screen.getByTestId("calendar-today"))
    await waitFor(() => {
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(
            startOfWeekInZone(new Date(), ZONE, 1),
            "en",
            ZONE,
          ),
        }),
      ).toBeOnTheScreen()
    })
    expect(screen.queryByTestId("calendar-today")).toBeNull()
  })

  it("commits one next week to the heading, native title, Agenda range, and announcement", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-08-31" })
    await render(<CalendarScreen />)
    await waitFor(() => {
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(new Date(2026, 7, 31), "en", ZONE),
        }),
      ).toBeOnTheScreen()
    })

    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )

    const destination = new Date(2026, 8, 7)
    await waitFor(() => {
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(destination, "en", ZONE),
        }),
      ).toBeOnTheScreen()
      expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
        formatMonthYear(destination, "en", ZONE),
      )
    })
    const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0]
    expect(range.from).toEqual(destination)
    expect(mockAnnounce).toHaveBeenCalledTimes(1)
    expect(mockAnnounce).toHaveBeenCalledWith(
      formatFullDay(destination, "en", ZONE),
    )
    expect(
      screen.getAllByTestId(/^owned-calendar-page--?\d$/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(3)
  })

  it("commits a deferred settle after the request rerenders the controller", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-07" })
    await render(<CalendarScreen />)
    pagerMock.deferNextTransition()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(new Date(2026, 8, 7), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(new Date(2026, 8, 14), "en", ZONE),
      }),
    ).toBeOnTheScreen()
  })

  it("pages past the initial three slots in both directions with deferred native settlements", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-07" })
    await render(<CalendarScreen />)
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    let day = 7
    for (const direction of [1, 1, 1, 1, -1, -1, -1, -1, -1]) {
      const pager = screen.getByTestId("owned-calendar-pager", {
        includeHiddenElements: true,
      })
      await fireEvent(pager, "pageSelected", {
        nativeEvent: { position: 1 + direction },
      })
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(new Date(2026, 8, day), "en", ZONE),
        }),
      ).toBeOnTheScreen()
      await fireEvent(pager, "pageScrollStateChanged", {
        nativeEvent: { pageScrollState: "idle" },
      })
      day += direction * 7
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(new Date(2026, 8, day), "en", ZONE),
        }),
      ).toBeOnTheScreen()
      expect(mockUseCalendarEvents.mock.calls.at(-1)?.[0].from).toEqual(
        new Date(2026, 8, day),
      )
      expect(
        screen.getAllByTestId(/^owned-calendar-page--?\d$/, {
          includeHiddenElements: true,
        }),
      ).toHaveLength(3)
    }
    expect(mockAnnounce).toHaveBeenCalledTimes(9)
  })

  it("discards a settle interrupted by iOS inactivity and resumes from the committed week", async () => {
    const listener = jest.mocked(AppState.addEventListener)
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-09-07" })
    await render(<CalendarScreen />)
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })
    const onState = listener.mock.calls.findLast(
      ([type]) => type === "change",
    )?.[1]
    expect(onState).toBeDefined()
    await act(async () => {
      onState?.("inactive")
      onState?.("background")
    })
    await act(async () => onState?.("active"))
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })
    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(new Date(2026, 8, 7), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    expect(mockAnnounce).not.toHaveBeenCalled()
    await fireEvent(
      screen.getByTestId("owned-calendar-canvas"),
      "accessibilityAction",
      { nativeEvent: { actionName: "increment" } },
    )
    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(new Date(2026, 8, 14), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    listener.mockClear()
  })

  it("discards a completion superseded by Today", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-08-31" })
    await render(<CalendarScreen />)
    await waitFor(() => {
      expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
    })
    const pager = screen.getByTestId("owned-calendar-pager", {
      includeHiddenElements: true,
    })
    await fireEvent(pager, "pageSelected", { nativeEvent: { position: 2 } })

    await fireEvent.press(screen.getByTestId("calendar-today"))
    await fireEvent(pager, "pageScrollStateChanged", {
      nativeEvent: { pageScrollState: "idle" },
    })

    const todayWeek = startOfWeekInZone(new Date(), ZONE, 1)
    expect(
      screen.getByRole("adjustable", {
        name: formatFullDay(todayWeek, "en", ZONE),
      }),
    ).toBeOnTheScreen()
    expect(mockAnnounce).not.toHaveBeenCalled()
  })
})

describe("CalendarScreen retained Agenda", () => {
  async function openAgenda() {
    await chooseCalendarView("agenda")
    await openCalendarMenu()
    await waitFor(() => {
      expect(
        screen.getByTestId("menu-action-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })
  }

  it("offers distinct Day, Week, and Agenda choices", async () => {
    await render(<CalendarScreen />)

    await openCalendarMenu()
    expect(screen.getByTestId("menu-action-week")).toBeOnTheScreen()
    expect(screen.getByTestId("menu-action-agenda")).toBeOnTheScreen()
    expect(screen.getByTestId("menu-action-day")).toBeOnTheScreen()
    await openAgenda()
    expect(screen.queryByTestId("owned-calendar-canvas")).toBeNull()
    expect(screen.getByTestId("agenda-section-list")).toBeOnTheScreen()
  })

  it("retains the measured lane, checklist progress, and refresh", async () => {
    mockUseChecklistProgress.mockReturnValue(
      new Map([["synced-1", { completed: 1, total: 2, isComplete: false }]]),
    )
    await render(<CalendarScreen />)
    await openAgenda()

    const owner = screen.getByTestId("calendar-agenda-responsive-owner")
    await fireEvent(owner, "layout", {
      nativeEvent: { layout: { width: 834, height: 0 } },
    })
    const metrics = resolveResponsiveLayout(834, "standard")
    expect(
      StyleSheet.flatten(
        screen.getByTestId("calendar-agenda-responsive-lane").props.style,
      ),
    ).toMatchObject({
      maxWidth: (metrics.maxContentWidth ?? 0) + 2 * metrics.gutter,
      paddingHorizontal: metrics.gutter,
    })
    expect(
      screen.getByText("1/2", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    screen
      .getByTestId("agenda-section-list")
      .props.refreshControl.props.onRefresh()
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["synced-1", "calendar-1"],
    ["personal-1", undefined],
  ])(
    "opens %s through the unified details route",
    async (id, userCalendarId) => {
      mockUseCalendarEvents.mockReturnValue([
        calendarEvent({ id, userCalendarId }),
      ])
      await render(<CalendarScreen />)
      await openAgenda()

      await fireEvent.press(
        screen.getByLabelText(
          "Algorithms, 09:00 – 10:30 Room A1. View details",
        ),
      )
      expect(mockPush).toHaveBeenCalledWith(`/event-details/${id}`)
    },
  )

  it("keeps Agenda usable after a details-style unmount and return", async () => {
    const first = await render(<CalendarScreen />)
    await openAgenda()
    await first.unmount()

    await render(<CalendarScreen />)
    await openAgenda()
    expect(screen.getByText("Algorithms")).toBeOnTheScreen()
  })

  it("retains empty refresh and error retry only in Agenda", async () => {
    mockUseCalendarEvents.mockReturnValue([])
    mockUseSyncCalendars.mockReturnValue(syncState({ isError: true }))
    await render(<CalendarScreen />)
    expect(screen.queryByTestId("calendar-sync-error")).toBeNull()
    await openAgenda()

    const retry = screen.getByTestId("calendar-sync-retry")
    await fireEvent.press(retry)
    expect(mockSync).toHaveBeenCalledTimes(1)
  })
})

describe("CalendarScreen platform chrome", () => {
  it("offers inset-aware zoom commands and announces one settled percentage", async () => {
    await render(<CalendarScreen />)
    let canvas = screen.getByTestId("owned-calendar-canvas")
    await fireEvent(canvas, "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 500 } },
    })
    canvas = screen.getByTestId("owned-calendar-canvas")
    await fireEvent.scroll(canvas, {
      nativeEvent: {
        contentOffset: { x: 0, y: 480 },
        contentInset: { top: 20, bottom: 80, left: 0, right: 0 },
        contentSize: { width: 320, height: 1441 },
        layoutMeasurement: { width: 320, height: 500 },
      },
    })

    await openCalendarMenu()
    expect(
      screen.getByTestId("menu-action-zoom-reset").props.accessibilityState,
    ).toMatchObject({ disabled: true })
    await fireEvent.press(screen.getByTestId("menu-action-zoom-in"))

    expect(getCalendarZoomPixelsPerHour()).toBe(70)
    expect(mockAnnounce).toHaveBeenCalledTimes(1)
    expect(mockAnnounce).toHaveBeenCalledWith("Calendar zoom 117%")
    expect(
      screen.getByTestId("owned-calendar-canvas").props.contentOffset.y,
    ).toBeCloseTo(631.67, 2)

    await chooseCalendarView("day")
    expect(screen.getAllByTestId(/^owned-calendar-date-0-/)).toHaveLength(1)
    expect(
      StyleSheet.flatten(
        screen.getByTestId("owned-calendar-major-0-1440", {
          includeHiddenElements: true,
        }).props.style,
      ).top,
    ).toBe(1680)

    await openCalendarMenu()
    expect(
      screen.getByTestId("menu-action-zoom-reset").props.accessibilityState,
    ).toMatchObject({ disabled: false })
    await fireEvent.press(screen.getByTestId("menu-action-zoom-reset"))
    expect(getCalendarZoomPixelsPerHour()).toBe(60)
    expect(mockAnnounce).toHaveBeenNthCalledWith(2, "Calendar zoom 100%")
    expect(
      screen.getByTestId("owned-calendar-canvas").props.contentOffset.y,
    ).toBeCloseTo(510, 2)
  })

  it("disables and communicates the inclusive zoom limits", async () => {
    setCalendarZoomPixelsPerHour(120)
    await render(<CalendarScreen />)
    await openCalendarMenu()

    expect(
      screen.getByRole("button", {
        name: "Zoom in (maximum reached)",
      }).props.accessibilityState,
    ).toMatchObject({ disabled: true })
    expect(
      screen.getByTestId("menu-action-zoom-out").props.accessibilityState,
    ).toMatchObject({ disabled: false })
  })

  it("keeps Add in the iOS header", async () => {
    await render(<CalendarScreen />)
    expect(screen.queryByTestId("calendar-today")).toBeNull()
    await fireEvent.press(screen.getByTestId("calendar-add"))
    expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
  })

  it("keeps Android targets and offers Day, Week, and Agenda in order", async () => {
    const original = Platform.OS
    Platform.OS = "android"
    try {
      await render(<CalendarScreen />)
      const trigger = screen.getByTestId("calendar-view")
      expect(StyleSheet.flatten(trigger.props.style).minHeight).toBe(48)
      await fireEvent.press(trigger)
      await waitFor(() => {
        expect(screen.getByTestId("menu-action-day")).toBeOnTheScreen()
        expect(screen.getByTestId("menu-action-week")).toBeOnTheScreen()
      })
      expect(screen.getByTestId("menu-action-agenda")).toBeOnTheScreen()
      const fab = screen.getByTestId("calendar-fab")
      await fireEvent.press(fab)
      expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
    } finally {
      Platform.OS = original
    }
  })
})

describe("CalendarScreen display-zone heading", () => {
  afterEach(async () => {
    try {
      await cleanup()
    } finally {
      remove(SETTINGS_KEYS.timezone)
    }
  })

  it("formats the selected date in the effective display zone", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-06-16" })
    setTimezonePreference("Asia/Kathmandu")
    await render(<CalendarScreen />)

    await waitFor(() => {
      expect(
        screen.getByRole("adjustable", {
          name: formatFullDay(
            new Date("2026-06-14T18:15:00.000Z"),
            "en",
            "Asia/Kathmandu",
          ),
        }),
      ).toBeOnTheScreen()
    })
  })
})
