import { sanitizeLog } from "./sanitize-log"

describe("sanitizeLog", () => {
  const fixtures = {
    url: "https://ade.ensea.fr/feed?token=calendar-secret",
    bearer: "Bearer abc.def.ghi",
    cookie: "cookie=session-secret",
    email: "student@example.test",
    uuid: "57d4181b-52dc-4c74-a8dd-2d3128f22471",
    opaqueId: "opaque_identifier_abcdefghijklmnopqrstuvwxyz",
  }

  it("redacts sensitive scalar values and retains a bounded upstream", () => {
    const result = sanitizeLog(Object.values(fixtures).join(" "), [
      "CalendarSyncService",
    ])

    expect(result.body).toContain("[url:ensea.fr]")
    expect(result.attributes).toEqual({ context: "CalendarSyncService" })
    for (const fixture of Object.values(fixtures)) {
      expect(result.body).not.toContain(fixture)
    }
  })

  it("drops unknown structured keys, bodies, stacks, and nested domain data", () => {
    const result = sanitizeLog({
      context: "sync",
      queue: "calendar-sync",
      body: { calendarToken: "never-export-this-token" },
      event: { title: "private event" },
      stack: "raw stack",
    })

    expect(result.body).toBe('{"context":"sync","queue":"calendar-sync"}')
    expect(result.body).not.toMatch(/never-export|private event|raw stack/)
  })

  it("extracts only an error class and sanitized message", () => {
    const result = sanitizeLog(
      new TypeError(`failed ${fixtures.url} for ${fixtures.email}`),
      ["CalendarSyncService"],
    )
    expect(result.attributes).toEqual({
      context: "CalendarSyncService",
      "error.type": "TypeError",
    })
    expect(result.body).toContain('"error.type":"TypeError"')
    expect(result.body).not.toContain(fixtures.url)
    expect(result.body).not.toContain(fixtures.email)
  })

  it("drops a raw stack passed through the Nest error signature", () => {
    const stack = "Error: private failure\n    at /srv/private/file.ts:10:2"
    const result = sanitizeLog("failed safely", [stack, "CalendarSyncService"])
    expect(result.body).toBe("failed safely")
    expect(result.body).not.toContain("/srv/private")
  })

  it("bounds depth, item count, and body length", () => {
    const deeplyNested = { context: { context: { context: { context: "x" } } } }
    const result = sanitizeLog("x".repeat(2_000), [deeplyNested])
    expect(result.body.length).toBeLessThanOrEqual(1_024)
    expect(result.body).toContain("[depth-limited]")
  })
})
