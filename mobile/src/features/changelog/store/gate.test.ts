import { decideChangelogGate } from "./gate"

describe("decideChangelogGate", () => {
  it("seeds an absent or malformed read without presenting", () => {
    expect(decideChangelogGate(undefined)).toEqual({ kind: "seedCurrent" })
  })

  it("presents only releases strictly newer than an older value", () => {
    expect(decideChangelogGate(3)).toMatchObject({
      kind: "present",
      releases: [{ version: 4 }],
    })
  })

  it.each([4, 5])("skips a current or future value (%d)", (version) => {
    expect(decideChangelogGate(version)).toEqual({ kind: "skip" })
  })
})
