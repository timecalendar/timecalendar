// Prove the seam's coalescing reactive read (the drop-in for drizzle's
// useLiveQuery) against a fake thenable query + a mocked expo-sqlite change
// listener. The point of the module is timing behaviour — a burst of per-row
// change events must collapse to ONE re-query, with a guaranteed re-read after the
// burst's last event — plus the empty-until-first-resolve contract three consumers
// gate on and the cancellation guard the stock hook lacks. None of that is
// observable on device off a real DB, so it is pinned here with a controllable
// query whose reads settle only when the test says so, plus real-macrotask ticks
// to fire the coalescing window.

import { act, renderHook } from "@testing-library/react-native"

import { calendarEvents } from "./schema"

// The change listener is captured through a mock-prefixed jest.fn so the hoisted
// factory may reference it; the SUT is require()d lazily (below) so its eager
// expo-sqlite import can't fire the factory before the fn is assigned.
const mockAddDatabaseChangeListener = jest.fn()

jest.mock("expo-sqlite", () => ({
  addDatabaseChangeListener: (cb: (event: { tableName: string }) => void) =>
    mockAddDatabaseChangeListener(cb),
}))

const { useLiveQuery } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./live-query") as typeof import("./live-query")

// A fake `db.select().from(table)` query: a thenable carrying `config.table`. Each
// `.then` registers a pending read that resolves (or rejects) only on settleReads,
// so a read can be left in-flight across unmount/deps changes on purpose.
interface FakeQuery {
  config: { table: unknown }
  then: (onFulfilled: (rows: unknown[]) => unknown) => Promise<void>
}

let reads = 0
let pending: (() => void)[] = []
let nextRows: unknown[] = []
let nextReject = false

function makeQuery(table: unknown = calendarEvents): FakeQuery {
  return {
    config: { table },
    then(onFulfilled) {
      reads += 1
      const rows = nextRows
      const reject = nextReject
      return new Promise<void>((resolvePromise, rejectPromise) => {
        pending.push(() => {
          if (reject) {
            rejectPromise(new Error("read failed"))
          } else {
            onFulfilled(rows)
            resolvePromise()
          }
        })
      })
    },
  }
}

// Settle every currently-pending read (flushing the resulting React state updates
// inside act + a microtask turn).
async function settleReads(): Promise<void> {
  const settlers = pending
  pending = []
  await act(async () => {
    settlers.forEach((settle) => settle())
  })
}

// The last-registered change-listener callback (the hook subscribes once per
// effect run).
function fireChange(tableName: string): void {
  const calls = mockAddDatabaseChangeListener.mock.calls
  const cb = calls.at(-1)?.[0] as (event: { tableName: string }) => void
  cb({ tableName })
}

// The hook is generic over the drizzle select type; the fake satisfies only the
// slice it touches, so cast at the single call boundary.
function render(query: FakeQuery, deps?: unknown[]) {
  return renderHook(() =>
    useLiveQuery(query as unknown as Parameters<typeof useLiveQuery>[0], deps),
  )
}

// Yield one real macrotask so the hook's trailing setTimeout(0) fires, flushing
// the resulting re-read registration inside act. (Fake timers are deliberately
// avoided — they don't compose with Testing Library's async act and corrupt the
// renderer; the coalescing window is setTimeout(0), so a real macrotask suffices.)
async function tick(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  reads = 0
  pending = []
  nextRows = []
  nextReject = false
  mockAddDatabaseChangeListener.mockReset()
  mockAddDatabaseChangeListener.mockReturnValue({ remove: jest.fn() })
})

describe("useLiveQuery (coalescing seam reactive read)", () => {
  it("starts empty with undefined updatedAt until the first read resolves", async () => {
    nextRows = [{ uid: "ev-1" }]
    const { result } = await render(makeQuery())

    // The initial read is in-flight (not yet settled) — the contract three
    // consumers gate on.
    expect(result.current.data).toEqual([])
    expect(result.current.updatedAt).toBeUndefined()
    expect(result.current.error).toBeUndefined()

    await settleReads()
    expect(result.current.data).toEqual([{ uid: "ev-1" }])
    expect(result.current.updatedAt).toBeInstanceOf(Date)
    expect(reads).toBe(1)
  })

  it("collapses a burst of change events into exactly one re-read, guaranteed after the last event", async () => {
    const { result } = await render(makeQuery())
    await settleReads() // initial read
    expect(reads).toBe(1)

    nextRows = [{ uid: "ev-9" }]
    for (let i = 0; i < 5; i += 1) fireChange("calendar_events")

    // The trailing timer is scheduled but has not fired yet (no macrotask yielded).
    expect(reads).toBe(1)

    await tick() // the single coalesced re-read runs
    await settleReads()

    // One re-read for the whole 5-event burst, reflecting the latest rows.
    expect(reads).toBe(2)
    expect(result.current.data).toEqual([{ uid: "ev-9" }])
  })

  it("ignores change events for other tables", async () => {
    await render(makeQuery())
    await settleReads()

    fireChange("personal_events")
    await tick()

    expect(reads).toBe(1) // no re-read scheduled for a non-observed table
  })

  it("does not re-read after unmount (pending trailing timer is cleared)", async () => {
    const view = await render(makeQuery())
    await settleReads()

    fireChange("calendar_events") // schedules a trailing re-read
    await view.unmount() // cleanup clears the pending timer
    await tick()

    expect(reads).toBe(1)
  })

  it("does not apply a stale in-flight read after a deps change", async () => {
    nextRows = [{ uid: "stale" }] // captured by the dep-0 read at first render
    const view = await renderHook(
      ({ dep }: { dep: number }) =>
        useLiveQuery(
          makeQuery() as unknown as Parameters<typeof useLiveQuery>[0],
          [dep],
        ),
      { initialProps: { dep: 0 } },
    )
    // Change deps before the dep-0 read resolves: tears down the dep-0 effect
    // (marking its in-flight read stale) and starts a dep-1 read on the fresh rows.
    nextRows = [{ uid: "fresh" }]
    await view.rerender({ dep: 1 }) // async: its act flushes the dep-1 effect
    expect(reads).toBe(2) // the effect re-ran → a second (fresh) read is in-flight

    // Settle both in-flight reads: the stale dep-0 read must be ignored (its effect
    // was cleaned up), only the fresh dep-1 read applies — order-independent.
    await settleReads()

    expect(view.result.current.data).toEqual([{ uid: "fresh" }])
  })

  it("surfaces a read failure through error", async () => {
    nextReject = true
    const { result } = await render(makeQuery())
    await settleReads()

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe("read failed")
  })

  it("errors when the query does not select from a table", async () => {
    const notATable = {
      then: (r: (rows: unknown[]) => unknown) => Promise.resolve(r([])),
    }
    const { result } = await renderHook(() =>
      useLiveQuery(notATable as unknown as Parameters<typeof useLiveQuery>[0]),
    )

    expect(result.current.error).toBeInstanceOf(Error)
    expect(mockAddDatabaseChangeListener).not.toHaveBeenCalled()
  })
})
