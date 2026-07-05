import { localDayKey } from "./day-key"

describe("localDayKey", () => {
  it("formats the local calendar day as zero-padded YYYY-MM-DD", () => {
    expect(localDayKey(new Date(2026, 0, 5, 9, 30))).toBe("2026-01-05")
    expect(localDayKey(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31")
  })

  it("keys a late-evening local instant on its own local day", () => {
    // 23:30 local stays on its local day (a UTC-based key could roll it forward).
    expect(localDayKey(new Date(2026, 5, 15, 23, 30))).toBe("2026-06-15")
  })
})
