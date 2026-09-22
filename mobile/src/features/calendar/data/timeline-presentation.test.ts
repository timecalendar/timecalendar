import { planCalendarThreePageRange } from "./range-plan"
import {
  buildCalendarTimelinePresentation,
  timelinePresentationUids,
} from "./timeline-presentation"
import type { CalendarEvent, TimedCalendarEventV1 } from "./types"

function event(
  uid: string,
  startsAt: string,
  endsAt: string,
  overrides: Partial<TimedCalendarEventV1> = {},
): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid },
    id: uid,
    title: uid,
    color: "#112233",
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    location: undefined,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
    ...overrides,
  }
}

const range = planCalendarThreePageRange({
  anchor: new Date("2026-09-14T12:00:00.000Z"),
  mode: "day",
  displayZone: "Europe/Paris",
  firstWeekday: 1,
  showWeekends: true,
})

describe("buildCalendarTimelinePresentation", () => {
  it("builds exactly three immutable pages and assigns complete tiles by date", () => {
    const source = event(
      "maths",
      "2026-09-14T08:00:00.000Z",
      "2026-09-14T09:00:00.000Z",
      { title: "Maths", location: "B12" },
    )
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: 7,
      events: [source],
      checklistProgress: new Map([
        ["maths", { completed: 1, total: 2, isComplete: false }],
      ]),
    })

    expect(presentation).toMatchObject({
      version: 1,
      generation: 7,
      rangeKey: range.key,
    })
    expect(presentation.pages).toHaveLength(3)
    expect(
      presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) => column.tiles),
      ),
    ).toEqual([
      expect.objectContaining({
        version: 1,
        identity: { source: "synced", uid: "maths" },
        title: "Maths",
        location: "B12",
        shape: "interval",
        appearance: {
          source: "#112233",
          surface: "#ACB2B8",
          foreground: "#000000",
          accent: "#112233",
          outline: "#112233",
          increasedContrast: false,
        },
        startMinute: 600,
        endMinute: 660,
        checklist: { completed: 1, total: 2, isComplete: false },
      }),
    ])
    expect(Object.isFrozen(presentation)).toBe(true)
    expect(Object.isFrozen(presentation.pages[1].columns)).toBe(true)
    expect(Object.isFrozen(presentation.pages[1].columns[0]?.tiles)).toBe(true)
    expect(presentation.pages[1].columns[0]?.date).not.toBe(
      range.pages[1].columns[0]?.date,
    )
    expect(source.startsAt.toISOString()).toBe("2026-09-14T08:00:00.000Z")
  })

  it("sorts with start/end/source/UID tie-breaks independent of input order", () => {
    const events = [
      event("z", "2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
      event("b", "2026-09-14T08:00:00Z", "2026-09-14T08:30:00Z"),
      event("a", "2026-09-14T08:00:00Z", "2026-09-14T08:30:00Z"),
      event("p", "2026-09-14T08:00:00Z", "2026-09-14T08:30:00Z", {
        identity: { source: "personal", uid: "p" },
        userCalendarId: undefined,
      }),
      event("early", "2026-09-14T07:00:00Z", "2026-09-14T07:30:00Z"),
    ]
    const build = (input: CalendarEvent[]) =>
      buildCalendarTimelinePresentation({
        range,
        generation: 1,
        events: input,
      }).pages[1].columns[0]!.tiles.map(
        ({ identity }) => `${identity.source}:${identity.uid}`,
      )
    expect(build(events)).toEqual([
      "synced:early",
      "personal:p",
      "synced:a",
      "synced:b",
      "synced:z",
    ])
    expect(build([...events].reverse())).toEqual(build(events))
  })

  it("excludes deferred shapes and supports an exclusive midnight end", () => {
    const dateOnly: CalendarEvent = {
      ...event("day", "2026-09-14T00:00:00Z", "2026-09-15T00:00:00Z"),
      kind: "date-only",
      allDay: true,
      startDay: "2026-09-14",
      endDay: "2026-09-15",
    }
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: 1,
      events: [
        dateOnly,
        event("spanning", "2026-09-13T21:00:00Z", "2026-09-14T01:00:00Z"),
        event("midnight", "2026-09-13T22:00:00Z", "2026-09-14T22:00:00Z"),
      ],
    })
    const tiles = presentation.pages.flatMap((page) =>
      page.columns.flatMap((column) => column.tiles),
    )
    expect(tiles.map(({ identity }) => identity.uid)).toEqual(["midnight"])
    expect(tiles[0]?.endMinute).toBe(1440)
  })

  it("returns normalized scoped UIDs and omits zero progress", () => {
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: 1,
      events: [
        event("b", "2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
        event("a", "2026-09-14T10:00:00Z", "2026-09-14T11:00:00Z"),
        event("a", "2026-09-14T12:00:00Z", "2026-09-14T13:00:00Z"),
      ],
    })
    expect(timelinePresentationUids(presentation)).toEqual(["a", "b"])
    expect(
      presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) =>
          column.tiles.map(({ checklist }) => checklist),
        ),
      ),
    ).toEqual([undefined, undefined, undefined])
  })

  it("projects a localized immutable point without changing its endpoints", () => {
    const point = event(
      "noon-point",
      "2026-09-14T10:00:00Z",
      "2026-09-14T10:00:00Z",
      { title: undefined },
    )
    const presentation = buildCalendarTimelinePresentation({
      range,
      generation: 2,
      events: [point],
      localizedNoTitle: "(Sans titre)",
      scheme: "dark",
      increasedContrast: true,
    })
    const tile = presentation.pages[1].columns[0]!.tiles[0]!
    expect(tile).toMatchObject({
      shape: "point",
      title: "(Sans titre)",
      startMinute: 720,
      endMinute: 720,
      appearance: { increasedContrast: true },
    })
    expect(tile.startsAt.getTime()).toBe(tile.endsAt.getTime())
    expect(Object.isFrozen(tile.appearance)).toBe(true)
  })
})
