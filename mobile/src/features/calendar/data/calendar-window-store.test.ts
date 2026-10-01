import {
  type CalendarWindowRead,
  type CalendarWindowReader,
  createCalendarWindowStore,
  MAX_RESIDENT_CHUNKS,
  type PageEventFilter,
  selectPageEvents,
} from "./calendar-window-store"
import { epochDayOfKey } from "./epoch-day"
import { pageIndexOfDay, type PageSpace } from "./page-index"
import type { CalendarEvent, TimedCalendarEventV1 } from "./types"
import { chunkOfPage, type ChunkRange, type ChunkStart } from "./window-chunks"

const WEEKS: PageSpace = { mode: "week", firstWeekday: 1 }
const NO_FILTER: PageEventFilter = {
  hiddenUids: new Set(),
  hiddenNames: new Set(),
}
const NO_REJECTIONS = {
  "invalid-identity": 0,
  "invalid-start": 0,
  "invalid-end": 0,
  "reversed-range": 0,
  "invalid-date-range": 0,
}
const CENTER = pageIndexOfDay(WEEKS, epochDayOfKey("2026-10-01"))
const FAR = CENTER + 100

function event(
  uid: string,
  startsAt: string,
  overrides: Partial<TimedCalendarEventV1> = {},
): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title: uid,
    color: "#336699",
    location: undefined,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
    startsAt: new Date(startsAt),
    endsAt: new Date(new Date(startsAt).getTime() + 3_600_000),
    ...overrides,
  }
}

interface PendingRead {
  chunks: readonly ChunkRange[]
  displayZone: string
  resolve: (rows?: (range: ChunkRange) => readonly CalendarEvent[]) => void
  reject: (error: unknown) => void
}

function setup(options: { visibleCalendarIds?: readonly string[] } = {}) {
  const reads: PendingRead[] = []
  const reader: CalendarWindowReader = (request) =>
    new Promise<CalendarWindowRead>((resolve, reject) => {
      reads.push({
        ...request,
        reject,
        resolve: (
          rows = (range) => [
            event(`e-${range.start}`, range.from.toISOString()),
          ],
        ) =>
          resolve({
            chunks: new Map(
              request.chunks.map((range) => [
                range.start,
                {
                  events: rows(range),
                  checklist: new Map([
                    [
                      `e-${range.start}`,
                      { completed: 1, total: 2, isComplete: false },
                    ],
                  ]),
                },
              ]),
            ),
            visibleCalendarIds: new Set(
              options.visibleCalendarIds ?? ["cal-1"],
            ),
            rejectedCounts: NO_REJECTIONS,
          }),
      })
    })
  let changeListener: (() => void) | undefined
  const unsubscribe = jest.fn()
  const onRejectedRows = jest.fn()
  const store = createCalendarWindowStore({
    reader,
    subscribeToChanges: (listener) => {
      changeListener = listener
      return unsubscribe
    },
    displayZone: "Europe/Paris",
    firstWeekday: 1,
    onRejectedRows,
  })
  const emitted = jest.fn()
  store.subscribe(emitted)
  return {
    store,
    reads,
    emitted,
    unsubscribe,
    onRejectedRows,
    fireChange: () => changeListener?.(),
    page: (index: number, filter: PageEventFilter = NO_FILTER) =>
      selectPageEvents(store.getSnapshot(), WEEKS, index, filter),
  }
}

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) await Promise.resolve()
}

