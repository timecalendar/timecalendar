import { eventRoute } from "./routes"

// Pure routing logic (90% data gate): BOTH kinds now open the unified event-details
// screen (ADR 024 / decision 4) — a synced event and a personal event both route to
// /event-details/<uid> (the screen resolves the kind from the uid). The
// personal-event edit form is reached via the details screen's Edit header action,
// not the tap.
describe("eventRoute", () => {
  it("routes an event to the event-details screen by uid", () => {
    expect(eventRoute("ev-1")).toBe("/event-details/ev-1")
  })

  it("routes any uid to its event-details screen", () => {
    expect(eventRoute("ev-2")).toBe("/event-details/ev-2")
  })
})
