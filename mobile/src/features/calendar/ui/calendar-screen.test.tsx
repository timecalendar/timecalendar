import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"
import { AccessibilityInfo, Platform, StyleSheet } from "react-native"
import { withTiming } from "react-native-reanimated"

import {
  formatFullDay,
  formatMonthYear,
  startOfWeekInZone,
  useCalendarEvents,
  useSyncCalendars,
} from "@/features/calendar/data"
import { useChecklistProgress } from "@/features/event-checklists"
import { setTimezonePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import { remove } from "@/storage"
import { resolveResponsiveLayout } from "@/theme"

import { CalendarScreen } from "./calendar-screen"

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
const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockUseChecklistProgress = useChecklistProgress as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockPush = router.push as jest.Mock
const mockSetParams = router.setParams as jest.Mock
const mockSync = jest.fn()
const mockAnnounce = jest.spyOn(AccessibilityInfo, "announceForAccessibility")

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
  return {
    id: "synced-1",
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
    userCalendarId: "calendar-1",
    ...overrides,
  }
}

beforeEach(() => {
  mockUseCalendarEvents.mockReturnValue([calendarEvent()])
  mockUseSyncCalendars.mockReturnValue(syncState())
  mockUseChecklistProgress.mockReturnValue(new Map())
  mockUseLocalSearchParams.mockReturnValue({})
  mockSync.mockReset()
  mockPush.mockReset()
  mockSetParams.mockReset()
  mockAnnounce.mockClear()
})

describe("CalendarScreen owned shell", () => {
  it("mounts and remounts the localized heading and full-bleed canvas", async () => {
    const first = await render(<CalendarScreen />)
    const heading = formatFullDay(
      startOfWeekInZone(new Date(), ZONE, 1),
      "en",
      ZONE,
    )
    expect(screen.getByRole("header", { name: heading })).toBeOnTheScreen()
    expect(screen.getByTestId("owned-calendar-canvas")).toBeOnTheScreen()
    expect(
      StyleSheet.flatten(
        screen.getByTestId("calendar-full-bleed-owner").props.style,
      ).maxWidth,
    ).toBeUndefined()

    await first.unmount()
    await render(<CalendarScreen />)
    expect(screen.getByRole("header", { name: heading })).toBeOnTheScreen()
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
        screen.getByRole("header", {
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
      screen.getByRole("header", {
        name: formatFullDay(startOfWeekInZone(new Date(), ZONE, 1), "en", ZONE),
      }),
    ).toBeOnTheScreen()
    expect(mockSetParams).toHaveBeenCalledWith({ focusDate: undefined })
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
        screen.getByRole("header", {
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
        screen.getByRole("header", {
          name: formatFullDay(new Date(2026, 7, 31), "en", ZONE),
        }),
      ).toBeOnTheScreen()
    })

    await fireEvent.press(screen.getByTestId("calendar-next-week"))

    const destination = new Date(2026, 8, 7)
    await waitFor(() => {
      expect(
        screen.getByRole("header", {
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

  it("discards a completion superseded by Today", async () => {
    mockUseLocalSearchParams.mockReturnValue({ focusDate: "2026-08-31" })
    jest.mocked(withTiming).mockImplementationOnce((value) => value)
    await render(<CalendarScreen />)
    await waitFor(() => {
      expect(screen.getByTestId("calendar-next-week")).toBeOnTheScreen()
    })
    await fireEvent(screen.getByTestId("owned-calendar-canvas"), "layout", {
      nativeEvent: { layout: { width: 320, height: 500 } },
    })
    await fireEvent.press(screen.getByTestId("calendar-next-week"))
    const staleCompletion = jest.mocked(withTiming).mock.calls[0]?.[2]

    await fireEvent.press(screen.getByTestId("calendar-today"))
    await act(async () => staleCompletion?.(true, undefined))

    const todayWeek = startOfWeekInZone(new Date(), ZONE, 1)
    expect(
      screen.getByRole("header", {
        name: formatFullDay(todayWeek, "en", ZONE),
      }),
    ).toBeOnTheScreen()
    expect(mockAnnounce).not.toHaveBeenCalled()
  })
})

describe("CalendarScreen retained Agenda", () => {
  async function openAgenda() {
    await fireEvent.press(screen.getByTestId("calendar-view-item-agenda"))
    await waitFor(() => {
      expect(
        screen.getByTestId("calendar-view-item-agenda").props.accessibilityState
          .selected,
      ).toBe(true)
    })
  }

  it("offers only distinct Week and Agenda choices", async () => {
    await render(<CalendarScreen />)

    expect(screen.getByTestId("calendar-view-item-week")).toBeOnTheScreen()
    expect(screen.getByTestId("calendar-view-item-agenda")).toBeOnTheScreen()
    expect(screen.queryByTestId("calendar-view-item-day")).toBeNull()
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
  it("keeps Add in the iOS header", async () => {
    await render(<CalendarScreen />)
    expect(screen.queryByTestId("calendar-today")).toBeNull()
    await fireEvent.press(screen.getByTestId("calendar-add"))
    expect(mockPush).toHaveBeenCalledWith("/personal-event-form")
  })

  it("keeps Android targets and offers only Week and Agenda", async () => {
    const original = Platform.OS
    Platform.OS = "android"
    try {
      await render(<CalendarScreen />)
      const trigger = screen.getByTestId("calendar-view")
      expect(StyleSheet.flatten(trigger.props.style).minHeight).toBe(48)
      await fireEvent.press(trigger)
      await waitFor(() => {
        expect(screen.getByTestId("menu-action-week")).toBeOnTheScreen()
      })
      expect(screen.getByTestId("menu-action-agenda")).toBeOnTheScreen()
      expect(screen.queryByTestId("menu-action-day")).toBeNull()
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
    setTimezonePreference("Pacific/Noumea")
    await render(<CalendarScreen />)

    await waitFor(() => {
      expect(
        screen.getByRole("header", {
          name: formatFullDay(
            new Date("2026-06-14T13:00:00.000Z"),
            "en",
            "Pacific/Noumea",
          ),
        }),
      ).toBeOnTheScreen()
    })
  })
})
