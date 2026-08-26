import { deriveApplicationInfo, readApplicationInfo } from "./application-info"

jest.mock("expo-application", () => ({
  nativeApplicationVersion: " 4.0.0 ",
  nativeBuildVersion: " 135 ",
}))

describe("application info", () => {
  it.each([
    [
      { version: " 4.0.0 ", build: " 135 " },
      { kind: "versionAndBuild", version: "4.0.0", build: "135" },
    ],
    [
      { version: "4.0.0", build: null },
      { kind: "versionOnly", version: "4.0.0" },
    ],
    [
      { version: "", build: "135" },
      { kind: "buildOnly", build: "135" },
    ],
    [{ version: "  ", build: null }, { kind: "unavailable" }],
  ])("derives a total display model from %o", (metadata, expected) => {
    expect(deriveApplicationInfo(metadata)).toEqual(expected)
  })

  it("reads and normalizes the installed native metadata", () => {
    expect(readApplicationInfo()).toEqual({
      kind: "versionAndBuild",
      version: "4.0.0",
      build: "135",
    })
  })
})
