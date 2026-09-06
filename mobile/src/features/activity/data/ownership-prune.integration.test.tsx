import { act, renderHook, waitFor } from "@testing-library/react-native"

import {
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { createFakeDb } from "@/test-support/fake-db"

const mockFake = createFakeDb({
  tables: {
    activityLogs: {
      columns: [
        "id",
        "calendarId",
        "calendarName",
        "changeJson",
        "createdAt",
        "updatedAt",
      ],
    },
    activityState: { columns: ["id"] },
  },
})

jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
}))

/* eslint-disable @typescript-eslint/no-require-imports */
const { useActivityOwnershipReconciliation } =
  require("./lifecycle") as typeof import("./lifecycle")
const repository = require("./repository") as typeof import("./repository")
/* eslint-enable @typescript-eslint/no-require-imports */

const mockUseCalendars = useUserCalendars as jest.Mock
const mockUseLoaded = useUserCalendarsLoaded as jest.Mock

const row = (id: string, calendarId: string, createdAt: string) => ({
  id,
  calendarId,
  calendarName: calendarId,
  changeJson: JSON.stringify({ oldItems: [], newItems: [], changedItems: [] }),
  createdAt,
  updatedAt: createdAt,
})

beforeEach(() => {
  mockFake.reset()
  mockUseLoaded.mockReturnValue(true)
})

afterEach(() => {
  mockUseCalendars.mockReset()
  mockUseLoaded.mockReset()
})

it("removes only the departed calendar history and preserves Activity state", async () => {
  await repository.storeNewestPage({
    rows: [
      row("log-kept", "cal-kept", "2026-08-29T12:00:00.000Z"),
      row("log-removed", "cal-removed", "2026-08-29T11:00:00.000Z"),
    ],
    asOf: "2026-08-29T12:30:00.000Z",
    heldCalendarIds: ["cal-kept", "cal-removed"],
    nextCursor: "older-cursor",
    lastSuccessfulRefreshAt: new Date("2026-08-29T12:31:00.000Z"),
  })
  await repository.markActivityRead("2026-08-29T12:15:00.000Z")
  const stateBefore = await repository.readActivityState()

  mockUseCalendars.mockReturnValue([{ id: "cal-kept" }, { id: "cal-removed" }])
  const rendered = await renderHook(() => useActivityOwnershipReconciliation())

  mockUseCalendars.mockReturnValue([{ id: "cal-kept" }])
  await act(async () => {
    await rendered.rerender(undefined)
  })

  await waitFor(async () => {
    expect((await repository.listActivityLogs()).map((log) => log.id)).toEqual([
      "log-kept",
    ])
  })
  expect(await repository.readActivityState()).toEqual(stateBefore)
})
