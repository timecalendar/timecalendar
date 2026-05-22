import { BadRequestException } from "@nestjs/common"
import { parseICS, ParameterValue, VEvent } from "node-ical"
import {
  EventType,
  FetcherCalendarEvent,
} from "modules/fetch/models/event.model"
import { trimNewLines } from "modules/shared/helpers/trim"

const dateToUTC = (tzDate: Date): Date =>
  new Date(Date.UTC(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate()))

/**
 * Extracts the plain text of a node-ical `ParameterValue`, which is either the
 * raw string or an object carrying ICalendar parameters (e.g. `LANGUAGE`).
 */
const paramText = (value: ParameterValue | undefined): string =>
  typeof value === "object" ? value.val : value ?? ""

/**
 * Parses a raw ICal
 * @param strIcal
 * @returns an array of FetcherCalendarEvent
 */
export const parseIcal = (strIcal: string) => {
  if (!strIcal) return []

  strIcal = strIcal.replace(/;LANGUAGE=fr/g, "")
  const raw = parseICS(strIcal)

  const events = Object.values(raw)
    .filter((ev): ev is VEvent => ev?.type === "VEVENT")
    .filter((ev) => ev.start)
    .map((ev) => {
      const allDay = ev.datetype === "date"

      const event: FetcherCalendarEvent = {
        uid: ev.uid,
        title: paramText(ev.summary).trim(),
        allDay,
        start: allDay ? dateToUTC(ev.start) : ev.start,
        end: allDay ? dateToUTC(ev.end || ev.start) : ev.end || ev.start,
        description: trimNewLines(paramText(ev.description)),
        location: paramText(ev.location),
        type: EventType.CLASS,
        teachers: [],
        tags: [],
        fields: {},
      }

      return event
    })

  if (events.length === 0) {
    throw new BadRequestException("No events found")
  }

  return events
}
