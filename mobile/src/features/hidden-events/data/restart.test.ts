// The central durability proof CI *can* run (the hidden set is IRREPLACEABLE — no
// server backup). On-device MMKV survival across restart/kill/cache-clear is the
// inboxed manual pass; here we prove the store's write-then-read-back CONTRACT
// against a stateful in-memory @/storage fake (a Map-backed getString/setString).
// The Map lives at MODULE scope OUTSIDE the jest.mock factory and is NOT reset
// between the write and the read, standing in for the on-disk MMKV that survives a
// process restart — so after jest.resetModules() a FRESHLY-imported store module
// reads back exactly what the prior module wrote. Mirrors the user-calendars
// restart proof. Spy state is `mock`-prefixed so the hoisted factory may reference
// it.

type Store = typeof import("./store")
const loadStore = (): Store =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./store") as Store

// The "disk": a Map<key, value> that persists across module resets.
const mockDisk = new Map<string, string>()

jest.mock("@/storage", () => ({
  getString: (key: string): string | undefined => mockDisk.get(key),
  setString: (key: string, value: string): void => {
    mockDisk.set(key, value)
  },
}))

beforeEach(() => {
  mockDisk.clear()
})

describe("hidden-events restart durability", () => {
  it("reads back a prior hide through a freshly-imported store module", () => {
    // First "session": import the store, hide an event by uid + a name.
    const first = loadStore()
    first.hideByUid("uid-1")
    first.hideByName("Algorithms")

    // Simulate a process restart: drop the module registry (a fresh handle), but
    // the "disk" (the module-scoped Map) survives — exactly what on-disk MMKV
    // gives across a real restart.
    jest.resetModules()
    const second = loadStore()

    expect(second.getHiddenEvents()).toEqual({
      uidHiddenEvents: ["uid-1"],
      namedHiddenEvents: ["Algorithms"],
    })
  })

  it("an un-hide survives a simulated restart", () => {
    const first = loadStore()
    first.hideByUid("uid-1")
    first.hideByUid("uid-2")
    first.unhideUid("uid-1")

    jest.resetModules()
    const second = loadStore()

    expect(second.getHiddenEvents().uidHiddenEvents).toEqual(["uid-2"])
  })

  it("the persisted blob is verbatim across the restart (importer fidelity)", () => {
    const first = loadStore()
    first.hideByName("Maths")

    jest.resetModules()
    const second = loadStore()

    // The freshly-imported module reads the exact Flutter-shape record.
    expect(second.getHiddenEvents()).toEqual({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Maths"],
    })
    expect(JSON.parse(mockDisk.get("hiddenEvents.set") as string)).toEqual({
      uidHiddenEvents: [],
      namedHiddenEvents: ["Maths"],
    })
  })
})
