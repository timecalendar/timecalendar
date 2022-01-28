import { BadRequestException } from "@nestjs/common"
import { parseICS } from "node-ical"
import { EventType, FetcherCalendarEvent } from "modules/fetch/models/event"
import { assert } from "modules/shared/helpers/assert"
import { trimNewLines } from "modules/shared/helpers/trim"

const dateToUTC = (tzDate: Date): Date =>
  new Date(Date.UTC(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate()))

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
    .filter((ev) => ev.start)
    .filter((ev) => ev.type !== "VTIMEZONE")
    .map((ev) => {
      assert(ev.type === "VEVENT")

      const allDay = ev.datetype === "date"

      const event: FetcherCalendarEvent = {
        uid: ev.uid,
        title: (ev.summary || "").trim(),
        allDay: ev.datetype === "date",
        start: allDay ? dateToUTC(ev.start) : ev.start,
        end: allDay ? dateToUTC(ev.end || ev.start) : ev.end || ev.start,
        description: trimNewLines(ev.description || ""),
        location: ev.location || "",
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
