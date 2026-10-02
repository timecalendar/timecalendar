import type { TFunction } from "i18next"

import { checklistProgressLabel } from "@/features/event-checklists"
import i18n from "@/i18n"

import { projectCalendarAccessibilityEntries } from "./accessibility-projection"
import {
  type AppLocale,
  formatDayHeaderParts,
  formatNarrowWeekday,
  formatTimeRange,
} from "./format"
import {
  pageColumns,
  pageIndexOfInstant,
  pageKey,
  type PageSpace,
} from "./page-index"
import {
  buildPagePresentation,
  createPagePresentationCache,
  PAGE_PRESENTATION_CACHE_SIZE,
  pagePresentationCacheKey,
  type PagePresentationEnvironment,
  type PageTileV1,
} from "./page-presentation"
import {
  bucketTimedTiles,
  type CalendarTimelinePageV1,
  timelineColumnTiles,
} from "./timeline-presentation"
import type { CalendarEvent, TimedCalendarEventV1 } from "./types"
import type { FirstWeekday } from "./week"

function event(
  uid: string,
  startsAt: string,
  minutes: number,
  overrides: Partial<TimedCalendarEventV1> = {},
): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title: `Course ${uid}`,
    color: "#336699",
    location: "B12",
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
    startsAt: new Date(startsAt),
    endsAt: new Date(new Date(startsAt).getTime() + minutes * 60_000),
    ...overrides,
  }
}

const EVENTS: readonly CalendarEvent[] = [
  event("a", "2026-10-05T08:00:00.000Z", 120),
  event("b", "2026-10-05T09:00:00.000Z", 60, { location: undefined }),
  event("c", "2026-10-05T09:30:00.000Z", 90, { title: undefined }),
  event("d", "2026-10-05T09:30:00.000Z", 0),
  event("e", "2026-10-07T12:00:00.000Z", 60, {
    identity: { source: "personal", uid: "e" },
    color: "#ffee00",
  }),
  event("f", "2026-10-10T07:00:00.000Z", 45),
  event("g", "2026-09-30T07:00:00.000Z", 45),
  event("h", "2026-10-08T16:00:00.000Z", 30),
  event("overnight", "2026-10-06T22:30:00.000Z", 180),
]
const CHECKLIST = new Map([
  ["a", { completed: 1, total: 3, isComplete: false }],
  ["e", { completed: 2, total: 2, isComplete: true }],
  ["h", { completed: 0, total: 0, isComplete: false }],
])

function environment(
  overrides: Partial<PagePresentationEnvironment> = {},
): PagePresentationEnvironment {
  return {
    locale: "en",
    displayZone: "Europe/Paris",
    showWeekends: true,
    scheme: "light",
    increasedContrast: false,
    localizedNoTitle: "(No title)",
    t: i18n.getFixedT("en"),
    ...overrides,
  }
}

function withoutLabels(tile: PageTileV1) {
  const {
    timeLabel: _time,
    accessibilityLabel: _label,
    accessibilityOrder: _order,
    ...rest
  } = tile
  return rest
}

// The tile label the owned canvas renders (renderer/owned-calendar-canvas.tsx `eventLabel`).
function canvasEventLabel(
  tile: PageTileV1,
  locale: AppLocale,
  zone: string,
  t: TFunction,
): string {
  const time = formatTimeRange(tile.startsAt, tile.endsAt, locale, zone)
  const progress = checklistProgressLabel(t, tile.checklist)
  return t(
    progress === undefined
      ? "calendar.event.label"
      : "calendar.event.labelWithProgress",
    { title: tile.title, time, location: tile.location ?? "", progress },
  )
}

function placedPage(
  space: PageSpace,
  index: number,
  env: PagePresentationEnvironment,
): CalendarTimelinePageV1 {
  const tilesByDay = bucketTimedTiles(EVENTS, {
    displayZone: env.displayZone,
    checklistProgress: CHECKLIST,
    localizedNoTitle: env.localizedNoTitle,
    scheme: env.scheme,
    increasedContrast: env.increasedContrast,
  })
  return {
    version: 1,
    direction: 0,
    key: pageKey(space, index),
    columns: pageColumns(space, index, env.displayZone, env.showWeekends).map(
      (column) => ({
        version: 1,
        ...column,
        tiles: timelineColumnTiles(tilesByDay, column.key),
      }),
    ),
  }
}

