import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Platform } from "react-native"

import {
  dayKey,
  formatMonthYear,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import { calendarTimelineEventWindow } from "@/features/calendar/renderer"
import { useChecklistProgress } from "@/features/event-checklists"
import { setTimezonePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import { remove } from "@/storage"

import { CalendarScreen } from "./calendar-screen"

// Presentational screen (70% floor): renders through the real theme + i18n
// trees. The calendar-kit grid is mocked suite-wide (jest/calendar-kit/setup) so
// its mocked CalendarBody invokes renderEvent per event — proving the screen's
// event→tile wiring + the CalendarEvent→EventItem mapping + theme/label plumbing
// without the Reanimated grid (D7). The @expo/ui view-menu Picker is mocked
// suite-wide (jest/setup-expo-ui) — it renders each option as a pressable
// (`calendar-view-item-<value>`) so the menu's select wiring is provable without
// the native menu. The events-source seam + the sync orchestrator are mocked here
// to drive deterministic state without a SQLite/network dependency.

jest.mock("@/features/calendar/data", () => {
  const actual = jest.requireActual("@/features/calendar/data")
  return {
    ...actual,
    useCalendarEvents: jest.fn(),
    useSyncCalendars: jest.fn(),
  }
})

jest.mock("@/features/event-checklists", () => {
  const actual = jest.requireActual("@/features/event-checklists")
  return { ...actual, useChecklistProgress: jest.fn() }
})

// The month title + the view-menu / Today / Add actions live in the native nav
// bar (a nested Stack under the Calendar tab). Render the header slots so they are
// in the test tree — the default stub drops the header entirely (mirrors the
// event-details screen test).
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
          title != null
            ? React.createElement(
                Text,
                { testID: "calendar-header-title" },
                title,
              )
            : null,
          options.headerLeft ? options.headerLeft() : null,
          options.headerRight ? options.headerRight() : null,
        )
      },
    },
  }
})

// The screen reads the bottom inset (bar-inclusive under native tabs) for the
// grid-only under-the-bar scroll clearance; the library's official Jest mock
// supplies zero-inset metrics without a provider tree.
jest.mock(
  "react-native-safe-area-context",
  () =>
    jest.requireActual<{ default: unknown }>(
      "react-native-safe-area-context/jest/mock",
    ).default,
)

// The screen resolves its display zone through useDisplayZone; under the
// default "system" preference that is the machine zone (setup-localization), so
// zone-parameterized expectations mirror the screen exactly.
const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const mockUseCalendarEvents = useCalendarEvents as jest.Mock
const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockUseChecklistProgress = useChecklistProgress as jest.Mock
const mockSync = jest.fn()
const mockPush = router.push as jest.Mock
const mockSetParams = router.setParams as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock

function syncState(overrides = {}) {
  return {
    sync: mockSync,
    isSyncing: false,
    isError: false,
    reset: jest.fn(),
    ...overrides,
  }
}

function calendarEvent(overrides = {}) {
  // Local-time dates so the formatted "09:00 – 10:30" label is TZ-independent.
  const startsAt = new Date(2026, 5, 16, 9, 0, 0, 0)
  const endsAt = new Date(2026, 5, 16, 10, 30, 0, 0)
  return {
    id: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    startsAt,
    endsAt,
    location: "Room A1",
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  mockUseCalendarEvents.mockReturnValue([calendarEvent()])
  mockSync.mockReset()
  mockPush.mockReset()
  mockSetParams.mockReset()
  mockUseLocalSearchParams.mockReturnValue({})
  mockUseSyncCalendars.mockReturnValue(syncState())
  mockUseChecklistProgress.mockReturnValue(new Map())
})