describe("CalendarWindowStore", () => {
  it("reads the required chunks in one batch and publishes once per change", async () => {
    const { store, reads, emitted, page } = setup()
    expect(page(CENTER).status).toBe("loading")

    store.ensure(WEEKS, CENTER)
    expect(reads).toHaveLength(1)
    expect(reads[0]!.chunks).toHaveLength(4)
    expect(reads[0]!.displayZone).toBe("Europe/Paris")
    expect(emitted).toHaveBeenCalledTimes(1)

    reads[0]!.resolve()
    await settle()
    expect(emitted).toHaveBeenCalledTimes(2)
    const ready = page(CENTER)
    expect(ready.status).toBe("ready")
    expect(ready.events.map((e) => e.identity.uid)).toEqual([
      `e-${chunkOfPage(WEEKS, CENTER)}`,
    ])
    expect(ready.checklist.size).toBe(1)
    expect(ready.revision).toBe(1)

    store.ensure(WEEKS, CENTER + 1)
    expect(reads).toHaveLength(1)
    expect(emitted).toHaveBeenCalledTimes(2)
  })

  it("never presents a loading page as a confirmed-empty page", async () => {
    const { store, reads, page } = setup()
    store.ensure(WEEKS, CENTER)
    const loading = page(CENTER)
    expect(loading).toMatchObject({
      status: "loading",
      events: [],
      revision: 0,
    })

    reads[0]!.resolve(() => [])
    await settle()
    expect(page(CENTER)).toMatchObject({ status: "ready", events: [] })
    expect(page(FAR).status).toBe("loading")
  })

  it("fills the right page when chunk reads complete out of order", async () => {
    const { store, reads, page } = setup()
    store.ensure(WEEKS, CENTER)
    store.ensure(WEEKS, FAR)
    expect(reads).toHaveLength(2)

    reads[1]!.resolve()
    await settle()
    expect(page(FAR).events[0]!.identity.uid).toBe(
      `e-${chunkOfPage(WEEKS, FAR)}`,
    )
    expect(page(CENTER).status).toBe("loading")

    reads[0]!.resolve()
    await settle()
    expect(page(CENTER).events[0]!.identity.uid).toBe(
      `e-${chunkOfPage(WEEKS, CENTER)}`,
    )
    expect(page(FAR).events[0]!.identity.uid).toBe(
      `e-${chunkOfPage(WEEKS, FAR)}`,
    )
  })

  it("drops a late result superseded by a newer read of the same chunk", async () => {
    const { store, reads, page } = setup()
    store.ensure(WEEKS, CENTER)
    store.invalidate()
    expect(reads).toHaveLength(2)

    reads[1]!.resolve((range) => [event("newer", range.from.toISOString())])
    await settle()
    reads[0]!.resolve((range) => [event("older", range.from.toISOString())])
    await settle()
    expect(page(CENTER).events.map((e) => e.identity.uid)).toEqual(["newer"])
    expect(page(CENTER).revision).toBe(2)
  })

  it("keeps previous rows while re-reading after a database change", async () => {
    const { store, reads, page, fireChange, unsubscribe } = setup()
    const disconnect = store.connect()
    expect(reads).toHaveLength(0)
    store.ensure(WEEKS, CENTER)
    reads[0]!.resolve()
    await settle()

    fireChange()
    expect(reads).toHaveLength(2)
    expect(reads[1]!.chunks.map((chunk) => chunk.start)).toEqual(
      reads[0]!.chunks.map((chunk) => chunk.start),
    )
    const pending = store.getSnapshot().chunks.get(chunkOfPage(WEEKS, CENTER))
    expect(pending).toMatchObject({ status: "ready", stale: true })
    expect(page(CENTER).events).toHaveLength(1)

    reads[1]!.resolve(() => [])
    await settle()
    expect(page(CENTER)).toMatchObject({ status: "ready", events: [] })
    expect(
      store.getSnapshot().chunks.get(chunkOfPage(WEEKS, CENTER))?.stale,
    ).toBe(false)

    disconnect()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it("re-reads resident chunks when it reconnects", async () => {
    const { store, reads } = setup()
    store.ensure(WEEKS, CENTER)
    reads[0]!.resolve()
    await settle()
    store.connect()
    expect(reads).toHaveLength(2)
    store.invalidate()
    expect(reads).toHaveLength(3)
  })

  it("ignores database changes and invalidation with nothing resident", () => {
    const { store, reads, emitted, fireChange } = setup()
    store.connect()
    fireChange()
    store.invalidate()
    expect(reads).toHaveLength(0)
    expect(emitted).not.toHaveBeenCalled()
  })

  it("reports a failed first read as an error page and retries it", async () => {
    const { store, reads, page } = setup()
    store.ensure(WEEKS, CENTER)
    store.ensure(WEEKS, CENTER)
    expect(reads).toHaveLength(1)
    reads[0]!.reject("disk I/O error")
    await settle()
    const failed = page(CENTER)
    expect(failed).toMatchObject({ status: "error", events: [] })
    expect(failed.error?.message).toBe("disk I/O error")

    store.ensure(WEEKS, CENTER)
    expect(reads).toHaveLength(2)
    reads[1]!.resolve()
    await settle()
    expect(page(CENTER)).toMatchObject({ status: "ready", error: undefined })
  })

  it("keeps previous rows when a re-read fails", async () => {
    const { store, reads, page } = setup()
    store.ensure(WEEKS, CENTER)
    reads[0]!.resolve()
    await settle()
    store.invalidate()
    const error = new Error("locked")
    reads[1]!.reject(error)
    await settle()
    expect(page(CENTER)).toMatchObject({ status: "ready", error })
    expect(page(CENTER).events).toHaveLength(1)

    reads[0]!.reject(new Error("stale failure"))
    await settle()
    expect(page(CENTER).error).toBe(error)
  })

  it("never overwrites visible calendars with an older read", async () => {
    const { store, reads } = setup()
    store.ensure(WEEKS, CENTER)
    store.ensure(WEEKS, FAR)
    reads[1]!.resolve()
    await settle()
    const calendars = store.getSnapshot().visibleCalendarIds
    reads[0]!.resolve()
    await settle()
    expect(store.getSnapshot().visibleCalendarIds).toBe(calendars)
  })

  it("forwards rejected-row counts", async () => {
    const { store, reads, onRejectedRows } = setup()
    store.ensure(WEEKS, CENTER)
    reads[0]!.resolve()
    await settle()
    expect(onRejectedRows).toHaveBeenCalledWith(
      "calendar-window",
      NO_REJECTIONS,
    )
  })

  it("stays bounded after 500 crossings in each direction", async () => {
    const { store, reads, page } = setup()
    const sizes: number[] = []
    for (const direction of [1, -1]) {
      for (let step = 0; step < 500; step += 1) {
        const center = CENTER + direction * step
        store.ensure(WEEKS, center)
        reads.at(-1)?.resolve()
        await settle()
        sizes.push(store.getSnapshot().chunks.size)
        expect(page(center).status).toBe("ready")
      }
    }
    expect(Math.max(...sizes)).toBeLessThanOrEqual(MAX_RESIDENT_CHUNKS)
    expect(reads.length).toBeLessThan(400)
  })

  it("ignores the result of an evicted chunk", async () => {
    const { store, reads } = setup()
    store.ensure(WEEKS, CENTER)
    store.ensure(WEEKS, FAR)
    store.ensure(WEEKS, FAR + 100)
    const evicted: ChunkStart = reads[0]!.chunks[0]!.start
    expect(store.getSnapshot().chunks.has(evicted)).toBe(false)
    reads[0]!.resolve()
    await settle()
    expect(store.getSnapshot().chunks.has(evicted)).toBe(false)
    expect(store.getSnapshot().chunks.size).toBeLessThanOrEqual(
      MAX_RESIDENT_CHUNKS,
    )
  })

  it("re-reads in the new zone, keeping previous rows, when the display zone changes", async () => {
    const { store, reads, page, emitted } = setup()
    store.ensure(WEEKS, CENTER)
    reads[0]!.resolve()
    await settle()
    const calls = emitted.mock.calls.length
    store.configure({ displayZone: "Europe/Paris", firstWeekday: 1 })
    expect(reads).toHaveLength(1)
    expect(emitted).toHaveBeenCalledTimes(calls)

    store.configure({ displayZone: "America/New_York", firstWeekday: 1 })
    expect(reads).toHaveLength(2)
    expect(reads[1]!.displayZone).toBe("America/New_York")
    expect(reads[1]!.chunks[0]!.from.toISOString()).toMatch(/T04:00:00.000Z$/)
    expect(page(CENTER)).toMatchObject({ status: "ready" })
    expect(store.getSnapshot().displayZone).toBe("America/New_York")
  })

  it("flushes every chunk when the first weekday changes", async () => {
    const { store, reads } = setup()
    store.ensure(WEEKS, CENTER)
    store.configure({ displayZone: "UTC", firstWeekday: 0 })
    expect(store.getSnapshot()).toMatchObject({
      displayZone: "UTC",
      firstWeekday: 0,
    })
    expect(store.getSnapshot().chunks.size).toBe(0)
    reads[0]!.resolve()
    await settle()
    expect(store.getSnapshot().chunks.size).toBe(0)
    expect(() => store.ensure(WEEKS, CENTER)).toThrow(RangeError)
  })

  it("stops notifying an unsubscribed listener", () => {
    const { store } = setup()
    const listener = jest.fn()
    const unsubscribe = store.subscribe(listener)
    unsubscribe()
    store.ensure(WEEKS, CENTER)
    expect(listener).not.toHaveBeenCalled()
  })

  it("freezes the published snapshot", async () => {
    const { store, reads } = setup()
    store.ensure(WEEKS, CENTER)
    reads[0]!.resolve()
    await settle()
    const snapshot = store.getSnapshot()
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(
      Object.isFrozen(snapshot.chunks.get(chunkOfPage(WEEKS, CENTER))),
    ).toBe(true)
  })
})

describe("selectPageEvents", () => {
  async function readyWith(
    events: readonly CalendarEvent[],
    visibleCalendarIds: readonly string[] = ["cal-1"],
  ) {
    const harness = setup({ visibleCalendarIds })
    harness.store.ensure(WEEKS, CENTER)
    harness.reads[0]!.resolve(() => events)
    await settle()
    return harness
  }

  it("applies cancellation, hidden and calendar-visibility filters", async () => {
    const at = "2026-10-01T08:00:00.000Z"
    const { page } = await readyWith([
      event("kept", at),
      event("canceled", at, { canceled: true }),
      event("hidden-uid", at),
      event("hidden-name", at, { title: "Sport" }),
      event("untitled", at, { title: undefined }),
      event("other-calendar", at, { userCalendarId: "cal-2" }),
      event("no-calendar", at, { userCalendarId: undefined }),
      event("personal", at, {
        identity: { source: "personal", uid: "personal" },
        userCalendarId: undefined,
      }),
    ])
    const filtered = page(CENTER, {
      hiddenUids: new Set(["hidden-uid"]),
      hiddenNames: new Set(["Sport"]),
    })
    expect(filtered.events.map((e) => e.identity.uid)).toEqual([
      "kept",
      "untitled",
      "personal",
    ])
  })

  it("hides synced events until visible calendars are known", () => {
    const snapshot = {
      displayZone: "UTC",
      firstWeekday: 1 as const,
      visibleCalendarIds: undefined,
      chunks: new Map([
        [
          chunkOfPage(WEEKS, CENTER),
          {
            start: chunkOfPage(WEEKS, CENTER),
            status: "ready" as const,
            stale: false,
            events: [event("synced", "2026-10-01T08:00:00.000Z")],
            checklist: new Map(),
            error: undefined,
            revision: 1,
          },
        ],
      ]),
    }
    expect(selectPageEvents(snapshot, WEEKS, CENTER, NO_FILTER).events).toEqual(
      [],
    )
  })
})