describe("buildPagePresentation matches the placed timeline tiles", () => {
  const cases: {
    name: string
    mode: "day" | "week"
    firstWeekday: FirstWeekday
    env: Partial<PagePresentationEnvironment>
    pages: readonly (readonly string[])[]
  }[] = [
    {
      name: "week, Paris, EN",
      mode: "week",
      firstWeekday: 1,
      env: {},
      pages: [["g"], ["a", "b", "d", "c", "overnight", "e", "h", "f"], []],
    },
    {
      name: "week, Sunday start, New York, FR, dark, high contrast, no weekends",
      mode: "week",
      firstWeekday: 0,
      env: {
        locale: "fr",
        displayZone: "America/New_York",
        scheme: "dark",
        increasedContrast: true,
        showWeekends: false,
        localizedNoTitle: "(Sans titre)",
        t: i18n.getFixedT("fr"),
      },
      pages: [["g"], ["a", "b", "d", "c", "overnight", "e", "h"], []],
    },
    {
      name: "day, UTC",
      mode: "day",
      firstWeekday: 1,
      env: { displayZone: "UTC" },
      pages: [[], ["a", "b", "d", "c"], []],
    },
  ]

  it.each(cases)("$name", ({ mode, firstWeekday, env: overrides, pages }) => {
    const env = environment(overrides)
    const space: PageSpace = { mode, firstWeekday }
    const anchor = new Date("2026-10-05T10:00:00.000Z")
    const center = pageIndexOfInstant(space, anchor, env.displayZone)

    pages.forEach((expectedUids, position) => {
      const index = center + position - 1
      const page = placedPage(space, index, env)
      const presentation = buildPagePresentation({
        space,
        index,
        status: "ready",
        events: EVENTS,
        checklist: CHECKLIST,
        environment: env,
      })
      expect(presentation.pageKey).toBe(pageKey(space, index))
      expect(presentation.columns.map((column) => column.key)).toEqual(
        page.columns.map((column) => column.key),
      )
      presentation.columns.forEach((column, columnIndex) => {
        const expected = page.columns[columnIndex]!
        expect(column.date).toEqual(expected.date)
        expect(column.weekday).toBe(expected.weekday)
        expect(column.isWeekend).toBe(expected.isWeekend)
        expect(column.tiles.map(withoutLabels)).toEqual(expected.tiles)

        const parts = formatDayHeaderParts(
          expected.date,
          env.locale,
          env.displayZone,
        )
        expect(column.header).toEqual({
          ...parts,
          narrowWeekday: formatNarrowWeekday(
            expected.date,
            env.locale,
            env.displayZone,
          ),
          label: `${parts.weekday} ${parts.dayOfMonth}`,
        })
        for (const tile of column.tiles) {
          expect(tile.accessibilityLabel).toContain(tile.title)
          expect(tile.timeLabel).toBe(
            formatTimeRange(
              tile.startsAt,
              tile.endsAt,
              env.locale,
              env.displayZone,
            ),
          )
          expect(tile.accessibilityLabel).toBe(
            canvasEventLabel(tile, env.locale, env.displayZone, env.t),
          )
        }
      })

      expect(
        presentation.accessibilityOrder.map((tile) => tile.identity.uid),
      ).toEqual(expectedUids)
      const expectedOrder = projectCalendarAccessibilityEntries(page).map(
        (entry) => entry.key,
      )
      expect(presentation.accessibilityOrder.map((tile) => tile.key)).toEqual(
        expectedOrder,
      )
      presentation.accessibilityOrder.forEach((tile, order) =>
        expect(tile.accessibilityOrder).toBe(order),
      )
    })
  })
})

