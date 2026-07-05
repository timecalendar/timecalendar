import { customFetch } from "@/api/mutator"

import { addCalendarFromToken } from "./add-from-token"
import * as repository from "./repository"

// The import-by-token proof (ADR 030 / D2): the resolve → upsert chain, without
// the create-POST. Mocks at the customFetch mutator seam (the designed seam —
// never the network; testing.md / data.md) and the repository's upsert (the @/db
// write seam). Drives the REAL generated find-by-token resolve. Asserts success
// (GET /calendars/by-token/{token} → upsert the mapped durable row) AND that a
// resolve or upsert failure rejects (so the route surfaces an accessible failure +
// recordError on device).
jest.mock("@/api/mutator")
jest.spyOn(repository, "upsert").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockUpsert = repository.upsert as jest.Mock

const dto = {
  id: "srv-id",
  token: "e2e-smoke-calendar",
  name: "Calendrier E2E Test",
  schoolName: "My Gaming Academia",
  schoolId: "school-1",
  lastUpdatedAt: "2026-06-14T09:00:00.000Z",
  createdAt: "2026-06-10T08:00:00.000Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpsert.mockResolvedValue(undefined)
})

describe("addCalendarFromToken", () => {
  it("resolves the token and upserts the mapped durable row (no create-POST)", async () => {
    mockFetch.mockResolvedValueOnce(dto) // GET /calendars/by-token/{token}

    await addCalendarFromToken("e2e-smoke-calendar")

    // Only the resolve GET — no POST /calendars (the token is already held).
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      "/calendars/by-token/e2e-smoke-calendar",
    )
    expect(mockFetch.mock.calls[0]?.[1].method).toBe("GET")

    // The durable row is upserted, carrying the irreplaceable token + metadata.
    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const persisted = mockUpsert.mock.calls[0]?.[0]
    expect(persisted.id).toBe("srv-id")
    expect(persisted.token).toBe("e2e-smoke-calendar")
    expect(persisted.name).toBe("Calendrier E2E Test")
    expect(persisted.visible).toBe(true)
    expect(persisted.lastUpdatedAt).toBeInstanceOf(Date)
  })

  it("rejects and does not upsert when the token resolve fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("resolve boom"))

    await expect(addCalendarFromToken("e2e-smoke-calendar")).rejects.toThrow(
      "resolve boom",
    )
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it("rejects when the durable upsert fails", async () => {
    mockFetch.mockResolvedValueOnce(dto)
    mockUpsert.mockRejectedValueOnce(new Error("upsert boom"))

    await expect(addCalendarFromToken("e2e-smoke-calendar")).rejects.toThrow(
      "upsert boom",
    )
  })
})
