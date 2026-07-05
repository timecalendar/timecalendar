import { eventRoute } from "./routes"

// Pure routing logic (90% data gate): BOTH kinds now open the unified event-details
// screen keyed only on the uid (ADR 024 / decision 4) — the destination no longer
// discriminates on origin. The personal-event edit form is reached via the details
// screen's Edit header action, not the tap.
describe("eventRoute", () => {
  it("routes an event to the unified event-details screen by uid", () => {
    expect(eventRoute("ev-1")).toBe("/event-details/ev-1")
  })
})
