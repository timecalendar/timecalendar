import { type CalendarEvent } from "@/features/calendar/data"

// A dense-week fixture mirroring the Phase-04 spike's worst case (a Tuesday 5-way
// overlap cluster + back-to-back blocks across the week). It is TEST-SUPPORT ONLY —
// no longer part of the runtime events-source merge (the sync ship removed it; D3).
// It survives as the overlap engine's worst-case input and the events.test.ts
// regression guard (asserting the fixture is NOT in the default merge). It lives
// under src/test-support/ (out of the production calendar/data/ tree) and is
// coverage-excluded (jest.config.js).
//
export const DENSE_WEEK_ANCHOR = new Date("2026-06-15T00:00:00.000Z")

// UTC Monday 00:00 of the week containing `ref` (Mon=0 … Sun=6).
function mondayOf(ref: Date): Date {
  const monday = new Date(ref)
  monday.setUTCHours(0, 0, 0, 0)
  const isoWeekday = (monday.getUTCDay() + 6) % 7
  monday.setUTCDate(monday.getUTCDate() - isoWeekday)
  return monday
}

// A weekday (0 = Monday) at HH:MM UTC, relative to the fixture Monday.
function slot(monday: Date, dayOffset: number, hour: number, minute = 0): Date {
  const date = new Date(monday)
  date.setUTCDate(date.getUTCDate() + dayOffset)
  date.setUTCHours(hour, minute, 0, 0)
  return date
}

const COLORS = {
  blue: "#1E88E5",
  green: "#43A047",
  orange: "#FB8C00",
  purple: "#8E24AA",
  pink: "#E91E63",
} as const

function event(
  id: string,
  title: string,
  color: string,
  startsAt: Date,
  endsAt: Date,
  location?: string,
): CalendarEvent {
  return {
    version: 1,
    kind: "timed",
    identity: { source: "synced", uid: id },
    id,
    title,
    color,
    startsAt,
    endsAt,
    location,
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
  }
}

export function denseWeekFixture(
  ref: Date = DENSE_WEEK_ANCHOR,
): CalendarEvent[] {
  const monday = mondayOf(ref)
  return [
    // Monday — back-to-back blocks (no overlap).
    event(
      "fx-mon-1",
      "Algorithms",
      COLORS.blue,
      slot(monday, 0, 8),
      slot(monday, 0, 10),
      "Room A1",
    ),
    event(
      "fx-mon-2",
      "Databases",
      COLORS.green,
      slot(monday, 0, 10),
      slot(monday, 0, 12),
      "Room B2",
    ),

    // Tuesday — the 5-way overlap cluster (the spike's worst case).
    event(
      "fx-tue-1",
      "Lecture",
      COLORS.blue,
      slot(monday, 1, 9),
      slot(monday, 1, 13),
    ),
    event(
      "fx-tue-2",
      "Lab",
      COLORS.green,
      slot(monday, 1, 9, 15),
      slot(monday, 1, 13),
    ),
    event(
      "fx-tue-3",
      "Seminar",
      COLORS.orange,
      slot(monday, 1, 9, 30),
      slot(monday, 1, 13),
    ),
    event(
      "fx-tue-4",
      "Workshop",
      COLORS.purple,
      slot(monday, 1, 9, 45),
      slot(monday, 1, 13),
    ),
    event(
      "fx-tue-5",
      "Tutorial",
      COLORS.pink,
      slot(monday, 1, 10),
      slot(monday, 1, 13),
    ),

    // Wednesday — identical bounds make a labelled 3-way cluster.
    event(
      "fx-wed-1",
      "Project",
      COLORS.purple,
      slot(monday, 2, 9),
      slot(monday, 2, 10),
      "Lab 3",
    ),
    event(
      "fx-wed-2",
      "Studio",
      COLORS.green,
      slot(monday, 2, 9),
      slot(monday, 2, 10),
    ),
    event(
      "fx-wed-3",
      "Review",
      COLORS.orange,
      slot(monday, 2, 9),
      slot(monday, 2, 10),
    ),
    event(
      "fx-wed-point",
      "Noon marker",
      COLORS.blue,
      slot(monday, 2, 12),
      slot(monday, 2, 12),
    ),
    event(
      "fx-wed-tiny",
      "Tiny target",
      COLORS.pink,
      slot(monday, 2, 12, 3),
      slot(monday, 2, 12, 5),
    ),

    // Thursday — a partial overlap (two columns).
    event(
      "fx-thu-1",
      "Math",
      COLORS.blue,
      slot(monday, 3, 8),
      slot(monday, 3, 11),
    ),
    event(
      "fx-thu-2",
      "Physics",
      COLORS.orange,
      slot(monday, 3, 10),
      slot(monday, 3, 12),
    ),

    // Friday — an early and a late block.
    event(
      "fx-fri-1",
      "Networks",
      COLORS.green,
      slot(monday, 4, 7),
      slot(monday, 4, 9),
    ),
    event(
      "fx-fri-2",
      "Security",
      COLORS.pink,
      slot(monday, 4, 18),
      slot(monday, 4, 20),
    ),
  ]
}
