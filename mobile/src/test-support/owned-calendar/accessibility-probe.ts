import type {
  CalendarEventSource,
  TimedCalendarEventV1,
} from "@/features/calendar/data"

export const ACCESSIBILITY_PROBE_ANCHOR = new Date("2026-06-15T12:00:00.000Z")

function event(
  uid: string,
  startsAt: string,
  endsAt: string,
  source: CalendarEventSource = "synced",
): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source, uid },
    id: uid,
    title: `Fixture ${uid}`,
    color: "#1E88E5",
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    location: "Room 1",
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: source === "synced" ? "fixture-calendar" : undefined,
  }
}

export function accessibilityProbeFixture(): readonly TimedCalendarEventV1[] {
  return [
    event(
      "probe-early",
      "2026-06-15T01:00:00.000Z",
      "2026-06-15T02:00:00.000Z",
    ),
    event(
      "probe-tied-b",
      "2026-06-15T10:00:00.000Z",
      "2026-06-15T11:00:00.000Z",
    ),
    event(
      "probe-tied-a",
      "2026-06-15T10:00:00.000Z",
      "2026-06-15T11:00:00.000Z",
    ),
    event(
      "probe-tied-personal",
      "2026-06-15T10:00:00.000Z",
      "2026-06-15T11:00:00.000Z",
      "personal",
    ),
    event(
      "probe-tied-short",
      "2026-06-15T10:00:00.000Z",
      "2026-06-15T10:30:00.000Z",
    ),
    event(
      "probe-overlap-a",
      "2026-06-15T11:00:00.000Z",
      "2026-06-15T12:00:00.000Z",
    ),
    event(
      "probe-overlap-b",
      "2026-06-15T11:15:00.000Z",
      "2026-06-15T12:15:00.000Z",
    ),
    event(
      "probe-tiny-a",
      "2026-06-15T12:00:00.000Z",
      "2026-06-15T12:02:00.000Z",
    ),
    event(
      "probe-tiny-b",
      "2026-06-15T12:03:00.000Z",
      "2026-06-15T12:05:00.000Z",
    ),
    event("probe-late", "2026-06-15T23:00:00.000Z", "2026-06-15T23:45:00.000Z"),
    event(
      "probe-next-date",
      "2026-06-16T01:00:00.000Z",
      "2026-06-16T02:00:00.000Z",
    ),
  ]
}
