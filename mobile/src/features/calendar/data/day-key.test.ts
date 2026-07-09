import { localDayKey, utcDayKey } from "./day-key"

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

describe("utcDayKey", () => {
  it("formats the UTC calendar day as zero-padded YYYY-MM-DD", () => {
    // An all-day event stored as UTC midnight keys on its UTC day in EVERY
    // timezone (the floating-date property) — read off UTC, not local fields.
    expect(utcDayKey(new Date("2026-05-25T00:00:00.000Z"))).toBe("2026-05-25")
    expect(utcDayKey(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-01-05")
  })

  it("keys the last covered day off the exclusive-end minus one millisecond", () => {
    // endsAt is the EXCLUSIVE end (05-26T00:00Z for a single May 25 all-day event);
    // endsAt − 1ms lands on the last covered UTC day.
    const exclusiveEnd = new Date("2026-05-26T00:00:00.000Z")
    expect(utcDayKey(new Date(exclusiveEnd.getTime() - 1))).toBe("2026-05-25")
  })
})
