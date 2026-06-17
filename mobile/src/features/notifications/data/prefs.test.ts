// The local prefs store proof: the total parsers (defaults / corrupt /
// out-of-range clamp) and the write-then-read-back through MMKV v4's built-in
// in-memory Jest mock (mirroring storage.test.ts). The restart-simulation
// (read-back across a process restart) lives in restart.test.ts with a stateful
// Map-backed @/storage fake that survives resetModules().
import { remove } from "@/storage"

import {
  getFrequency,
  getIsActive,
  getNbDaysAhead,
  setFrequency,
  setIsActive,
  setNbDaysAhead,
} from "./prefs"
import {
  NOTIFICATION_KEYS,
  parseFrequency,
  parseIsActive,
  parseNbDaysAhead,
} from "./types"

beforeEach(() => {
  remove(NOTIFICATION_KEYS.frequency)
  remove(NOTIFICATION_KEYS.nbDaysAhead)
  remove(NOTIFICATION_KEYS.isActive)
})

describe("notification pref parsers", () => {
  it("parseFrequency defaults to immediately on unset / corrupt / legacy", () => {
    expect(parseFrequency(undefined)).toBe("immediately")
    expect(parseFrequency("weekly")).toBe("immediately")
    expect(parseFrequency("")).toBe("immediately")
  })

  it("parseFrequency passes a value in the union through", () => {
    expect(parseFrequency("hourly")).toBe("hourly")
    expect(parseFrequency("daily")).toBe("daily")
    expect(parseFrequency("immediately")).toBe("immediately")
  })

  it("parseNbDaysAhead defaults to 7 on unset / NaN", () => {
    expect(parseNbDaysAhead(undefined)).toBe(7)
    expect(parseNbDaysAhead(NaN)).toBe(7)
  })

  it("parseNbDaysAhead clamps to [1,30] and floors", () => {
    expect(parseNbDaysAhead(0)).toBe(1)
    expect(parseNbDaysAhead(-5)).toBe(1)
    expect(parseNbDaysAhead(31)).toBe(30)
    expect(parseNbDaysAhead(999)).toBe(30)
    expect(parseNbDaysAhead(14.9)).toBe(14)
    expect(parseNbDaysAhead(7)).toBe(7)
  })

  it("parseIsActive defaults to true when unset", () => {
    expect(parseIsActive(undefined)).toBe(true)
    expect(parseIsActive(false)).toBe(false)
    expect(parseIsActive(true)).toBe(true)
  })
})

describe("notification prefs store (write-then-read-back)", () => {
  it("reads defaults when nothing is stored", () => {
    expect(getFrequency()).toBe("immediately")
    expect(getNbDaysAhead()).toBe(7)
    expect(getIsActive()).toBe(true)
  })

  it("round-trips frequency", () => {
    setFrequency("daily")
    expect(getFrequency()).toBe("daily")
  })

  it("round-trips and clamps nbDaysAhead on write", () => {
    setNbDaysAhead(10)
    expect(getNbDaysAhead()).toBe(10)
    setNbDaysAhead(99)
    expect(getNbDaysAhead()).toBe(30)
    setNbDaysAhead(0)
    expect(getNbDaysAhead()).toBe(1)
  })

  it("round-trips isActive", () => {
    setIsActive(false)
    expect(getIsActive()).toBe(false)
    setIsActive(true)
    expect(getIsActive()).toBe(true)
  })
})
