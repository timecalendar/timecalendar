import {
  bucketTimedTiles,
  timelineColumnTiles,
  type TimelineTileOptions,
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

const ZONE = "Europe/Paris"
const MONDAY = "2026-09-14"

function dayTiles(
  events: readonly CalendarEvent[],
  options: Omit<TimelineTileOptions, "displayZone"> = {},
  day = MONDAY,
) {
  return timelineColumnTiles(
    bucketTimedTiles(events, { displayZone: ZONE, ...options }),
    day,
  )
}

function allTiles(events: readonly CalendarEvent[]) {
  const tilesByDay = bucketTimedTiles(events, { displayZone: ZONE })
  return [...tilesByDay.keys()]
    .sort()
    .flatMap((day) => timelineColumnTiles(tilesByDay, day))
}

describe("timed tiles", () => {
  it("assigns complete tiles to their display-zone day without sharing the source dates", () => {
    const source = event(
      "maths",
      "2026-09-14T08:00:00.000Z",
      "2026-09-14T09:00:00.000Z",
      { title: "Maths", location: "B12" },
    )
    const tilesByDay = bucketTimedTiles([source], {
      displayZone: ZONE,
      checklistProgress: new Map([
        ["maths", { completed: 1, total: 2, isComplete: false }],
      ]),
    })

    expect([...tilesByDay.keys()]).toEqual([MONDAY])
    const tiles = timelineColumnTiles(tilesByDay, MONDAY)
    expect(tiles).toEqual([
      expect.objectContaining({
        version: 1,
        identity: { source: "synced", uid: "maths" },
        key: "synced:maths",
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
    expect(tiles[0]?.startsAt).not.toBe(source.startsAt)
    expect(tiles[0]?.identity).not.toBe(source.identity)
    expect(source.startsAt.toISOString()).toBe("2026-09-14T08:00:00.000Z")
    expect(timelineColumnTiles(tilesByDay, "2026-09-15")).toEqual([])
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
      dayTiles(input).map(
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

  it("packs a complete transitive day cluster before any viewport projection", () => {
    const events = [
      event("offscreen", "2026-09-14T04:00:00Z", "2026-09-14T09:00:00Z"),
      event("bridge", "2026-09-14T08:00:00Z", "2026-09-14T10:00:00Z"),
      event("visible", "2026-09-14T09:00:00Z", "2026-09-14T11:00:00Z"),
    ]
    const build = (ordered: CalendarEvent[]) =>
      dayTiles(ordered).map(({ identity, column, columns, startX, endX }) => ({
        uid: identity.uid,
        column,
        columns,
        startX,
        endX,
      }))

    expect(build(events)).toEqual([
      { uid: "offscreen", column: 0, columns: 2, startX: 0, endX: 0.5 },
      { uid: "bridge", column: 1, columns: 2, startX: 0.5, endX: 1 },
      { uid: "visible", column: 0, columns: 2, startX: 0, endX: 0.5 },
    ])
    expect(build([...events].reverse())).toEqual(build(events))
  })

  it("leaves point events on the full-width point path", () => {
    const tiles = dayTiles([
      event("point", "2026-09-14T08:00:00Z", "2026-09-14T08:00:00Z"),
      event("interval", "2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
    ])
    expect(tiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          identity: { source: "synced", uid: "point" },
          shape: "point",
          column: 0,
          columns: 1,
          startX: 0,
          endX: 1,
        }),
      ]),
    )
  })

  it("rejects duplicate stable identities within one civil day", () => {
    expect(() =>
      dayTiles([
        event("same", "2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
        event("same", "2026-09-14T10:00:00Z", "2026-09-14T11:00:00Z"),
      ]),
    ).toThrow("identities must be unique")
  })

  it("excludes deferred shapes and supports an exclusive midnight end", () => {
    const dateOnly: CalendarEvent = {
      ...event("day", "2026-09-14T00:00:00Z", "2026-09-15T00:00:00Z"),
      kind: "date-only",
      allDay: true,
      startDay: "2026-09-14",
      endDay: "2026-09-15",
    }
    const tiles = allTiles([
      dateOnly,
      event("spanning", "2026-09-13T21:00:00Z", "2026-09-14T01:00:00Z"),
      event("midnight", "2026-09-13T22:00:00Z", "2026-09-14T22:00:00Z"),
    ])
    expect(tiles.map(({ identity }) => identity.uid)).toEqual(["midnight"])
    expect(tiles[0]?.endMinute).toBe(1440)
  })

  it("keeps one identity on several days and omits absent progress", () => {
    const tiles = allTiles([
      event("b", "2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
      event("a", "2026-09-14T10:00:00Z", "2026-09-14T11:00:00Z"),
      event("a", "2026-09-15T12:00:00Z", "2026-09-15T13:00:00Z"),
    ])
    expect(tiles.map(({ identity }) => identity.uid)).toEqual(["b", "a", "a"])
    expect(tiles.map(({ checklist }) => checklist)).toEqual([
      undefined,
      undefined,
      undefined,
    ])
  })

  it("projects a localized point without changing its endpoints", () => {
    const point = event(
      "noon-point",
      "2026-09-14T10:00:00Z",
      "2026-09-14T10:00:00Z",
      { title: undefined },
    )
    const [tile] = dayTiles([point], {
      localizedNoTitle: "(Sans titre)",
      scheme: "dark",
      increasedContrast: true,
    })
    expect(tile).toMatchObject({
      shape: "point",
      title: "(Sans titre)",
      startMinute: 720,
      endMinute: 720,
      appearance: { increasedContrast: true },
    })
    expect(tile!.startsAt.getTime()).toBe(tile!.endsAt.getTime())
    expect(Object.isFrozen(tile!.appearance)).toBe(true)
  })

  it("falls back to the default untitled label", () => {
    const [tile] = dayTiles([
      event("untitled", "2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z", {
        title: undefined,
      }),
    ])
    expect(tile?.title).toBe("(No title)")
  })
})
