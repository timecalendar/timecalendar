import { CalendarEvent } from "modules/calendar/models/calendar-event.model"

import { buildE2eCalendarEvents } from "./seed-e2e-calendar"

// The seed's date contract, proven without a database (the builder is pure — see
// `buildE2eCalendarEvents`). What broke in run 33220510226 was arithmetic, not
// persistence: mocking the repositories would have exercised TypeORM and left the
// defect untouched.
//
// The two pinned instants are the real failure: the server seeded at 23:30Z on
// Aug 28, the iOS job reached `hidden-events.yaml` after midnight, and the agenda
// it mounted then anchored on Aug 29.
const SEED_NOW = new Date("2026-08-28T23:30:00Z")
const AFTER_MIDNIGHT = new Date("2026-08-29T00:30:00Z")

// The agenda's visible window, mirrored from
// `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`
// (`AGENDA_DAYS = 7`, `from` = the anchor day's midnight, `to` = `from` + 7 days).
// It is FORWARD-ONLY: nothing before the anchor day is reachable, which is the
// whole reason a seed-day event disappears once the device day advances. CI runs
// the server and the device in UTC end to end, so the display zone is UTC here.
const AGENDA_DAYS = 7

interface AgendaWindow {
  from: Date
  to: Date
}

function agendaWindow(observedAt: Date): AgendaWindow {
  const from = new Date(observedAt)
  from.setUTCHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setUTCDate(to.getUTCDate() + AGENDA_DAYS)
  return { from, to }
}

// Mirrors `intersectsRange` in `mobile/src/features/calendar/data/events.ts`:
// half-open, starts before the window ends and ends after it starts.
function intersects(event: CalendarEvent, window: AgendaWindow): boolean {
  return event.startsAt < window.to && event.endsAt > window.from
}

function eventByTitle(events: CalendarEvent[], title: string): CalendarEvent {
  const match = events.find((event) => event.title === title)
  if (!match) throw new Error(`No seeded event titled "${title}"`)
  return match
}

describe("buildE2eCalendarEvents", () => {
  const events = buildE2eCalendarEvents(SEED_NOW)

  it("seeds unique uids and titles", () => {
    // Both are load-bearing selectors: the flows deep-link by uid and assert by
    // title, so a duplicate would make a tap or an assertion non-deterministic.
    expect(new Set(events.map((event) => event.uid)).size).toBe(events.length)
    expect(new Set(events.map((event) => event.title)).size).toBe(events.length)
  })

  describe("the hide pair", () => {
    it("anchors E2E Hide Seminar on the UTC day after the seed run", () => {
      const seminar = eventByTitle(events, "E2E Hide Seminar")

      expect(seminar.uid).toBe("e2e-hide-seminar")
      expect(seminar.startsAt.toISOString()).toBe("2026-08-29T16:00:00.000Z")
      expect(seminar.endsAt.toISOString()).toBe("2026-08-29T18:00:00.000Z")
    })

    it("keeps the hide target in the agenda window across a UTC midnight", () => {
      const seminar = eventByTitle(events, "E2E Hide Seminar")

      expect(intersects(seminar, agendaWindow(SEED_NOW))).toBe(true)
      expect(intersects(seminar, agendaWindow(AFTER_MIDNIGHT))).toBe(true)
    })

    it("keeps the non-hidden control on the target's day and window", () => {
      // `hidden-events.yaml` waits for this event before `assertNotVisible`, so an
      // agenda that silently rendered nothing cannot pass that assertion. It only
      // does that job if it survives the same midnight the target does.
      const control = eventByTitle(events, "E2E Hide Control")

      expect(control.uid).toBe("e2e-hide-control")
      expect(control.startsAt.toISOString()).toBe("2026-08-29T14:00:00.000Z")
      expect(intersects(control, agendaWindow(SEED_NOW))).toBe(true)
      expect(intersects(control, agendaWindow(AFTER_MIDNIGHT))).toBe(true)
    })

    it("fails the rollover assertion if the target is moved back to the seed day", () => {
      // The control arm: without it, a window check that accepted everything would
      // make the two assertions above vacuous. This is the shipped-broken anchor —
      // `E2E Today Seminar` at 16:00-18:00 on the seed day — and it must NOT
      // survive the crossing.
      const seminar = eventByTitle(events, "E2E Hide Seminar")
      const onSeedDay: CalendarEvent = {
        ...seminar,
        startsAt: new Date("2026-08-28T16:00:00.000Z"),
        endsAt: new Date("2026-08-28T18:00:00.000Z"),
      }

      expect(intersects(onSeedDay, agendaWindow(SEED_NOW))).toBe(true)
      expect(intersects(onSeedDay, agendaWindow(AFTER_MIDNIGHT))).toBe(false)
    })
  })

  describe("the today cluster", () => {
    it("keeps E2E Today Lecture on the seed run's UTC day", () => {
      // `home.yaml` asserts the TODAY timeline, which no other anchor satisfies,
      // so this event does not move. Only the hide pair does.
      const lecture = eventByTitle(events, "E2E Today Lecture")

      expect(lecture.uid).toBe("e2e-today-lecture")
      expect(lecture.startsAt.toISOString()).toBe("2026-08-28T14:00:00.000Z")
      expect(lecture.endsAt.toISOString()).toBe("2026-08-28T16:00:00.000Z")
    })

    it("keeps the dense-overlap pair overlapping on the seed run's UTC day", () => {
      const overlapA = eventByTitle(events, "E2E Overlap A")
      const overlapB = eventByTitle(events, "E2E Overlap B")

      expect(overlapA.startsAt.toISOString()).toBe("2026-08-28T10:00:00.000Z")
      expect(overlapB.startsAt.toISOString()).toBe("2026-08-28T11:00:00.000Z")
      expect(overlapA.endsAt > overlapB.startsAt).toBe(true)
    })

    it("carries the recorded one-midnight exposure the hide pair no longer has", () => {
      // Recorded, not fixed: `home.yaml` cannot be satisfied by any other anchor.
      // Pinned so the asymmetry is a deliberate, visible contract rather than a
      // gap someone re-discovers from a red gate.
      const lecture = eventByTitle(events, "E2E Today Lecture")

      expect(intersects(lecture, agendaWindow(SEED_NOW))).toBe(true)
      expect(intersects(lecture, agendaWindow(AFTER_MIDNIGHT))).toBe(false)
    })
  })

  describe("the week events", () => {
    it("anchors Mon/Tue/Wed on the seed run's ISO week", () => {
      // Aug 28 2026 is a Friday, so its ISO week starts Monday Aug 24.
      expect(
        eventByTitle(events, "Cours E2E Test").startsAt.toISOString(),
      ).toBe("2026-08-24T09:00:00.000Z")
      expect(eventByTitle(events, "TD E2E Test").startsAt.toISOString()).toBe(
        "2026-08-25T14:00:00.000Z",
      )
      expect(eventByTitle(events, "TP E2E Test").startsAt.toISOString()).toBe(
        "2026-08-26T10:00:00.000Z",
      )
    })
  })

  it("rolls the month over with the day", () => {
    // `setUTCDate(getUTCDate() + 1)` is the whole next-day anchor; a month
    // boundary is where naive date arithmetic silently produces an invalid day.
    const events = buildE2eCalendarEvents(new Date("2026-08-31T23:30:00Z"))

    expect(
      eventByTitle(events, "E2E Hide Seminar").startsAt.toISOString(),
    ).toBe("2026-09-01T16:00:00.000Z")
  })
})
