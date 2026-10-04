const test = require("node:test")
const assert = require("node:assert/strict")
const { createRehearsalTransport } = require("./transport.cjs")
const { tokenFor, calendarFixture } = require("./fixtures.cjs")

const api = "https://api-v2.timecalendar.app"
const post = (body) => ({ method: "POST", body: JSON.stringify(body) })

test("starts offline before any endpoint handling and never delegates", async () => {
  let calls = 0
  const transport = createRehearsalTransport(() => {
    calls++
    throw new Error("Unexpected delegation")
  })
  await assert.rejects(
    transport.fetch(`${api}/calendars/sync`, post({ tokens: [tokenFor(0)] })),
    /Synthetic offline/,
  )
  assert.equal(calls, 0)
  assert.equal(transport.status().counts.offlineFailures, 1)
})

test("matches seeded IDs, hidden courses and school-linked checklist event", async () => {
  const transport = createRehearsalTransport(() =>
    assert.fail("No production requests"),
  )
  transport.setMode("online")
  const response = await transport.fetch(
    `${api}/calendars/sync`,
    post({ tokens: [tokenFor(0), tokenFor(1), tokenFor(2)] }),
  )
  const calendars = await response.json()
  assert.equal(calendars.length, 3)
  assert.equal(calendars[0].calendar.id, "migration-fixture-calendar-0")
  const events = calendars[0].events
  assert(events.some((event) => event.uid === "synthetic-cached-event"))
  assert(events.some((event) => event.uid === "synthetic-visible-course"))
  assert.equal(
    events.filter((event) => /^synthetic-hidden-uid-/.test(event.uid)).length,
    21,
  )
  assert.equal(
    events.filter((event) => /^Synthetic hidden name /.test(event.title))
      .length,
    6,
  )
  const firstIds = events.map((event) => event.uid)
  transport.setMode("online", 2)
  const updated = await (
    await transport.fetch(
      `${api}/calendars/sync`,
      post({ tokens: [tokenFor(0)] }),
    )
  ).json()
  assert.deepEqual(
    updated[0].events.map((event) => event.uid),
    firstIds,
  )
  assert(
    updated[0].events.some(
      (event) => event.title === "Synthetic visible course revision 2",
    ),
  )
  assert.equal(transport.status().counts.syncCalls, 2)
})

test("fails closed for unknown hosts, paths and non-synthetic tokens", async () => {
  const transport = createRehearsalTransport(() =>
    assert.fail("Never forward an unknown request"),
  )
  transport.setMode("online")
  await assert.rejects(transport.fetch("https://unknown.invalid/calendar"))
  await assert.rejects(transport.fetch(`${api}/unexpected`))
  await assert.rejects(
    transport.fetch(
      `${api}/calendars/sync`,
      post({ tokens: ["SYNTHETIC_UNRECOGNIZED_TOKEN"] }),
    ),
    /Non-synthetic/,
  )
  for (const endpoint of [
    "https://api-v2.timecalendar.app/v1/migration-reports",
    "http://public.example/v1/migration-reports",
    "http://127.0.0.1:8084/contact",
    "http://127.0.0.1:8084/v1/migration-reports?token=synthetic",
  ])
    assert.throws(() => transport.setReportEndpoint(endpoint))
})

test("capture alone does not acknowledge delivery, and only explicit local forwarding can accept", async () => {
  const calls = []
  const transport = createRehearsalTransport(async (...args) => {
    calls.push(args)
    return new Response('{"accepted":true}', { status: 200 })
  })
  const report = {
    schemaVersion: 1,
    reportId: "bd3b6d49-cf22-442b-9eb0-e209227495eb",
    outcome: "success",
  }
  transport.setMode("online")
  assert.equal(
    (await transport.fetch(`${api}/v1/migration-reports`, post(report))).status,
    503,
  )
  assert.equal(calls.length, 0)
  transport.setReportEndpoint("http://127.0.0.1:8084/v1/migration-reports")
  assert.equal(
    (await transport.fetch(`${api}/v1/migration-reports`, post(report))).status,
    200,
  )
  assert.equal(calls[0][0], "http://127.0.0.1:8084/v1/migration-reports")
  assert.deepEqual(transport.status().reports, [
    {
      reportId: report.reportId,
      outcome: "success",
      attempts: 2,
      accepted: true,
    },
  ])
  assert.equal(transport.status().counts.reportsAccepted, 1)
})

test("fixture fields match the generated calendar DTO shape without unstable IDs", () => {
  const fixture = calendarFixture(0)
  assert.deepEqual(
    Object.keys(fixture.events[0]).sort(),
    [
      "type",
      "color",
      "groupColor",
      "uid",
      "title",
      "startsAt",
      "endsAt",
      "location",
      "allDay",
      "description",
      "teachers",
      "tags",
      "fields",
      "exportedAt",
    ].sort(),
  )
  assert.deepEqual(fixture, calendarFixture(0))
})

test("the isolated Metro configuration rewrites only debug app entry requests", () => {
  process.env.APP_VARIANT = "production"
  process.env.OTA_CHANNEL = "production"
  process.env.BACKEND_ENVIRONMENT_CAPABILITY = "production"
  const config = require("./metro.config.cjs")
  const rewritten = config.server.rewriteRequestUrl(
    "/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true",
  )
  assert(rewritten.startsWith("/scripts/migration-rehearsal/entry.bundle?"))
  assert(rewritten.includes("transform.routerRoot=src%2Fapp"))
  const direct = config.server.rewriteRequestUrl(
    "/scripts/migration-rehearsal/entry.bundle?platform=android&dev=true&transform.engine=hermes",
  )
  assert(direct.includes("transform.routerRoot=src%2Fapp"))
  assert(direct.includes("transform.engine=hermes"))
  assert.equal(
    config.server.rewriteRequestUrl("/assets/font.ttf"),
    "/assets/font.ttf",
  )
  assert.throws(
    () =>
      config.server.rewriteRequestUrl(
        "/node_modules/expo-router/entry.bundle?platform=ios&dev=false",
      ),
    /debug-only/,
  )
  assert.throws(
    () =>
      config.server.rewriteRequestUrl(
        "/scripts/migration-rehearsal/entry.bundle?platform=android&dev=false",
      ),
    /debug-only/,
  )
})