describe("CalendarScreen", () => {
  it("consumes a one-shot Home focus date without changing the selected view", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-08-06" })
    await render(<CalendarScreen />)
    await waitFor(() => {
      const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0] as {
        from: Date
        to: Date
      }
      const target = new Date(2026, 7, 6).getTime()
      expect(range.from.getTime()).toBeLessThanOrEqual(target)
      expect(range.to.getTime()).toBeGreaterThan(target)
      expect(mockSetParams).toHaveBeenCalledWith({ focusDate: undefined })
    })
    expect(screen.getByTestId("grid-go-to-date").props.accessibilityLabel).toBe(
      JSON.stringify({
        date: new Date(2026, 7, 6).toISOString(),
        animatedDate: true,
        hourScroll: true,
      }),
    )
    expect(
      screen.getByTestId("calendar-view-item-week").props.accessibilityState
        .selected,
    ).toBe(true)
  })
  it("renders a fixture event's tile with its title and location", async () => {
    await render(<CalendarScreen />)
    expect(screen.getByText("Algorithms")).toBeTruthy()
    expect(screen.getByText("Room A1")).toBeTruthy()
  })

  it("exposes an accessible label combining title, time and location", async () => {
    await render(<CalendarScreen />)
    expect(
      screen.getByLabelText("Algorithms, 09:00 – 10:30 Room A1"),
    ).toBeTruthy()
  })

  it("shows synced and personal checklist progress in week and day timed tiles", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "personal-1" }),
      calendarEvent({
        id: "synced-1",
        title: "Databases",
        userCalendarId: "calendar-1",
      }),
    ])
    mockUseChecklistProgress.mockReturnValue(
      new Map([
        ["personal-1", { completed: 1, total: 2, isComplete: false }],
        ["synced-1", { completed: 2, total: 2, isComplete: true }],
      ]),
    )
    await render(<CalendarScreen />)

    expect(mockUseChecklistProgress).toHaveBeenCalledWith([
      "personal-1",
      "synced-1",
    ])
    expect(
      screen.getByText("1/2", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.getByText("2/2", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.getByLabelText(/1 of 2 checklist items completed/),
    ).toBeTruthy()

    fireEvent.press(screen.getByTestId("calendar-view-item-day"))
    await waitFor(() => {
      expect(
        screen.getByText("2/2", { includeHiddenElements: true }),
      ).toBeTruthy()
    })
  })

  it("defaults to the week view selected and toggles to day via the menu", async () => {
    await render(<CalendarScreen />)
    const day = screen.getByTestId("calendar-view-item-day")
    const week = screen.getByTestId("calendar-view-item-week")
    expect(week.props.accessibilityState.selected).toBe(true)
    expect(day.props.accessibilityState.selected).toBe(false)

    fireEvent.press(day)
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-item-day").props.accessibilityState
          .selected,
      ).toBe(true)
    })
    expect(
      screen.getByTestId("calendar-view-item-week").props.accessibilityState
        .selected,
    ).toBe(false)
  })

  it("keeps the scrolled-to week within the loaded (quarter-quantized) range", async () => {
    await render(<CalendarScreen />)
    // A settled scroll to 2026-08-01: the grid feeds calendar-kit a quarter-wide
    // window (Issue 5), so the loaded range must cover the scrolled-to day —
    // otherwise a scrolled-to week renders no events. (Within a quarter the range
    // does not shift; it already covers — that is the anti-lag property.)
    fireEvent.press(screen.getByTestId("grid-date-change"))
    await waitFor(() => {
      const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0] as {
        from: Date
        to: Date
      }
      const target = new Date(2026, 7, 1).getTime() // Aug 1 2026, local
      expect(range.from.getTime()).toBeLessThanOrEqual(target)
      expect(range.to.getTime()).toBeGreaterThan(target)
    })
  })

  it("shifts the feed window to the settled date's quarter on a cross-quarter settle", async () => {
    // grid-date-change lands in the same quarter as the (~real-clock) mount, so it
    // can't prove the feed MOVES. A settle to 2026-11-15 (Q4) must re-derive the
    // range as exactly that date's quarter window — proving onDateChanged →
    // windowStart → bucketMs → gridRange end to end, not a static mount range.
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-cross-quarter"))
    await waitFor(() => {
      const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0] as {
        from: Date
        to: Date
      }
      const settled = new Date("2026-11-15T12:00:00.000Z")
      const expected = calendarTimelineEventWindow(settled, ZONE)
      expect(range.from.getTime()).toBe(expected.from.getTime())
      expect(range.to.getTime()).toBe(expected.to.getTime())
    })
  })

  it("shifts the feed window mid-scroll on a cross-quarter onChange, before any settle (ADR 032)", async () => {
    // The patched calendar-kit packs its event store live around the visible
    // date while flinging (ADR 032), so a no-pause fling across a quarter
    // boundary must move the fed window at the crossing — waiting for
    // onDateChanged (settle) would let the pack run past the fed
    // quarter+buffer onto days the prop never carried. Clock-robust in two
    // steps: a SETTLE to Q4 2026 pins windowStart unconditionally (mount
    // quarter irrelevant), then a mid-scroll tick (onChange ONLY) into
    // Q1 2027 must shift the feed with no settle — were the onChange
    // quarter-cross wiring deleted, the feed would still be Q4's window.
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-cross-quarter"))
    const q4 = calendarTimelineEventWindow(
      new Date("2026-11-15T12:00:00.000Z"),
      ZONE,
    )
    await waitFor(() => {
      const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0] as {
        from: Date
      }
      expect(range.from.getTime()).toBe(q4.from.getTime())
    })

    fireEvent.press(screen.getByTestId("grid-visible-cross-quarter"))
    const expected = calendarTimelineEventWindow(
      new Date("2027-02-10T12:00:00.000Z"),
      ZONE,
    )
    await waitFor(() => {
      const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0] as {
        from: Date
        to: Date
      }
      expect(range.from.getTime()).toBe(expected.from.getTime())
      expect(range.to.getTime()).toBe(expected.to.getTime())
    })
  })

  it("shows the empty-range state when no events intersect", async () => {
    mockUseCalendarEvents.mockReturnValue([])
    await render(<CalendarScreen />)
    expect(screen.getByText("No events this period.")).toBeTruthy()
    // The E2E-stable empty marker (the calendar.yaml round-trip asserts the
    // empty→populated transition against its absence once the seed syncs).
    expect(screen.getByTestId("calendar-empty")).toBeTruthy()
  })

  it("switches to the agenda view and renders a day header + tile", async () => {
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))

    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-item-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })

    // 2026-06-16 is a Tuesday — the formatted day header (weekday + day number).
    expect(screen.getByText("TUE")).toBeTruthy()
    expect(screen.getByText("16")).toBeTruthy()
    // The fixture event's tile renders with its title + formatted time range.
    expect(screen.getByText("Algorithms")).toBeTruthy()
    expect(screen.getByText("09:00 – 10:30")).toBeTruthy()
  })

  it("shows zero, partial, and complete Agenda progress and updates the mounted row map", async () => {
    const events = [
      calendarEvent({ id: "zero-1" }),
      calendarEvent({ id: "personal-1", title: "Databases" }),
      calendarEvent({
        id: "synced-1",
        title: "Networks",
        userCalendarId: "calendar-1",
      }),
    ]
    mockUseCalendarEvents.mockReturnValue(events)
    mockUseChecklistProgress.mockReturnValue(
      new Map([
        ["personal-1", { completed: 1, total: 3, isComplete: false }],
        ["synced-1", { completed: 2, total: 2, isComplete: true }],
      ]),
    )
    const view = await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))
    await waitFor(() => {
      expect(
        screen.getByText("1/3", { includeHiddenElements: true }),
      ).toBeTruthy()
    })
    expect(
      screen.getByText("2/2", { includeHiddenElements: true }),
    ).toBeTruthy()
    expect(
      screen.queryByText("0/0", { includeHiddenElements: true }),
    ).toBeNull()
    expect(
      screen.getByLabelText(/1 of 3 checklist items completed.*View details/),
    ).toBeTruthy()
    expect(
      screen.getByLabelText(/2 of 2 checklist items completed.*View details/),
    ).toBeTruthy()

    mockUseChecklistProgress.mockReturnValue(
      new Map([
        ["personal-1", { completed: 3, total: 3, isComplete: true }],
        ["synced-1", { completed: 2, total: 2, isComplete: true }],
      ]),
    )
    await view.rerender(<CalendarScreen />)
    expect(
      screen.getByText("3/3", { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  it("shows the agenda empty state when no events intersect", async () => {
    mockUseCalendarEvents.mockReturnValue([])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))
    await waitFor(() => {
      expect(screen.getByText("No events this period.")).toBeTruthy()
    })
  })

  it("renders an accessible sync-error with a retry that re-syncs", async () => {
    mockUseSyncCalendars.mockReturnValue(syncState({ isError: true }))
    await render(<CalendarScreen />)

    expect(
      screen.getByText(
        "We couldn't refresh your calendar. Showing your last update.",
      ),
    ).toBeTruthy()
    const retry = screen.getByTestId("calendar-sync-retry")
    expect(retry.props.accessibilityLabel).toBe(
      "Retry refreshing your calendar",
    )
    fireEvent.press(retry)
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it("does not render the sync-error banner when there is no error", async () => {
    await render(<CalendarScreen />)
    expect(screen.queryByTestId("calendar-sync-error")).toBeNull()
  })

  it("pull-to-refresh on the agenda triggers a sync", async () => {
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-item-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })

    // The agenda SectionList's RefreshControl — fire its onRefresh prop.
    const list = screen.getByTestId("agenda-section-list")
    list.props.refreshControl.props.onRefresh()
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it("routes a synced grid-event press to the event-details screen", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "synced-1", userCalendarId: "cal-1" }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-event-synced-1"))
    expect(mockPush).toHaveBeenCalledWith("/event-details/synced-1")
  })

  it("routes a personal grid-event press to the unified event-details screen (ADR 024)", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "personal-1", userCalendarId: undefined }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-event-personal-1"))
    expect(mockPush).toHaveBeenCalledWith("/event-details/personal-1")
  })

  it("lanes an all-day event in the all-day row with an 'All day' label, routing on press", async () => {
    // An all-day event maps to calendar-kit's date-only shape, so the mocked
    // CalendarHeader (the all-day lane) renders it — NOT the timed CalendarBody.
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({
        id: "allday-1",
        title: "Holiday",
        location: "Gym",
        allDay: true,
        startsAt: new Date("2026-05-25T00:00:00.000Z"),
        endsAt: new Date("2026-05-26T00:00:00.000Z"),
        userCalendarId: "cal-1",
      }),
    ])
    mockUseChecklistProgress.mockReturnValue(
      new Map([["allday-1", { completed: 1, total: 1, isComplete: true }]]),
    )
    await render(<CalendarScreen />)
    expect(screen.getByText("Holiday")).toBeTruthy()
    // The all-day tile is title-only; the label still carries the "all day" time +
    // location (one screen-reader stop), never a "02:00 – 02:00" range.
    expect(
      screen.getByLabelText(
        "Holiday, All day Gym. 1 of 1 checklist items completed",
      ),
    ).toBeTruthy()
    expect(
      screen.getByText("1/1", { includeHiddenElements: true }),
    ).toBeTruthy()
    fireEvent.press(screen.getByTestId("grid-event-allday-1"))
    expect(mockPush).toHaveBeenCalledWith("/event-details/allday-1")
  })

  it("keeps the real time range (not 'All day') for a timed ≥24h event the lib lanes in the all-day row", async () => {
    // calendar-kit also lanes any TIMED event ≥24h into the all-day row
    // (eventUtils.js:63), so it reaches AllDayTile — which must announce its real
    // time range, NOT a false "all day". Local-time dates so "09:00 – 18:00" is
    // TZ-independent; ~33h span trips the lib's duration rule (mirrored in the mock).
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({
        id: "long-timed-1",
        title: "Seminar",
        location: "Hall",
        allDay: false,
        startsAt: new Date(2026, 4, 25, 9, 0, 0, 0),
        endsAt: new Date(2026, 4, 26, 18, 0, 0, 0),
      }),
    ])
    await render(<CalendarScreen />)
    expect(screen.getByLabelText("Seminar, 09:00 – 18:00 Hall")).toBeTruthy()
    expect(screen.queryByLabelText("Seminar, All day Hall")).toBeNull()
  })

  it("shows an all-day agenda tile without a time range", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({
        id: "allday-2",
        title: "Holiday",
        location: "",
        allDay: true,
        startsAt: new Date("2026-05-25T00:00:00.000Z"),
        endsAt: new Date("2026-05-26T00:00:00.000Z"),
      }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-item-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })
    expect(screen.getByText("All day")).toBeTruthy()
    expect(screen.queryByText("02:00 – 02:00")).toBeNull()
  })

  it("makes the agenda tile a touchable button that routes to event-details", async () => {
    mockUseCalendarEvents.mockReturnValue([
      calendarEvent({ id: "synced-1", userCalendarId: "cal-1" }),
    ])
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-item-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })

    const tile = screen.getByLabelText(
      "Algorithms, 09:00 – 10:30 Room A1. View details",
    )
    expect(tile.props.accessibilityRole).toBe("button")
    fireEvent.press(tile)
    expect(mockPush).toHaveBeenCalledWith("/event-details/synced-1")
  })

  it("opens the personal-event form from the header Add action (iOS)", async () => {
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("calendar-add"))
    expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
  })

  it("renders an Add FAB (not a header Add) on Android", async () => {
    const original = Platform.OS
    Platform.OS = "android"
    try {
      await render(<CalendarScreen />)
      expect(screen.queryByTestId("calendar-add")).toBeNull()
      expect(screen.queryByText("Today")).toBeNull()
      expect(screen.getByLabelText("Go to today")).toBeTruthy()
      fireEvent.press(screen.getByTestId("calendar-fab"))
      expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
    } finally {
      Platform.OS = original
    }
  })

  it("uses a compact menu trigger to change views on Android", async () => {
    const original = Platform.OS
    Platform.OS = "android"
    try {
      await render(<CalendarScreen />)
      expect(screen.getByTestId("calendar-view")).toBeTruthy()
      expect(screen.queryByTestId("menu-action-day")).toBeNull()
      fireEvent.press(screen.getByTestId("calendar-view"))
      await waitFor(() => {
        expect(screen.getByTestId("menu-action-week")).toBeTruthy()
      })
      fireEvent.press(screen.getByTestId("menu-action-week"))
      await waitFor(() => {
        expect(screen.queryByTestId("menu-action-week")).toBeNull()
      })
      fireEvent(screen.getByTestId("calendar-view"), "accessibilityAction", {
        nativeEvent: { actionName: "activate" },
      })
      await waitFor(() => {
        expect(screen.getByTestId("menu-action-day")).toBeTruthy()
      })
      fireEvent.press(screen.getByTestId("menu-action-day"))
      await waitFor(() => {
        expect(
          screen.getByTestId("calendar-view").props.accessibilityLabel,
        ).toBe("Day")
      })
    } finally {
      Platform.OS = original
    }
  })
})

