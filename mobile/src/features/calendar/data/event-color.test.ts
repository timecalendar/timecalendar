import { eventSurfaceColor } from "./event-color"

describe("eventSurfaceColor", () => {
  it("adds the shared tile alpha only to validated colors", () => {
    expect(eventSurfaceColor("#1e88e5")).toBe("#1e88e559")
    expect(eventSurfaceColor("invalid")).toBe("invalid")
  })
})
