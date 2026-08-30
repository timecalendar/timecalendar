import { sanitizeLog } from "./sanitize-log"

describe("sanitizeLog", () => {
  const calendarToken = "V1StGXR8_Z5jdHi6B-myT"
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

  it("redacts a default-length nanoid calendar token from scalar and error messages", () => {
    const scalar = sanitizeLog(`calendar ${calendarToken} failed`)
    const error = sanitizeLog(new Error(`calendar ${calendarToken} failed`))

    expect(scalar.body).toContain("[id:redacted]")
    expect(error.body).toContain("[id:redacted]")
    expect(scalar.body).not.toContain(calendarToken)
    expect(error.body).not.toContain(calendarToken)
  })

  const tokenShapes = [
    ["plain", "V1StGXR8Z5jdHi6BmyTaa"],
    ["leading hyphen", "-1StGXR8Z5jdHi6BmyTaa"],
    ["trailing hyphen", "V1StGXR8Z5jdHi6BmyTa-"],
    ["hyphen at both ends", "-1StGXR8Z5jdHi6BmyTa-"],
    ["internal hyphen", "V1StGX-8Z5jdHi6BmyTaa"],
    ["underscore", "V1StGX_8Z5jdHi6BmyTaa"],
  ] as const

  it.each(tokenShapes)(
    "redacts a calendar token with a %s by delimiter, not word boundary",
    (_shape, token) => {
      const result = sanitizeLog(`calendar ${token} failed`)

      expect(result.body).toBe("calendar [id:redacted] failed")
      expect(result.body).not.toContain(token)
    },
  )

  it.each(tokenShapes)(
    "redacts a calendar token with a %s from an entity-not-found message",
    (_shape, token) => {
      const result = sanitizeLog(
        `Could not find any entity of type "Calendar" matching: {\n    "token": "${token}"\n}`,
      )

      expect(result.body).toMatch(/\[(?:id:)?redacted\]/)
      expect(result.body).not.toContain(token)
    },
  )

  it.each(["token", "password", "secret"])(
    "redacts a JSON-serialized %s key without a stray quote",
    (key) => {
      const result = sanitizeLog(`{\n    "${key}": "abc"\n}`)

      expect(result.body).toBe(`{\n    "${key}=[redacted]\n}`)
      expect(result.body).not.toContain(`${key}"=[redacted]`)
    },
  )

  it.each([
    [
      "a short identifier",
      "user 12345 order ab12cd34",
      "user 12345 order ab12cd34",
    ],
    ["a digit run opened by a hyphen", "v=-1111111111;", "v=-[id:redacted];"],
    ["a digit run closed by a hyphen", "v=1111111111-;", "v=[id:redacted]-;"],
    [
      "an ISO-8601 timestamp",
      "at 2026-08-30T02:32:21.429Z ok",
      "at 2026-08-30T02:32:21.429Z ok",
    ],
    [
      "a 16-hex span identifier",
      "span 00f067aa0ba902b7 ok",
      "span 00f067aa0ba902b7 ok",
    ],
  ])("does not widen redaction over %s", (_case, input, expected) => {
    expect(sanitizeLog(input).body).toBe(expected)
  })

  it("keeps allow-listed structured values, redacting only the long trace id", () => {
    const result = sanitizeLog({
      school: "ENSEA",
      queue: "calendar-sync",
      action: "sync",
      "service.name": "timecalendar-server",
      "service.instance.id": "pod-1",
      span_id: "00f067aa0ba902b7",
      trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
    })

    expect(JSON.parse(result.body)).toEqual({
      school: "ENSEA",
      queue: "calendar-sync",
      action: "sync",
      "service.name": "timecalendar-server",
      "service.instance.id": "pod-1",
      span_id: "00f067aa0ba902b7",
      trace_id: "[id:redacted]",
    })
  })

  it.each([
    ["FCM token no longer registered (token suffix=…deadbeef)", "deadbeef"],
    [
      'Raw response text: {"student":"private profile","token":"short"}',
      "private profile",
    ],
    ["request body=private event contents", "private event contents"],
  ])("redacts sensitive scalar log forms: %s", (message, secret) => {
    const result = sanitizeLog(message)

    expect(result.body).not.toContain(secret)
    expect(result.body).toMatch(/\[(?:redacted|body:redacted)\]/)
  })

  it.each([
    [
      'cookie="session=super secret"; preference=private-value',
      "cookie=[redacted]",
    ],
    ["cookie=session-secret; tracking=second-secret", "cookie=[redacted]"],
    [
      "raw response body: private line one\nprivate line two",
      "[body:redacted]",
    ],
  ])("redacts the complete sensitive field in %s", (message, expected) => {
    expect(sanitizeLog(message).body).toBe(expected)
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
