import { customFetch } from "@/api/mutator"
import { findAll } from "@/features/calendar-sources/data"

import {
  ACTIVITY_PAGE_LIMIT,
  checkTokenPrecondition,
  fetchActivityPage,
  readHeldCalendars,
} from "./request"

// The request layer in isolation: the held-calendar read, D6's precondition, and
// the response validation that stands between the network and SQLite.
//
// Mocked at the customFetch MUTATOR seam (testing.md / data.md), never at
// `fetch` and never at the generated module — so the REAL generated operation
// runs and its URL, method and body are the thing under assertion.
jest.mock("@/api/mutator", () => ({
  ...jest.requireActual<object>("@/api/mutator"),
  customFetch: jest.fn(),
}))
jest.mock("@/features/calendar-sources/data", () => ({ findAll: jest.fn() }))

const mockFetch = customFetch as jest.Mock
const mockFindAll = findAll as jest.Mock

const calendar = (
  id: string,
  token: string,
  visible = true,
): Record<string, unknown> => ({
  id,
  token,
  name: "L3 Informatique",
  schoolName: undefined,
  schoolId: undefined,
  lastUpdatedAt: new Date("2026-06-16T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible,
})

const response = (overrides: Record<string, unknown> = {}): unknown => ({
  items: [],
  nextCursor: null,
  asOf: "2026-06-16T12:00:00.000Z",
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe("readHeldCalendars", () => {
  it("collapses duplicate tokens but keeps every held id", async () => {
    mockFindAll.mockResolvedValue([
      calendar("cal-1", "tok-a"),
      calendar("cal-2", "tok-a"),
      calendar("cal-3", "tok-b"),
    ])

    // Deduplicating client-side is what makes D6's 1–100 precondition count the
    // same things the server's @ArrayMaxSize(100) counts.
    await expect(readHeldCalendars()).resolves.toEqual({
      tokens: ["tok-a", "tok-b"],
      heldCalendarIds: ["cal-1", "cal-2", "cal-3"],
    })
  })

  // D9. Hiding is a display preference; the ownership prune is about what the
  // device OWNS. Filtering on `visible` would drop the hidden calendar's id from
  // heldCalendarIds, and the prune would then delete its entire Activity history
  // the first time the student hid it.
  it("treats a hidden calendar as held", async () => {
    mockFindAll.mockResolvedValue([
      calendar("cal-visible", "tok-visible", true),
      calendar("cal-hidden", "tok-hidden", false),
    ])

    const held = await readHeldCalendars()

    expect(held.tokens).toEqual(["tok-visible", "tok-hidden"])
    expect(held.heldCalendarIds).toEqual(["cal-visible", "cal-hidden"])
  })

  it("reads an empty device as empty, never as an error", async () => {
    mockFindAll.mockResolvedValue([])

    await expect(readHeldCalendars()).resolves.toEqual({
      tokens: [],
      heldCalendarIds: [],
    })
  })
})

describe("checkTokenPrecondition (D6)", () => {
  it("refuses a zero-token request", () => {
    expect(checkTokenPrecondition([])).toEqual({
      ok: false,
      outcome: "no-calendars",
    })
  })

  it("refuses more tokens than the contract accepts", () => {
    const tokens = Array.from({ length: 101 }, (_, i) => `tok-${i}`)

    expect(checkTokenPrecondition(tokens)).toEqual({
      ok: false,
      outcome: "too-many-calendars",
    })
  })

  it.each([
    ["the lower bound", 1],
    ["a normal device", 3],
    ["the upper bound", 100],
  ])("allows %s", (_label, count) => {
    const tokens = Array.from({ length: count }, (_, i) => `tok-${i}`)

    expect(checkTokenPrecondition(tokens)).toEqual({ ok: true })
  })
})

describe("fetchActivityPage", () => {
  it("sends the v1 contract body through the mutator seam", async () => {
    mockFetch.mockResolvedValue(response())

    await fetchActivityPage({
      limit: ACTIVITY_PAGE_LIMIT,
      tokens: ["tok-a"],
      cursor: "cursor-2",
    })

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/v1/calendar-logs/search")
    expect(options.method).toBe("POST")
    expect(JSON.parse(options.body as string)).toEqual({
      limit: 50,
      tokens: ["tok-a"],
      cursor: "cursor-2",
    })
  })

  it("returns the validated body for a well-formed page", async () => {
    const body = response({ nextCursor: "cursor-2", unreadCount: 3 })
    mockFetch.mockResolvedValue(body)

    await expect(fetchActivityPage({ tokens: ["tok-a"] })).resolves.toEqual(
      body,
    )
  })

  // A 200 body is TYPED by the generator but arrives from the network, so the
  // declared type is a claim. `asOf` is the trusted clock for the one-year prune
  // and `unreadCount` lands in an integer column — both are validated before any
  // of this reaches a write.
  it.each([
    ["a non-object body", "not json"],
    ["a null body", null],
    ["a missing asOf", response({ asOf: undefined })],
    ["an unparseable asOf", response({ asOf: "not a date" })],
    ["a non-array items", response({ items: "nope" })],
    ["a null item", response({ items: [null] })],
    ["a scalar item", response({ items: ["nope"] })],
    ["a missing nextCursor", response({ nextCursor: undefined })],
    ["a non-string nextCursor", response({ nextCursor: 7 })],
    ["a non-numeric unreadCount", response({ unreadCount: "3" })],
  ])("rejects %s as malformed", async (_label, body) => {
    mockFetch.mockResolvedValue(body)

    await expect(fetchActivityPage({ tokens: ["tok-a"] })).resolves.toBeNull()
  })

  // Transport failures are the COORDINATOR's to classify (and, on the older
  // path, to recover from). They must not be swallowed here.
  it("propagates a transport failure rather than reporting it as malformed", async () => {
    mockFetch.mockRejectedValue(new Error("offline"))

    await expect(fetchActivityPage({ tokens: ["tok-a"] })).rejects.toThrow(
      "offline",
    )
  })
})
