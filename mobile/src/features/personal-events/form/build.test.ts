import { newEventId, type PersonalEvent } from "@/features/personal-events/data"

import { buildEventFromForm } from "./build"
import type { EventFormValues } from "./types"

// Mock the data barrel's newEventId so create assigns a deterministic uid; the
// repository/mappers are NOT exercised here (build is pure). @/db is mocked
// suite-wide (setup-db.ts), so importing the barrel is safe.
jest.mock("@/features/personal-events/data", () => ({
  newEventId: jest.fn(() => "generated-uid"),
}))

const mockNewEventId = newEventId as jest.MockedFunction<typeof newEventId>

function values(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    title: "  Lunch  ",
    startsAt: new Date("2030-01-01T10:00:00.000Z"),
    endsAt: new Date("2030-01-01T11:00:00.000Z"),
    color: "#E91E63",
    location: "  Office  ",
    description: "  Notes  ",
    ...overrides,
  }
}

describe("buildEventFromForm", () => {
  beforeEach(() => {
    mockNewEventId.mockClear()
  })

  it("assigns a fresh uid and exportedAt ~now on create", () => {
    const before = Date.now()
    const event = buildEventFromForm(values())
    const after = Date.now()

    expect(mockNewEventId).toHaveBeenCalledTimes(1)
    expect(event.uid).toBe("generated-uid")
    expect(event.exportedAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(event.exportedAt.getTime()).toBeLessThanOrEqual(after)
  })

  it("trims string fields and passes dates + color through", () => {
    const event = buildEventFromForm(values())
    expect(event.title).toBe("Lunch")
    expect(event.location).toBe("Office")
    expect(event.description).toBe("Notes")
    expect(event.color).toBe("#E91E63")
    expect(event.startsAt.toISOString()).toBe("2030-01-01T10:00:00.000Z")
    expect(event.endsAt.toISOString()).toBe("2030-01-01T11:00:00.000Z")
  })

  it("drops empty optional fields to undefined", () => {
    const event = buildEventFromForm(
      values({ location: "   ", description: "" }),
    )
    expect(event.location).toBeUndefined()
    expect(event.description).toBeUndefined()
  })

  it("preserves the existing uid on edit and refreshes exportedAt", () => {
    const existing: PersonalEvent = {
      uid: "existing-uid",
      title: "Old",
      color: "#000000",
      startsAt: new Date("2020-01-01T00:00:00.000Z"),
      endsAt: new Date("2020-01-01T01:00:00.000Z"),
      exportedAt: new Date("2020-01-01T00:00:00.000Z"),
      location: undefined,
      description: undefined,
    }
    const before = Date.now()
    const event = buildEventFromForm(values(), existing)

    expect(mockNewEventId).not.toHaveBeenCalled()
    expect(event.uid).toBe("existing-uid")
    expect(event.exportedAt.getTime()).toBeGreaterThanOrEqual(before)
  })
})
