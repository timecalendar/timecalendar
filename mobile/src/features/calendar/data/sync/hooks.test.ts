// Mock the @/db seam: useLiveQuery returns a fixed data array; db.select().from()
// is a no-op the hook passes to it. Proves the hook maps live rows → domain
// (range filtering lives in useCalendarEvents, not here), without a real SQLite
// reactive query.
import { renderHook } from "@testing-library/react-native"

import { useSyncedEvents } from "./hooks"

const mockUseLiveQuery = jest.fn()

jest.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({}) }) },
  calendarEvents: {},
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

function row(overrides: Record<string, unknown> = {}) {
  return {
    uid: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    groupColor: "#1E88E5",
    startsAt: "2026-06-16T09:00:00.000Z",
    endsAt: "2026-06-16T10:30:00.000Z",
    exportedAt: "2026-06-15T08:00:00.000Z",
    location: "Room A1",
    description: null,
    allDay: false,
    teachers: "[]",
    tags: "[]",
    fields: null,
    type: "cm",
    userCalendarId: "cal-1",
    ...overrides,
  }
}

describe("useSyncedEvents", () => {
  it("maps every live-query row to a domain event (filtering happens in useCalendarEvents)", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [
        row(),
        row({
          uid: "ev-2",
          startsAt: "2030-01-01T09:00:00.000Z",
          endsAt: "2030-01-01T10:00:00.000Z",
        }),
      ],
    })
    const { result } = await renderHook(() => useSyncedEvents())
    // No range filter here — both rows map through; useCalendarEvents filters once.
    expect(result.current).toHaveLength(2)
    expect(result.current[0]?.id).toBe("ev-1")
    expect(result.current[0]?.startsAt).toBeInstanceOf(Date)
  })
})
