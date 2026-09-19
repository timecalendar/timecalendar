import type {
  CalendarEvent,
  DateOnlyCalendarEventV1,
  TimedCalendarEventV1,
} from "./types"

const timed: TimedCalendarEventV1 = {
  version: 1,
  kind: "timed",
  allDay: false,
  identity: { source: "synced", uid: "sync-1" },
  id: "sync-1",
  title: "Maths",
  color: "#112233",
  startsAt: new Date("2026-09-14T08:00:00.000Z"),
  endsAt: new Date("2026-09-14T09:00:00.000Z"),
  location: "B12",
  description: undefined,
  teachers: [],
  tags: [],
  canceled: false,
  userCalendarId: "cal-1",
}

const dateOnly: DateOnlyCalendarEventV1 = {
  ...timed,
  kind: "date-only",
  allDay: true,
  startDay: "2026-09-14",
  endDay: "2026-09-15",
}

describe("CalendarEvent V1", () => {
  it("keeps the discriminant, complete fields, and original identity", () => {
    const events: CalendarEvent[] = [timed, dateOnly]
    expect(
      events.map(({ version, kind, identity }) => ({
        version,
        kind,
        identity,
      })),
    ).toEqual([
      {
        version: 1,
        kind: "timed",
        identity: { source: "synced", uid: "sync-1" },
      },
      {
        version: 1,
        kind: "date-only",
        identity: { source: "synced", uid: "sync-1" },
      },
    ])
  })
})
