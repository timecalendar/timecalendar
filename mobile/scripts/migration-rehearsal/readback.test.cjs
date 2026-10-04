const test = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const vm = require("node:vm")
const { tokenFor } = require("./fixtures.cjs")

function fixtureReadback() {
  const date = new Date(2026, 9, 4, 9)
  const at = (days = 0, hours = 0, minutes = 0) =>
    new Date(
      date.getTime() + days * 86400000 + hours * 3600000 + minutes * 60000,
    ).toISOString()
  const state = {
    user_calendars: [
      {
        id: "migration-fixture-calendar-0",
        token: tokenFor(0),
        name: "Synthetic calendar 0",
        visible: 1,
        school_name: null,
        school_id: null,
        last_updated_at: at(),
        created_at: at(-30),
      },
    ],
    personal_events: Array.from({ length: 5 }, (_, index) => ({
      uid: `migration-fixture-event-${index}`,
      title: `Synthetic event ${index} é 🌍`,
      color: "#ab23cd",
      starts_at: at(index),
      ends_at: at(index, 1),
      exported_at: at(),
      location: index % 2 ? "Synthetic room" : null,
      description: index % 2 ? "Synthetic description\nUnicode é 🌍" : null,
    })),
    checklist_items: Array.from({ length: 5 }, (_, index) => ({
      uuid: `migration-fixture-checklist-${index}`,
      event_uid:
        index % 2
          ? "synthetic-cached-event"
          : `migration-fixture-event-${index}`,
      content: `Synthetic checklist ${index}`,
      is_checked: index % 2 ? 0 : 1,
      order: index,
      created_at: index % 2 ? at() : null,
      updated_at: index % 2 ? at(0, 0, 1) : null,
      deleted_at: index === 4 ? at(0, 0, 2) : null,
    })),
    calendar_events: [],
    legacy_migration_run: [],
    legacy_migration_report_outbox: [],
  }
  const prefs = {
    hiddenEvents: JSON.stringify({
      uidHiddenEvents: ["synthetic-hidden-uid-0"],
      namedHiddenEvents: ["Synthetic hidden name 0"],
    }),
    theme: "dark",
    notificationIsActive: false,
    startupTab: "calendar",
    showWeekends: false,
    changelogSeenVersion: 1,
    migrationSuppressed: true,
  }
  const storage = {
    STORAGE_KEYS: new Proxy({}, { get: (_, key) => key }),
    getString: (key) => prefs[key],
    getNumber: (key) => prefs[key],
    getBoolean: (key) => prefs[key],
    has: (key) => Object.hasOwn(prefs, key),
  }
  const module = { exports: {} }
  const dependencies = {
    "./fixtures.cjs": require("./fixtures.cjs"),
    "@/db": {
      db: { all: (query) => state[/FROM (\w+)/.exec(query)[1]] },
      sql: { raw: (query) => query },
    },
    "@/storage": storage,
    "@/features/legacy-migration/data/runtime": {
      isLegacyMigrationEligible: () => true,
    },
  }
  vm.runInNewContext(readFileSync(`${__dirname}/readback.cjs`, "utf8"), {
    module,
    require: (name) => {
      assert(dependencies[name], `Unexpected dependency ${name}`)
      return dependencies[name]
    },
  })
  return { state, prefs, snapshot: module.exports.snapshot }
}

test("baseline verifies every seeded field and suppresses content in the projection", () => {
  const { snapshot } = fixtureReadback()
  const result = snapshot("SEED-A")
  assert.equal(result.allChecksPass, true)
  assert.equal(result.checks.calendarSourceFields, true)
  assert.equal(result.checks.migrationSuppressed, true)
  assert.equal(JSON.stringify(result).includes(tokenFor(0)), false)
  assert.equal(JSON.stringify(result).includes("Synthetic event"), false)
})

test("colour equality is exact and nullable school/timestamp fields are checked", () => {
  const { state, snapshot } = fixtureReadback()
  state.personal_events[0].color = "#AB23CD"
  assert.equal(snapshot().checks.personalFields, false)
  state.user_calendars[0].school_name = "SYNTHETIC_WRONG_SCHOOL"
  assert.equal(snapshot().checks.calendarSourceFields, false)
  state.user_calendars[0].school_name = null
  state.user_calendars[0].created_at = "2020-01-01T00:00:00.000Z"
  assert.equal(snapshot().checks.calendarSourceFields, false)
})

test("unknown entity identities refuse readback before any content projection", () => {
  const { state, snapshot } = fixtureReadback()
  state.user_calendars[0].id = "unknown-fixture"
  assert.throws(() => snapshot(), /Non-synthetic device state refused/)
})
