import { renderHook } from "@testing-library/react-native"

import { useChecklistProgress } from "@/features/event-checklists"

import { useCalendarEventsSnapshot } from "./events"
import { useCalendarTimelinePresentation } from "./timeline-presentation-hook"
import type { TimedCalendarEventV1 } from "./types"

jest.mock("./events", () => ({ useCalendarEventsSnapshot: jest.fn() }))
jest.mock("@/features/event-checklists", () => ({
  useChecklistProgress: jest.fn(),
}))

const mockSnapshot = useCalendarEventsSnapshot as jest.Mock
const mockProgress = useChecklistProgress as jest.Mock

function event(uid: string, startsAt = "2026-09-14T08:00:00Z") {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title: uid,
    color: "#112233",
    startsAt: new Date(startsAt),
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000),
    location: undefined,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
  } satisfies TimedCalendarEventV1
}

function snapshot(
  events: readonly TimedCalendarEventV1[],
  ready = true,
  error?: Error,
) {
  return {
    events,
    ready,
    error,
    revision: "1",
    rejectedCounts: {},
    counts: {
      queriedSyncedTimed: events.length,
      queriedSyncedDateOnly: 0,
      queriedPersonal: 0,
      accepted: events.length,
      filtered: 0,
    },
  }
}

const baseInput = {
  anchor: new Date("2026-09-14T12:00:00Z"),
  mode: "day" as const,
  displayZone: "UTC",
  firstWeekday: 1 as const,
  showWeekends: true,
  generation: 1,
}

describe("useCalendarTimelinePresentation", () => {
  beforeEach(() => {
    mockProgress.mockReturnValue(new Map())
    mockSnapshot.mockReturnValue(snapshot([]))
  })

  it("publishes empty, loaded, checklist-updated, and removal models", async () => {
    const { result, rerender } = await renderHook(
      ({ input }) => useCalendarTimelinePresentation(input),
      { initialProps: { input: baseInput } },
    )
    expect(result.current.presentation.pages).toHaveLength(3)
    expect(mockProgress).toHaveBeenLastCalledWith([])

    mockSnapshot.mockReturnValue(snapshot([event("maths")]))
    mockProgress.mockReturnValue(
      new Map([["maths", { completed: 1, total: 2, isComplete: false }]]),
    )
    await rerender({ input: baseInput })
    const tile = result.current.presentation.pages[1].columns[0]?.tiles[0]
    expect(tile?.identity.uid).toBe("maths")
    expect(tile?.checklist).toEqual({
      completed: 1,
      total: 2,
      isComplete: false,
    })
    expect(mockProgress).toHaveBeenLastCalledWith(["maths"])

    mockSnapshot.mockReturnValue(snapshot([]))
    await rerender({ input: baseInput })
    expect(
      result.current.presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) => column.tiles),
      ),
    ).toEqual([])
  })

  it("retains the last complete generation during replacement and releases it on completion", async () => {
    mockSnapshot.mockReturnValue(snapshot([event("old")]))
    const { result, rerender } = await renderHook(
      ({ input }) => useCalendarTimelinePresentation(input),
      { initialProps: { input: baseInput } },
    )
    expect(result.current.presentation.generation).toBe(1)

    mockSnapshot.mockReturnValue(snapshot([], false))
    const replacement = {
      ...baseInput,
      anchor: new Date("2026-09-15T12:00:00Z"),
      generation: 2,
    }
    await rerender({ input: replacement })
    expect(result.current.presentation.generation).toBe(1)
    expect(
      result.current.presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) =>
          column.tiles.map((tile) => tile.identity.uid),
        ),
      ),
    ).toEqual(["old"])

    mockSnapshot.mockReturnValue(
      snapshot([event("new", "2026-09-15T08:00:00Z")]),
    )
    await rerender({ input: replacement })
    expect(result.current.presentation.generation).toBe(2)
    expect(
      result.current.presentation.pages[1].columns[0]?.tiles[0]?.identity.uid,
    ).toBe("new")
  })

  it("keeps the complete model through a recoverable replacement error", async () => {
    mockSnapshot.mockReturnValue(snapshot([event("stable")]))
    const { result, rerender } = await renderHook(
      ({ input }) => useCalendarTimelinePresentation(input),
      { initialProps: { input: baseInput } },
    )
    const failure = new Error("local read failed")
    mockSnapshot.mockReturnValue(snapshot([], true, failure))
    await rerender({ input: { ...baseInput, generation: 2 } })
    expect(result.current.error).toBe(failure)
    expect(result.current.presentation.generation).toBe(1)
  })
})
