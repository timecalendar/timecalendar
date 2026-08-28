import {
  getAllowedBackendEnvironments,
  getDefaultBackendEnvironment,
  isAllowedBackendEnvironment,
  parseBackendEnvironment,
  parseBackendEnvironmentCapability,
  parseLocalApiUrl,
  PREPROD_API_URL,
  PRODUCTION_API_URL,
  resolveBackendApiUrl,
} from "./backend-environment"

describe("backend environment capability", () => {
  it.each([
    ["development", ["local", "preprod", "production"], "local"],
    ["preview", ["preprod", "production"], "preprod"],
    ["production", ["production"], "production"],
  ] as const)(
    "resolves %s choices and default",
    (capability, choices, value) => {
      expect(parseBackendEnvironmentCapability(capability)).toBe(capability)
      expect(getAllowedBackendEnvironments(capability)).toEqual(choices)
      expect(getDefaultBackendEnvironment(capability)).toBe(value)
    },
  )

  it.each([undefined, null, "", "beta", {}, 1])(
    "fails closed for %p",
    (value) => {
      expect(parseBackendEnvironmentCapability(value)).toBe("production")
    },
  )

  it("parses selections against the current capability", () => {
    expect(parseBackendEnvironment("production", "preview")).toBe("production")
    expect(parseBackendEnvironment("local", "preview")).toBe("preprod")
    expect(parseBackendEnvironment("preprod", "production")).toBe("production")
    expect(isAllowedBackendEnvironment("local", "development")).toBe(true)
    expect(isAllowedBackendEnvironment("local", "preview")).toBe(false)
  })
})

describe("backend URL allowlist", () => {
  it("maps fixed environments to canonical owned endpoints", () => {
    expect(resolveBackendApiUrl("preprod", "https://evil.example")).toBe(
      PREPROD_API_URL,
    )
    expect(resolveBackendApiUrl("production", "http://localhost:3005")).toBe(
      PRODUCTION_API_URL,
    )
  })

  it.each([
    ["http://localhost:3005", "http://localhost:3005"],
    ["https://dev.example.test/", "https://dev.example.test"],
  ])("accepts a compiled HTTP(S) local URL", (input, expected) => {
    expect(parseLocalApiUrl(input)).toBe(expected)
    expect(resolveBackendApiUrl("local", input)).toBe(expected)
  })

  it.each([undefined, "", "localhost:3005", "ftp://example.test", "not url"])(
    "rejects invalid local URL %p and falls back to production",
    (input) => {
      expect(parseLocalApiUrl(input)).toBeUndefined()
      expect(resolveBackendApiUrl("local", input)).toBe(PRODUCTION_API_URL)
    },
  )
})
