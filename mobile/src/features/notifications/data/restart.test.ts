// The restart-durability proof CI *can* run: the prefs are the source of truth
// (PUT-only API, no server read-back — ADR 027), so a write MUST survive a
// process restart or the user's choice is silently lost. On-device MMKV survival
// is the inboxed manual pass; here we prove the write-then-read-back CONTRACT
// against a stateful in-memory @/storage fake (a Map-backed get/set). The Map
// lives at MODULE scope OUTSIDE the jest.mock factory and is NOT reset between
// the write and the read, standing in for the on-disk MMKV that survives a
// process restart — so after jest.resetModules() a FRESHLY-imported prefs module
// reads back exactly what the prior module wrote. Mirrors hidden-events/restart.

type Prefs = typeof import("./prefs")
const loadPrefs = (): Prefs =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./prefs") as Prefs

// The "disk": a Map<key, value> that persists across module resets.
const mockDisk = new Map<string, unknown>()

jest.mock("@/storage", () => ({
  getString: (key: string): string | undefined =>
    mockDisk.get(key) as string | undefined,
  setString: (key: string, value: string): void => {
    mockDisk.set(key, value)
  },
  getNumber: (key: string): number | undefined =>
    mockDisk.get(key) as number | undefined,
  setNumber: (key: string, value: number): void => {
    mockDisk.set(key, value)
  },
  getBoolean: (key: string): boolean | undefined =>
    mockDisk.get(key) as boolean | undefined,
  setBoolean: (key: string, value: boolean): void => {
    mockDisk.set(key, value)
  },
}))

beforeEach(() => {
  mockDisk.clear()
})

describe("notification prefs restart durability", () => {
  it("reads back prior writes through a freshly-imported prefs module", () => {
    const first = loadPrefs()
    first.setFrequency("daily")
    first.setNbDaysAhead(14)
    first.setIsActive(false)

    jest.resetModules()
    const second = loadPrefs()

    expect(second.getFrequency()).toBe("daily")
    expect(second.getNbDaysAhead()).toBe(14)
    expect(second.getIsActive()).toBe(false)
  })

  it("the persisted nbDaysAhead is the clamped value across the restart", () => {
    const first = loadPrefs()
    first.setNbDaysAhead(99)

    jest.resetModules()
    const second = loadPrefs()

    expect(second.getNbDaysAhead()).toBe(30)
    expect(mockDisk.get("notifications.nbDaysAhead")).toBe(30)
  })
})
