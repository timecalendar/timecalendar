import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { getNotificationBody } from "./fcm-notifier-calendar-changed"

describe("getNotificationBody", () => {
  it("should handle an event today", () => {
    jest
      .spyOn(Date, "now")
      .mockImplementationOnce(() => new Date("2021-09-15T06:00:00Z").valueOf())

    const event: Pick<
      CalendarEvent,
      "title" | "startsAt" | "endsAt" | "location"
    > = {
      title: "Communication",
      startsAt: new Date("2021-09-15T08:00:00Z"),
      endsAt: new Date("2021-09-15T10:00:00Z"),
      location: "A001",
    }

    const body = getNotificationBody(event)

    expect(body).toBe("Communication, aujourd’hui de 08:00 à 10:00 (A001)")
  })
})
