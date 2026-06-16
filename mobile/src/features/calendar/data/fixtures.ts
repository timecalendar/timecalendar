import { type CalendarEvent } from "./types"

// A committed dense-week fixture mirroring the Phase-04 spike's worst case (a
// Tuesday 5-way overlap cluster + back-to-back blocks across the week), so the
// brand surface + overlap rendering are reviewable on-device and the Maestro flow
// has a stable, reachable target with NO seeded backend (sync isn't built — D3).
//
// Anchored to the CURRENT week (Monday 00:00 local) so the events always fall in
// the visible range when the screen opens on today. The events-source seam
// (events.ts) merges + range-filters these; the sync ship removes / dev-gates the
// fixture (D3).

// Local Monday 00:00 of the week containing `ref` (Mon=0 … Sun=6).
function mondayOf(ref: Date): Date {
  const monday = new Date(ref)
  monday.setHours(0, 0, 0, 0)
  const isoWeekday = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - isoWeekday)
  return monday
}

// A weekday (0 = Monday) at HH:MM local, relative to this week's Monday.
function slot(monday: Date, dayOffset: number, hour: number, minute = 0): Date {
  const date = new Date(monday)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
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

export function denseWeekFixture(ref: Date = new Date()): CalendarEvent[] {
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

    // Wednesday — a single mid-day block.
    event(
      "fx-wed-1",
      "Project",
      COLORS.purple,
      slot(monday, 2, 14),
      slot(monday, 2, 17),
      "Lab 3",
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
