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
    let input = baseInput
    const { result, rerender } = await renderHook(() =>
      useCalendarTimelinePresentation(input),
    )
    expect(result.current.presentation.pages).toHaveLength(3)
    expect(mockProgress).toHaveBeenLastCalledWith([])

    mockSnapshot.mockReturnValue(snapshot([event("maths")]))
    mockProgress.mockReturnValue(
      new Map([["maths", { completed: 1, total: 2, isComplete: false }]]),
    )
    await rerender({})
    const tile = result.current.presentation.pages[1].columns[0]?.tiles[0]
    expect(tile?.identity.uid).toBe("maths")
    expect(tile?.checklist).toEqual({
      completed: 1,
      total: 2,
      isComplete: false,
    })
    expect(mockProgress).toHaveBeenLastCalledWith(["maths"])

    mockSnapshot.mockReturnValue(snapshot([]))
    await rerender({})
    expect(
      result.current.presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) => column.tiles),
      ),
    ).toEqual([])
  })

  it("keeps retained events on their dates in the requested generation while loading", async () => {
    mockSnapshot.mockReturnValue(snapshot([event("old")]))
    let input = baseInput
    const { result, rerender } = await renderHook(() =>
      useCalendarTimelinePresentation(input),
    )
    expect(result.current.presentation.generation).toBe(1)

    mockSnapshot.mockReturnValue(snapshot([], false))
    const replacement = {
      ...baseInput,
      anchor: new Date("2026-09-15T12:00:00Z"),
      generation: 2,
    }
    input = replacement
    await rerender({})
    expect(result.current.presentation.generation).toBe(2)
    expect(result.current.presentation.pages[1].key).toBe("2026-09-15")
    expect(result.current.presentation.pages[1].columns[0]?.tiles).toEqual([])
    expect(
      result.current.presentation.pages[0].columns[0]?.tiles[0]?.identity.uid,
    ).toBe("old")
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
    await rerender({})
    expect(result.current.presentation.generation).toBe(2)
    expect(
      result.current.presentation.pages[1].columns[0]?.tiles[0]?.identity.uid,
    ).toBe("new")
  })

  it("keeps retained events in the requested generation through a read error", async () => {
    mockSnapshot.mockReturnValue(snapshot([event("stable")]))
    let input = baseInput
    const { result, rerender } = await renderHook(() =>
      useCalendarTimelinePresentation(input),
    )
    const failure = new Error("local read failed")
    mockSnapshot.mockReturnValue(snapshot([], true, failure))
    input = { ...baseInput, generation: 2 }
    await rerender({})
    expect(result.current.error).toBe(failure)
    expect(result.current.presentation.generation).toBe(2)
    expect(
      result.current.presentation.pages[1].columns[0]?.tiles[0]?.identity.uid,
    ).toBe("stable")
  })

  it.each(["2026-09-07", "2026-09-21"])(
    "keeps the swiped week %s centered before and after its read completes",
    async (destination) => {
      const old = event("old")
      const adjacent = event("adjacent", `${destination}T08:00:00Z`)
      mockSnapshot.mockReturnValue(snapshot([old, adjacent]))
      let input = { ...baseInput, mode: "week" as const }
      const { result, rerender } = await renderHook(() =>
        useCalendarTimelinePresentation(input),
      )

      mockSnapshot.mockReturnValue(snapshot([], false))
      input = {
        ...input,
        anchor: new Date(`${destination}T12:00:00Z`),
        generation: 2,
      }
      await rerender({})
      const pending = result.current.presentation
      expect(pending.generation).toBe(2)
      expect(pending.rangeKey).toBe(result.current.range.key)
      expect(pending.pages[1].key).toBe(destination)
      expect(pending.pages[1].columns[0]?.tiles[0]?.identity.uid).toBe(
        "adjacent",
      )

      mockSnapshot.mockReturnValue(snapshot([old, adjacent]))
      await rerender({})
      expect(result.current.presentation).toEqual(pending)
    },
  )

  it("does not put retained events on an unrelated date after a jump", async () => {
    mockSnapshot.mockReturnValue(snapshot([event("old")]))
    let input = baseInput
    const { result, rerender } = await renderHook(() =>
      useCalendarTimelinePresentation(input),
    )
    mockSnapshot.mockReturnValue(snapshot([], false))
    input = {
      ...baseInput,
      anchor: new Date("2026-10-14T12:00:00Z"),
      generation: 2,
    }
    await rerender({})
    expect(result.current.presentation.pages[1].key).toBe("2026-10-14")
    expect(
      result.current.presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) => column.tiles),
      ),
    ).toEqual([])
    expect(mockProgress).toHaveBeenLastCalledWith([])
  })

  it("publishes a bounded empty model while the initial local read is pending", async () => {
    mockSnapshot.mockReturnValue(snapshot([], false))
    const { result } = await renderHook(() =>
      useCalendarTimelinePresentation(baseInput),
    )
    expect(result.current.ready).toBe(false)
    expect(result.current.presentation.pages).toHaveLength(3)
    expect(
      result.current.presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) => column.tiles),
      ),
    ).toEqual([])
    expect(mockProgress).toHaveBeenLastCalledWith([])
  })
})
