import { eventRoute } from "./routes"

// Pure routing logic (90% data gate): origin-keyed — a synced event (with a
// userCalendarId) → the read-only details screen; a personal event (none) → the
// editable form.
describe("eventRoute", () => {
  it("routes a synced event to the read-only details screen", () => {
    expect(eventRoute("ev-1", "cal-1")).toBe("/event-details/ev-1")
  })

  it("routes a personal event (undefined userCalendarId) to the edit form", () => {
    expect(eventRoute("ev-2", undefined)).toBe("/personal-event-form?uid=ev-2")
  })

  it("routes a personal event (null userCalendarId) to the edit form", () => {
    expect(eventRoute("ev-3", null)).toBe("/personal-event-form?uid=ev-3")
  })
})
