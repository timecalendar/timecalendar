import { act, renderHook } from "@testing-library/react-native"

import { subscribeToTableChanges } from "@/db"
import { recordError } from "@/firebase"

import type { CalendarWindowRead } from "./calendar-window-store"
import { selectPageEvents } from "./calendar-window-store"
import { epochDayOfKey } from "./epoch-day"
import { pageIndexOfDay, type PageSpace } from "./page-index"
import { useCalendarWindow } from "./use-calendar-window"

const mockRead = jest.fn()
const mockUnsubscribe = jest.fn()

jest.mock("@/db", () => ({
  calendarEvents: { table: "calendar_events" },
  personalEvents: { table: "personal_events" },
  checklistItems: { table: "checklist_items" },
  userCalendars: { table: "user_calendars" },
  subscribeToTableChanges: jest.fn(() => mockUnsubscribe),
}))
jest.mock("./calendar-window-reader", () => ({
  readCalendarWindow: (request: unknown) => mockRead(request),
}))
jest.mock("@/firebase", () => ({ recordError: jest.fn() }))

const mockSubscribe = subscribeToTableChanges as jest.Mock
const mockRecordError = recordError as jest.Mock
const WEEKS: PageSpace = { mode: "week", firstWeekday: 1 }
const CENTER = pageIndexOfDay(WEEKS, epochDayOfKey("2026-10-01"))

function emptyRead(): CalendarWindowRead {
  return {
    chunks: new Map(),
    visibleCalendarIds: new Set(),
    rejectedCounts: {
      "invalid-identity": 0,
      "invalid-start": 3,
      "invalid-end": 0,
      "reversed-range": 0,
      "invalid-date-range": 0,
    },
  }
}

beforeEach(() => {
  mockRead.mockReset()
  mockRead.mockResolvedValue(emptyRead())
  mockSubscribe.mockClear()
  mockUnsubscribe.mockClear()
  mockRecordError.mockClear()
})

describe("useCalendarWindow", () => {
  it("keeps one store per screen, connected to the four calendar tables", async () => {
    const { result, rerender, unmount } = await renderHook(
      (props: { displayZone: string }) =>
        useCalendarWindow({ displayZone: props.displayZone, firstWeekday: 1 }),
      { initialProps: { displayZone: "UTC" } },
    )
    const store = result.current.store
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockSubscribe.mock.calls[0]?.[0]).toHaveLength(4)

    await act(async () => {
      store.ensure(WEEKS, CENTER)
    })
    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(
      selectPageEvents(result.current.snapshot, WEEKS, CENTER, {
        hiddenUids: new Set(),
        hiddenNames: new Set(),
      }).status,
    ).toBe("ready")

    await rerender({ displayZone: "Europe/Paris" })
    expect(result.current.store).toBe(store)
    expect(result.current.snapshot.displayZone).toBe("Europe/Paris")
    expect(mockRead).toHaveBeenCalledTimes(2)

    await act(async () => {
      mockSubscribe.mock.calls[0]?.[1]()
    })
    expect(mockRead).toHaveBeenCalledTimes(3)
    expect(mockRecordError).toHaveBeenCalledTimes(1)

    await unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
