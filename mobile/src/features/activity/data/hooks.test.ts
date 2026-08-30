import { renderHook } from "@testing-library/react-native"

import { useActivityLogs, useActivityState } from "./hooks"
import { DEFAULT_ACTIVITY_STATE } from "./types"

const mockUseLiveQuery = jest.fn()

jest.mock("@/db", () => ({
  activityLogs: { createdAt: {}, id: {} },
  activityState: {},
  db: {
    select: () => ({
      from: () => ({ orderBy: () => ({}) }),
    }),
  },
  desc: (value: unknown) => value,
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
  ...jest.requireActual<object>("@/db/mappers"),
}))

const validRow = {
  id: "log-new",
  calendarId: "calendar-1",
  calendarName: "Long calendar",
  changeJson: JSON.stringify({
    oldItems: [],
    newItems: [],
    changedItems: [],
  }),
  createdAt: "2026-08-30T10:00:00.000Z",
  updatedAt: "2026-08-30T10:01:00.000Z",
}

afterEach(() => {
  mockUseLiveQuery.mockReset()
})

describe("useActivityLogs", () => {
  it("maps newest-first rows, drops an undecodable row, and reports loaded", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [validRow, { ...validRow, id: "bad", changeJson: "{" }],
      updatedAt: new Date(),
    })
    const { result } = await renderHook(() => useActivityLogs())
    expect(result.current.loaded).toBe(true)
    expect(result.current.logs.map((log) => log.id)).toEqual(["log-new"])
    expect(result.current.logs[0]?.createdAt).toBeInstanceOf(Date)
  })

  it("reports not loaded before the query settles", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: undefined })
    const { result } = await renderHook(() => useActivityLogs())
    expect(result.current).toEqual({ logs: [], loaded: false })
  })
})

describe("useActivityState", () => {
  it("uses the documented defaults when the singleton row is missing", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: new Date() })
    const { result } = await renderHook(() => useActivityState())
    expect(result.current).toEqual(DEFAULT_ACTIVITY_STATE)
  })

  it("maps stored timestamps to dates", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [
        {
          id: 1,
          lastReadAt: "2026-08-30T09:00:00.000Z",
          unreadCount: 7,
          lastSuccessfulRefreshAt: "2026-08-30T10:00:00.000Z",
          olderPageCursor: "cursor",
          olderPageComplete: true,
        },
      ],
    })
    const { result } = await renderHook(() => useActivityState())
    expect(result.current.unreadCount).toBe(7)
    expect(result.current.lastReadAt).toBeInstanceOf(Date)
    expect(result.current.lastSuccessfulRefreshAt).toBeInstanceOf(Date)
  })

  it("preserves null stored timestamps", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [
        {
          id: 1,
          lastReadAt: null,
          unreadCount: 0,
          lastSuccessfulRefreshAt: null,
          olderPageCursor: null,
          olderPageComplete: false,
        },
      ],
    })
    const { result } = await renderHook(() => useActivityState())
    expect(result.current.lastReadAt).toBeNull()
    expect(result.current.lastSuccessfulRefreshAt).toBeNull()
  })
})
