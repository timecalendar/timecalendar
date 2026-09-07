import { Controller, Get, Header } from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"

export const E2E_ICAL_FIXTURE_PATH = "__e2e/ical/import.ics"
export const E2E_ICAL_EVENT_UID = "e2e-imported-lecture"
export const E2E_ICAL_EVENT_TITLE = "E2E Imported Lecture"

const icalTimestamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")

/**
 * Builds the harness-owned calendar relative to its request time. The event is
 * on the next UTC day so it remains inside Agenda's forward-only window if a
 * native job crosses midnight after importing it.
 */
export function buildE2eIcalFixture(now = new Date()): string {
  const startsAt = new Date(now)
  startsAt.setUTCDate(startsAt.getUTCDate() + 1)
  startsAt.setUTCHours(14, 0, 0, 0)

  const endsAt = new Date(startsAt)
  endsAt.setUTCHours(16, 0, 0, 0)

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TimeCalendar//E2E import fixture//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${E2E_ICAL_EVENT_UID}`,
    `DTSTAMP:${icalTimestamp(now)}`,
    `DTSTART:${icalTimestamp(startsAt)}`,
    `DTEND:${icalTimestamp(endsAt)}`,
    `SUMMARY:${E2E_ICAL_EVENT_TITLE}`,
    "LOCATION:Room E2E Import",
    "DESCRIPTION:Server-backed import fixture.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n")
}

/** Internal native-harness fixture; deliberately absent from Swagger/OpenAPI. */
@ApiExcludeController()
@Controller(E2E_ICAL_FIXTURE_PATH)
export class E2eIcalFixtureController {
  @Get()
  @Header("Content-Type", "text/calendar; charset=utf-8")
  getFixture(): string {
    return buildE2eIcalFixture()
  }
}
