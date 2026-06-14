import type { EventFormValues } from "./types"
import { validateEventForm } from "./validate"

// Pure validator — exhaustive branches (the 90% logic gate). No mocks needed.
function values(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    title: "Lunch",
    startsAt: new Date("2030-01-01T10:00:00.000Z"),
    endsAt: new Date("2030-01-01T11:00:00.000Z"),
    color: "#E91E63",
    location: "",
    description: "",
    ...overrides,
  }
}

describe("validateEventForm", () => {
  it("accepts a valid form", () => {
    const result = validateEventForm(values())
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it("rejects an empty title with the title-required key", () => {
    const result = validateEventForm(values({ title: "" }))
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBe("personalEvents.form.error.titleRequired")
  })

  it("rejects a whitespace-only title", () => {
    const result = validateEventForm(values({ title: "   " }))
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBe("personalEvents.form.error.titleRequired")
  })

  it("rejects an end equal to the start with the range key", () => {
    const at = new Date("2030-01-01T10:00:00.000Z")
    const result = validateEventForm(values({ startsAt: at, endsAt: at }))
    expect(result.valid).toBe(false)
    expect(result.errors.range).toBe("personalEvents.form.error.endBeforeStart")
  })

  it("rejects an end before the start", () => {
    const result = validateEventForm(
      values({
        startsAt: new Date("2030-01-01T11:00:00.000Z"),
        endsAt: new Date("2030-01-01T10:00:00.000Z"),
      }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors.range).toBe("personalEvents.form.error.endBeforeStart")
  })

  it("reports both errors together", () => {
    const at = new Date("2030-01-01T10:00:00.000Z")
    const result = validateEventForm(
      values({ title: " ", startsAt: at, endsAt: at }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
    expect(result.errors.range).toBeDefined()
  })
})
