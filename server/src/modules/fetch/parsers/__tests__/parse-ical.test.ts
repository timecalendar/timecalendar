import { readFileSync } from "fs"
import { join } from "path/posix"
import { parseIcal } from "modules/fetch/parsers/parse-ical"

describe("IcalFetcher", () => {
  describe("parseIcal", () => {
    it("should return no events for an empty file", () => {
      const events = parseIcal("")

      expect(events.length).toBe(0)
    })

    it("should parse a ICal file", () => {
      const ical = readFileSync(join(__dirname, "ical.ics"), "utf-8")

      const events = parseIcal(ical)

      expect(events).toMatchObject([
        {
          uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
          title: "Cours",
          allDay: false,
          start: new Date("2021-08-30T07:00:00.000Z"),
          end: new Date("2021-08-30T08:00:00.000Z"),
          description: "",
          location: "Paris",
          teachers: [],
          tags: [],
          fields: {},
        },
      ])
    })

    it("should parse full day events", () => {
      const ical = readFileSync(join(__dirname, "ical-allday.ics"), "utf-8")

      const events = parseIcal(ical)

      expect(events).toMatchObject([
        {
          uid: "4B9C2891-A5E1-4CA9-978F-A4F35EEA8B95",
          title: "All day event",
          allDay: true,
          start: new Date("2021-08-31T00:00:00.000Z"),
          end: new Date("2021-09-01T00:00:00.000Z"),
          description: "",
          location: "",
          teachers: [],
          tags: [],
          fields: {},
        },
      ])
    })

    it("should parse events with no information", () => {
      const ical = readFileSync(
        join(__dirname, "ical-empty-event.ics"),
        "utf-8",
      )

      const events = parseIcal(ical)

      expect(events).toMatchObject([
        {
          uid: "",
          title: "",
          allDay: false,
          start: new Date("2021-08-30T08:00:00.000Z"),
          end: new Date("2021-08-30T09:00:00.000Z"),
          description: "",
          location: "",
          teachers: [],
          tags: [],
          fields: {},
        },
      ])
    })

    it("should read properties carrying ICalendar parameters", () => {
      const ical = readFileSync(
        join(__dirname, "ical-parameterized.ics"),
        "utf-8",
      )

      const events = parseIcal(ical)

      expect(events).toMatchObject([
        {
          uid: "PARAM-EVENT-0001",
          title: "Parameterised Course",
          allDay: false,
          start: new Date("2021-08-30T07:00:00.000Z"),
          end: new Date("2021-08-30T08:00:00.000Z"),
          location: "Main Hall",
        },
      ])
    })

    it("should map a recurring event to a single entry", () => {
      const ical = readFileSync(join(__dirname, "ical-recurring.ics"), "utf-8")

      const events = parseIcal(ical)

      expect(events).toHaveLength(1)
      expect(events).toMatchObject([
        {
          uid: "RECURRING-EVENT-0001",
          title: "Weekly Lecture",
          allDay: false,
          start: new Date("2021-08-30T07:00:00.000Z"),
          end: new Date("2021-08-30T08:00:00.000Z"),
          location: "Room A",
        },
      ])
    })
  })
})
