// Mock the @/db seam: useLiveQuery returns a fixed data array; db.select().from()
// is a no-op the hook passes to it. Proves the hook maps live rows → domain (D5)
// without a real SQLite reactive query.
import { renderHook } from "@testing-library/react-native"

import { usePersonalEvents } from "./hooks"

const mockUseLiveQuery = jest.fn()

jest.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({}) }) },
  personalEvents: {},
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

describe("usePersonalEvents", () => {
  it("maps the live-query rows to domain events", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [
        {
          uid: "uid-1",
          title: "Lecture",
          color: "#E91E63",
          startsAt: "2026-06-14T09:00:00.000Z",
          endsAt: "2026-06-14T10:30:00.000Z",
          exportedAt: "2026-06-14T08:00:00.000Z",
          location: null,
          description: null,
        },
      ],
    })

    const { result } = await renderHook(() => usePersonalEvents())
    expect(result.current).toHaveLength(1)
    expect(result.current[0]?.uid).toBe("uid-1")
    expect(result.current[0]?.startsAt).toBeInstanceOf(Date)
    expect(result.current[0]?.location).toBeUndefined()
  })
})