// The month title + the always-present "Today" action derive from the visible
// window. Real timers + the current clock: the title assertions are computed with
// the SAME formatter/TZ handling as the screen (so they hold in any CI timezone),
// and the Today recentre is asserted via the reloaded range (not a visibility flip).
describe("CalendarScreen — month title + Today action", () => {
  // The grid mock scrolls to this instant; the resulting title is its LOCAL month,
  // computed here the same way the screen does so the assertion is TZ-independent.
  const scrolledTitle = formatMonthYear(
    new Date("2026-08-01T00:00:00.000Z"),
    "en",
    ZONE,
  )

  it("renders the visible month + year as the header title", async () => {
    await render(<CalendarScreen />)
    expect(
      screen.getByText(formatMonthYear(new Date(), "en", ZONE)),
    ).toBeTruthy()
  })

  it("updates the title when the grid scrolls to another month", async () => {
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-date-change"))
    await waitFor(() => {
      expect(screen.getByText(scrolledTitle)).toBeTruthy()
    })
  })

  it("tracks the title mid-scroll via onChange, before the scroll settles (Issue 6)", async () => {
    // onChange fires per visible-column while scrolling; onDateChanged only at
    // settle. The title must follow onChange — here a mid-scroll tick to
    // 2026-09-01 (onChange ONLY, no onDateChanged) updates the title immediately.
    await render(<CalendarScreen />)
    fireEvent.press(screen.getByTestId("grid-visible-change"))
    const visibleTitle = formatMonthYear(
      new Date("2026-09-01T00:00:00.000Z"),
      "en",
      ZONE,
    )
    await waitFor(() => {
      expect(screen.getByText(visibleTitle)).toBeTruthy()
    })
  })

  it("always offers Today and recentres the loaded range on press", async () => {
    await render(<CalendarScreen />)
    // Today is offered from the start (a one-tap jump home from anywhere).
    expect(screen.getByTestId("calendar-today")).toBeTruthy()

    // Scroll away, then Today snaps the loaded window back over the current day.
    fireEvent.press(screen.getByTestId("grid-date-change"))
    await waitFor(() => {
      expect(screen.getByText(scrolledTitle)).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId("calendar-today"))
    await waitFor(() => {
      const range = mockUseCalendarEvents.mock.calls.at(-1)?.[0] as {
        from: Date
        to: Date
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      expect(range.from.getTime()).toBeLessThanOrEqual(today.getTime())
      expect(range.to.getTime()).toBeGreaterThan(today.getTime())
    })
  })
})

// The display-zone threading into the renderer (timezone design D5): the grid
// receives the resolved zone as its timeZone prop and a zone day-key
// initialDate, so calendar-kit's internal day division agrees with ours.
describe("CalendarScreen — display zone threading", () => {
  afterEach(() => {
    remove(SETTINGS_KEYS.timezone)
  })

  it("feeds the resolved display zone and its day-key to the grid", async () => {
    await render(<CalendarScreen />)
    expect(screen.getByTestId("grid-time-zone").props.accessibilityLabel).toBe(
      ZONE,
    )
    expect(
      screen.getByTestId("grid-initial-date").props.accessibilityLabel,
    ).toBe(dayKey(new Date(), ZONE))
  })

  it("feeds an explicit preference zone to the grid", async () => {
    setTimezonePreference("Pacific/Noumea")
    await render(<CalendarScreen />)
    expect(screen.getByTestId("grid-time-zone").props.accessibilityLabel).toBe(
      "Pacific/Noumea",
    )
    expect(
      screen.getByTestId("grid-initial-date").props.accessibilityLabel,
    ).toBe(dayKey(new Date(), "Pacific/Noumea"))
  })
})
