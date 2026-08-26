const mockPersisted = new Map<string, string>()

jest.mock("@/storage", () => ({
  getString: (key: string) => mockPersisted.get(key),
  setString: (key: string, value: string) => mockPersisted.set(key, value),
}))

describe("source-health restart durability", () => {
  beforeEach(() => {
    mockPersisted.clear()
    jest.resetModules()
  })

  it("reads the prior process snapshot after module restart", () => {
    const first = jest.requireActual<typeof import("./store")>("./store")
    first.replaceSourceHealthSnapshot({
      calendar: {
        status: "stale",
        reason: "expired_export_window",
        recoveryAction: "re_add",
        guide: null,
      },
    })

    jest.resetModules()
    const restarted = jest.requireActual<typeof import("./store")>("./store")

    expect(restarted.getSourceHealthSnapshot().calendar?.status).toBe("stale")
  })
})
