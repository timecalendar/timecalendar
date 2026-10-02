import { renderHook } from "@testing-library/react-native"

import { useHiddenEvents } from "@/features/hidden-events/data"
import { useColorScheme } from "@/hooks/use-color-scheme"
import i18n from "@/i18n"

import type {
  CalendarWindowSnapshot,
  ChunkEntry,
  PageStatus,
} from "./calendar-window-store"
import { epochDayOfKey } from "./epoch-day"
import { resolveEventAppearance } from "./event-color"
import { pageIndexOfDay, type PageSpace } from "./page-index"
import {
  createPagePresentationCache,
  type PagePresentationEnvironment,
  type PagePresentationV1,
} from "./page-presentation"
import {
  type PagePresenterSource,
  presentPage,
  usePagePresenter,
} from "./page-presenter"
import type { TimedCalendarEventV1 } from "./types"
import { chunkOfPage } from "./window-chunks"

jest.mock("@/features/hidden-events/data", () => ({
  useHiddenEvents: jest.fn(),
}))
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}))

const mockUseHiddenEvents = useHiddenEvents as jest.Mock
const mockUseColorScheme = useColorScheme as jest.Mock

const SPACE: PageSpace = { mode: "week", firstWeekday: 1 }
const INDEX = pageIndexOfDay(SPACE, epochDayOfKey("2026-10-05"))
const CHUNK = chunkOfPage(SPACE, INDEX)

function event(uid: string, title = `Course ${uid}`): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title,
    color: "#336699",
    location: undefined,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
    startsAt: new Date("2026-10-05T08:00:00.000Z"),
    endsAt: new Date("2026-10-05T09:00:00.000Z"),
  }
}

const EVENTS = [event("a"), event("b", "Sport")]

function snapshot(
  entry?: Partial<ChunkEntry> & { status: PageStatus },
): CalendarWindowSnapshot {
  const chunks = new Map<number, ChunkEntry>()
  if (entry !== undefined) {
    chunks.set(CHUNK, {
      start: CHUNK,
      stale: false,
      events: EVENTS,
      checklist: new Map(),
      error: undefined,
      revision: 1,
      ...entry,
    })
  }
  return {
    displayZone: "UTC",
    firstWeekday: 1,
    chunks,
    visibleCalendarIds: new Set(["cal-1"]),
  }
}

const ENVIRONMENT: PagePresentationEnvironment = {
  locale: "en",
  displayZone: "UTC",
  showWeekends: true,
  scheme: "light",
  increasedContrast: false,
  localizedNoTitle: "(No title)",
  t: i18n.t,
}

function source(
  overrides: Partial<PagePresenterSource> = {},
): PagePresenterSource {
  return {
    snapshot: snapshot({ status: "ready" }),
    space: SPACE,
    filter: { hiddenUids: new Set(), hiddenNames: new Set() },
    filterRevision: 0,
    environment: ENVIRONMENT,
    cache: createPagePresentationCache(),
    ...overrides,
  }
}

const uids = (page: PagePresentationV1) =>
  page.accessibilityOrder.map((tile) => tile.identity.uid)

describe("presentPage", () => {
  it("presents a ready page's filtered tiles", () => {
    const page = presentPage(
      source({
        filter: { hiddenUids: new Set(), hiddenNames: new Set(["Sport"]) },
      }),
      INDEX,
    )
    expect(page.status).toBe("ready")
    expect(page.columns).toHaveLength(7)
    expect(uids(page)).toEqual(["a"])
  })

  it("returns the cached presentation for the same chunk revision", () => {
    const input = source()
    const first = presentPage(input, INDEX)
    expect(presentPage(input, INDEX)).toBe(first)
    expect(
      presentPage(
        { ...input, snapshot: snapshot({ status: "ready", events: [] }) },
        INDEX,
      ),
    ).toBe(first)
  })

  it.each([
    ["missing", undefined],
    ["loading", { status: "loading" as const, revision: 4 }],
  ])("draws a loading page when the chunk is %s", (_name, entry) => {
    const page = presentPage(source({ snapshot: snapshot(entry) }), INDEX)
    expect(page.status).toBe("loading")
    expect(page.columns).toHaveLength(7)
    expect(page.columns.every((column) => column.tiles.length === 0)).toBe(true)
  })

  it("draws an error page without tiles", () => {
    const page = presentPage(
      source({
        snapshot: snapshot({ status: "error", error: new Error("read") }),
      }),
      INDEX,
    )
    expect(page.status).toBe("error")
    expect(page.accessibilityOrder).toEqual([])
  })

  it("rebuilds when the chunk's revision changes", () => {
    const input = source()
    const first = presentPage(input, INDEX)
    const next = presentPage(
      {
        ...input,
        snapshot: snapshot({
          status: "ready",
          revision: 2,
          events: [event("c")],
        }),
      },
      INDEX,
    )
    expect(next).not.toBe(first)
    expect(uids(next)).toEqual(["c"])
  })

  it("rebuilds when the filter revision changes", () => {
    const input = source()
    const first = presentPage(input, INDEX)
    const next = presentPage(
      {
        ...input,
        filter: { hiddenUids: new Set(["a"]), hiddenNames: new Set() },
        filterRevision: 1,
      },
      INDEX,
    )
    expect(next).not.toBe(first)
    expect(uids(next)).toEqual(["b"])
  })
})

describe("usePagePresenter", () => {
  const props = {
    snapshot: snapshot({ status: "ready" }),
    space: SPACE,
    locale: "en" as const,
    displayZone: "UTC",
    showWeekends: true,
  }

  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light")
    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: [],
    })
  })

  it("presents pages through one cache and advances the filter when hidden events change", async () => {
    const { result, rerender } = await renderHook(() => usePagePresenter(props))
    const first = result.current(INDEX)
    expect(uids(first)).toEqual(["a", "b"])
    expect(first.accessibilityOrder[0]?.appearance).toEqual(
      resolveEventAppearance({
        color: "#336699",
        scheme: "light",
        increasedContrast: false,
      }),
    )

    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: [],
    })
    await rerender({})
    expect(result.current(INDEX)).toBe(first)

    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: ["a"],
      namedHiddenEvents: [],
    })
    await rerender({})
    const hidden = result.current(INDEX)
    expect(hidden).not.toBe(first)
    expect(uids(hidden)).toEqual(["b"])

    mockUseHiddenEvents.mockReturnValue({
      uidHiddenEvents: [],
      namedHiddenEvents: [],
    })
    await rerender({})
    const shown = result.current(INDEX)
    expect(shown).not.toBe(first)
    expect(uids(shown)).toEqual(["a", "b"])
  })

  it("presents tiles in the dark scheme", async () => {
    mockUseColorScheme.mockReturnValue("dark")
    const { result } = await renderHook(() => usePagePresenter(props))
    const appearance = result.current(INDEX).accessibilityOrder[0]?.appearance
    expect(appearance).toEqual(
      resolveEventAppearance({
        color: "#336699",
        scheme: "dark",
        increasedContrast: false,
      }),
    )
    expect(appearance).not.toEqual(
      resolveEventAppearance({
        color: "#336699",
        scheme: "light",
        increasedContrast: false,
      }),
    )
  })
})
