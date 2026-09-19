import type { calendarEvents, personalEvents } from "@/db"

import { decodePersonalEventRows, decodeSyncedEventRows } from "./event-decoder"

type SyncedRow = typeof calendarEvents.$inferSelect
type PersonalRow = typeof personalEvents.$inferSelect

function synced(overrides: Partial<SyncedRow> = {}): SyncedRow {
  return {
    uid: "sync-1",
    title: "Maths",
    color: "#112233",
    groupColor: "#112233",
    startsAt: "2026-09-14T08:00:00.000Z",
    endsAt: "2026-09-14T09:00:00.000Z",
    exportedAt: "2026-09-13T08:00:00.000Z",
    location: " B12 ",
    description: null,
    allDay: false,
    teachers: '["Ada", 42, " "]',
    tags: '[{"name":"CM"},null,{"name":" "}]',
    fields: '{"canceled":true}',
    type: "cm",
    userCalendarId: "cal-1",
    ...overrides,
  }
}

function personal(overrides: Partial<PersonalRow> = {}): PersonalRow {
  return {
    uid: "personal-1",
    title: "Study",
    color: "invalid",
    startsAt: "2026-09-14T10:00:00.000Z",
    endsAt: "2026-09-14T11:00:00.000Z",
    exportedAt: "2026-09-13T08:00:00.000Z",
    location: " ",
    description: " Notes ",
    ...overrides,
  }
}

describe("calendar event row decoders", () => {
  it("decodes timed, date-only, and personal rows without mutating them", () => {
    const timed = synced()
    const allDay = synced({
      uid: "day-1",
      allDay: true,
      startsAt: "2026-09-14T00:00:00.000Z",
      endsAt: "2026-09-16T00:00:00.000Z",
      fields: '{"canceled":"yes"}',
    })
    const before = JSON.stringify([timed, allDay])
    const decoded = decodeSyncedEventRows([timed, allDay])

    expect(JSON.stringify([timed, allDay])).toBe(before)
    expect(decoded.rejectedCounts).toEqual({
      "invalid-identity": 0,
      "invalid-start": 0,
      "invalid-end": 0,
      "non-positive-range": 0,
      "invalid-date-range": 0,
    })
    expect(decoded.accepted[0]).toMatchObject({
      version: 1,
      kind: "timed",
      identity: { source: "synced", uid: "sync-1" },
      location: "B12",
      teachers: ["Ada"],
      tags: ["CM"],
      canceled: true,
    })
    expect(decoded.accepted[1]).toMatchObject({
      kind: "date-only",
      startDay: "2026-09-14",
      endDay: "2026-09-16",
      canceled: false,
    })
    expect(decodePersonalEventRows([personal()]).accepted[0]).toMatchObject({
      identity: { source: "personal", uid: "personal-1" },
      color: "#64748B",
      location: undefined,
      description: "Notes",
    })
  })

  it("isolates every required-field rejection while retaining valid siblings", () => {
    const syncedResult = decodeSyncedEventRows([
      synced(),
      synced({ uid: " " }),
      synced({ uid: "bad-calendar", userCalendarId: "" }),
      synced({ uid: "bad-start", startsAt: "nope" }),
      synced({ uid: "bad-end", endsAt: "nope" }),
      synced({
        uid: "instant",
        endsAt: "2026-09-14T08:00:00.000Z",
      }),
      synced({
        uid: "bad-day",
        allDay: true,
        startsAt: "2026-09-14T01:00:00.000Z",
      }),
      synced({
        uid: "backwards-day",
        allDay: true,
        endsAt: "2026-09-13T00:00:00.000Z",
      }),
    ])

    expect(syncedResult.accepted.map((event) => event.id)).toEqual(["sync-1"])
    expect(syncedResult.rejectedCounts).toEqual({
      "invalid-identity": 2,
      "invalid-start": 1,
      "invalid-end": 1,
      "non-positive-range": 1,
      "invalid-date-range": 2,
    })

    const personalResult = decodePersonalEventRows([
      personal(),
      personal({ uid: "" }),
      personal({ uid: "bad-start", startsAt: "bad" }),
      personal({ uid: "bad-end", endsAt: "bad" }),
      personal({
        uid: "bad-range",
        endsAt: "2026-09-14T10:00:00.000Z",
      }),
    ])
    expect(personalResult.accepted).toHaveLength(1)
    expect(personalResult.rejectedCounts).toMatchObject({
      "invalid-identity": 1,
      "invalid-start": 1,
      "invalid-end": 1,
      "non-positive-range": 1,
    })
  })

  it("totally narrows corrupt optional JSON and strings", () => {
    const result = decodeSyncedEventRows([
      synced({
        color: "bad",
        location: 42 as unknown as string,
        description: " ",
        teachers: "{",
        tags: '[42,{}, {"name": 5}]',
        fields: "42",
      }),
      synced({
        uid: "sync-2",
        teachers: "{}",
        tags: "{}",
        fields: "{",
      }),
    ])
    expect(result.accepted).toHaveLength(2)
    expect(result.accepted[0]).toMatchObject({
      color: "#64748B",
      location: undefined,
      description: undefined,
      teachers: [],
      tags: [],
      canceled: false,
    })
    expect(result.accepted[1]).toMatchObject({
      teachers: [],
      tags: [],
      canceled: false,
    })
  })

  it("rejects non-string dates and defaults non-string JSON and titles", () => {
    const syncedResult = decodeSyncedEventRows([
      synced({ startsAt: null as unknown as string }),
      synced({ uid: "bad-end", endsAt: 42 as unknown as string }),
      synced({
        uid: "defaults",
        title: null as unknown as string,
        teachers: null as unknown as string,
        tags: null as unknown as string,
        fields: null,
      }),
    ])
    expect(syncedResult.accepted[0]).toMatchObject({
      id: "defaults",
      title: "",
      teachers: [],
      tags: [],
      canceled: false,
    })
    expect(syncedResult.rejectedCounts).toMatchObject({
      "invalid-start": 1,
      "invalid-end": 1,
    })

    const personalResult = decodePersonalEventRows([
      personal({ startsAt: null as unknown as string }),
      personal({ uid: "bad-end", endsAt: null as unknown as string }),
      personal({ uid: "defaults", title: null as unknown as string }),
    ])
    expect(personalResult.accepted[0]).toMatchObject({
      id: "defaults",
      title: "",
    })
    expect(personalResult.rejectedCounts).toMatchObject({
      "invalid-start": 1,
      "invalid-end": 1,
    })
  })
})
