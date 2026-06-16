import { eventRoute } from "./routes"

// Pure routing logic (90% data gate): BOTH kinds now open the unified event-details
// screen (ADR 024 / decision 4) — a synced event (with a userCalendarId) and a
// personal event (none) both route to /event-details/<uid>. The personal-event
// edit form is reached via the details screen's Edit header action, not the tap.
describe("eventRoute", () => {
  it("routes a synced event to the event-details screen", () => {
    expect(eventRoute("ev-1", "cal-1")).toBe("/event-details/ev-1")
  })

  it("routes a personal event (undefined userCalendarId) to the event-details screen", () => {
    expect(eventRoute("ev-2", undefined)).toBe("/event-details/ev-2")
  })

  it("routes a personal event (null userCalendarId) to the event-details screen", () => {
    expect(eventRoute("ev-3", null)).toBe("/event-details/ev-3")
  })
})