describe("buildPagePresentation", () => {
  const space: PageSpace = { mode: "week", firstWeekday: 1 }
  const index = pageIndexOfInstant(
    space,
    new Date("2026-10-05T10:00:00.000Z"),
    "Europe/Paris",
  )

  it("formats the current EN and FR labels with checklist progress", () => {
    const en = buildPagePresentation({
      space,
      index,
      status: "ready",
      events: EVENTS,
      checklist: CHECKLIST,
      environment: environment(),
    })
    const tiles = new Map(
      en.columns
        .flatMap((column) => column.tiles)
        .map((tile) => [tile.key, tile]),
    )
    expect(tiles.get("synced:a")?.accessibilityLabel).toBe(
      "Course a, 10:00 – 12:00 B12. 1 of 3 checklist items completed",
    )
    expect(tiles.get("synced:b")?.accessibilityLabel).toBe(
      "Course b, 11:00 – 12:00 ",
    )
    expect(tiles.get("synced:c")?.title).toBe("(No title)")
    expect(tiles.get("synced:h")?.accessibilityLabel).toBe(
      "Course h, 18:00 – 18:30 B12",
    )

    const fr = buildPagePresentation({
      space,
      index,
      status: "ready",
      events: EVENTS,
      checklist: CHECKLIST,
      environment: environment({ locale: "fr", t: i18n.getFixedT("fr") }),
    })
    expect(fr.columns[0]!.header).toEqual({
      weekday: "LUN.",
      dayOfMonth: "5",
      narrowWeekday: "L",
      label: "LUN. 5",
    })
  })

  it.each(["loading", "error"] as const)(
    "draws a %s page with headers and no tiles",
    (status) => {
      const presentation = buildPagePresentation({
        space,
        index,
        status,
        events: EVENTS,
        checklist: CHECKLIST,
        environment: environment(),
      })
      expect(presentation.status).toBe(status)
      expect(presentation.columns).toHaveLength(7)
      expect(
        presentation.columns.every((column) => column.tiles.length === 0),
      ).toBe(true)
      expect(presentation.accessibilityOrder).toEqual([])
    },
  )

  it("freezes the whole presentation", () => {
    const presentation = buildPagePresentation({
      space,
      index,
      status: "ready",
      events: EVENTS,
      checklist: CHECKLIST,
      environment: environment(),
    })
    const tile = presentation.accessibilityOrder[0]!
    for (const value of [
      presentation,
      presentation.columns,
      presentation.columns[0],
      presentation.columns[0]!.header,
      presentation.columns[0]!.tiles,
      presentation.accessibilityOrder,
      tile,
      tile.identity,
      tile.appearance,
      tile.checklist,
    ]) {
      expect(Object.isFrozen(value)).toBe(true)
    }
  })
})

describe("page presentation cache", () => {
  const space: PageSpace = { mode: "week", firstWeekday: 1 }
  const { t: _t, ...keyEnvironment } = environment()

  function keyFor(index: number, rowsRevision = 1) {
    return pagePresentationCacheKey({
      pageKey: pageKey(space, index),
      status: "ready",
      rowsRevision,
      filterRevision: 0,
      environment: keyEnvironment,
    })
  }

  it("builds each page key once", () => {
    const cache = createPagePresentationCache()
    const build = jest.fn(() =>
      buildPagePresentation({
        space,
        index: 2_900,
        status: "ready",
        events: EVENTS,
        checklist: CHECKLIST,
        environment: environment(),
      }),
    )
    const first = cache.getOrCreate(keyFor(2_900), build)
    for (let i = 0; i < 10; i += 1) {
      expect(cache.getOrCreate(keyFor(2_900), build)).toBe(first)
    }
    expect(build).toHaveBeenCalledTimes(1)
    cache.getOrCreate(keyFor(2_900, 2), build)
    expect(build).toHaveBeenCalledTimes(2)
  })

  it("distinguishes every environment input in the key", () => {
    const base = keyFor(1)
    const variants = [
      { ...keyEnvironment, locale: "fr" as const },
      { ...keyEnvironment, displayZone: "UTC" },
      { ...keyEnvironment, showWeekends: false },
      { ...keyEnvironment, scheme: "dark" as const },
      { ...keyEnvironment, increasedContrast: true },
      { ...keyEnvironment, localizedNoTitle: "(Sans titre)" },
    ].map((variant) =>
      pagePresentationCacheKey({
        pageKey: pageKey(space, 1),
        status: "ready",
        rowsRevision: 1,
        filterRevision: 0,
        environment: variant,
      }),
    )
    expect(new Set([base, ...variants]).size).toBe(7)
  })

  it("stays at 16 entries after 500 crossings in each direction", () => {
    const cache = createPagePresentationCache()
    let builds = 0
    for (const direction of [1, -1]) {
      for (let step = 0; step < 500; step += 1) {
        const center = 2_900 + direction * step
        for (let offset = -2; offset <= 2; offset += 1) {
          cache.getOrCreate(keyFor(center + offset), () => {
            builds += 1
            return buildPagePresentation({
              space,
              index: center + offset,
              status: "loading",
              events: [],
              checklist: new Map(),
              environment: environment(),
            })
          })
        }
        expect(cache.size).toBeLessThanOrEqual(PAGE_PRESENTATION_CACHE_SIZE)
      }
    }
    expect(PAGE_PRESENTATION_CACHE_SIZE).toBe(16)
    expect(builds).toBeLessThan(1_100)
  })
})
