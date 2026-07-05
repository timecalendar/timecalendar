// Mock the @/db seam: useLiveQuery returns a fixed data array; db.select().from()
// is a no-op the hook passes to it. Proves the hook maps live rows → domain (D4)
// without a real SQLite reactive query.
import { renderHook } from "@testing-library/react-native"

import { useUserCalendars, useUserCalendarsLoaded } from "./hooks"

const mockUseLiveQuery = jest.fn()

jest.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({}) }) },
  userCalendars: {},
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
  // The row→domain mappers now live on the @/db seam — supply the real impls.
  ...jest.requireActual<object>("@/db/mappers"),
}))

describe("useUserCalendars", () => {
  it("maps the live-query rows to domain calendars", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [
        {
          id: "cal-1",
          token: "tok-1",
          name: "ENSEEIHT",
          schoolName: null,
          schoolId: null,
          lastUpdatedAt: "2026-06-14T09:00:00.000Z",
          createdAt: "2026-06-10T08:00:00.000Z",
          visible: true,
        },
      ],
    })

    const { result } = await renderHook(() => useUserCalendars())
    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.id).toBe("cal-1")
    expect(result.current[0]?.token).toBe("tok-1")
    expect(result.current[0]?.lastUpdatedAt).toBeInstanceOf(Date)
    expect(result.current[0]?.schoolName).toBeUndefined()
  })

  it("keeps a stable array identity across renders (the events-seam memo depends on it)", async () => {
    const data = [
      {
        id: "cal-1",
        token: "tok-1",
        name: "ENSEEIHT",
        schoolName: null,
        schoolId: null,
        lastUpdatedAt: "2026-06-14T09:00:00.000Z",
        createdAt: "2026-06-10T08:00:00.000Z",
        visible: true,
      },
    ]
    mockUseLiveQuery.mockReturnValue({ data })

    const { result, rerender } = await renderHook(() => useUserCalendars())
    const first = result.current
    rerender({})
    expect(result.current).toBe(first)
  })
})

describe("useUserCalendarsLoaded", () => {
  it("is false until the reactive read first resolves", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: undefined })
    const { result } = await renderHook(() => useUserCalendarsLoaded())
    expect(result.current).toBe(false)
  })

  it("is true once the read has resolved", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: new Date() })
    const { result } = await renderHook(() => useUserCalendarsLoaded())
    expect(result.current).toBe(true)
  })
})
