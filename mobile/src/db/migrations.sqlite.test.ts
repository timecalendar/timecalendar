/** @jest-environment node */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"

// The data-incident gate for `mobile/src/db/` (TIM-396). `migrate.test.ts` proves
// the RUNNER WIRING against the suite-wide expo-sqlite/drizzle mocks — it cannot
// prove that the committed SQL applies to a real database, because expo-sqlite has
// no off-device JS. That is not enough for a table addition: the thing that must be
// true is that the new migration applies cleanly to a database that ALREADY HAS the
// other tables WITH ROWS IN THEM, which is the upgrade every installed device takes.
//
// Node 24 (pinned by .nvmrc, the version CI runs) ships `node:sqlite`, so this file
// reads the committed `.sql` files and `meta/_journal.json` from disk and applies
// them to an in-memory DatabaseSync. It runs under the `node` test environment
// (docblock above) because the jest-expo default environment is react-native.
//
// Read from disk with `fs` rather than `import`: the `.sql` files are imported
// through a Metro transformer the app has and Jest does not.
//
// The honest boundary: this executes the committed STATEMENTS, not
// drizzle-orm/expo-sqlite/migrator's bookkeeping (that stays covered by
// migrate.test.ts and by the on-device app launch). `node:sqlite` is experimental
// on Node 24 and prints an ExperimentalWarning, which is why it is confined to this
// one file — a future Node bump can only break here.

interface JournalEntry {
  idx: number
  tag: string
}

const MIGRATIONS_DIR = join(__dirname, "migrations")

const journal = JSON.parse(
  readFileSync(join(MIGRATIONS_DIR, "meta", "_journal.json"), "utf8"),
) as { entries: JournalEntry[] }

const entries = [...journal.entries].sort((a, b) => a.idx - b.idx)

const sqlOf = (entry: JournalEntry): string =>
  readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), "utf8")

// Drizzle separates statements with `--> statement-breakpoint`; DatabaseSync.exec
// would accept the whole file, but splitting keeps a failure attributable to one
// statement.
const applyEntry = (database: DatabaseSync, entry: JournalEntry): void => {
  for (const statement of sqlOf(entry).split("--> statement-breakpoint")) {
    if (statement.trim() !== "") database.exec(statement)
  }
}

// Locate the Activity migration by scanning for the SQL that creates the table,
// NOT by a hard-coded journal index — a later migration must not silently change
// what the upgrade-path test proves.
const activityEntry = entries.find((entry) =>
  /CREATE TABLE\s+`activity_logs`/i.test(sqlOf(entry)),
)

const tableNames = (database: DatabaseSync): string[] =>
  (
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as { name: string }[]
  ).map((row) => row.name)

const indexNames = (database: DatabaseSync): string[] =>
  (
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as { name: string }[]
  ).map((row) => row.name)

const columnNames = (database: DatabaseSync, table: string): string[] =>
  (database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[])
    .map((row) => row.name)
    .sort()

let db: DatabaseSync

beforeEach(() => {
  db = new DatabaseSync(":memory:")
})

afterEach(() => {
  db.close()
})

it("has an Activity migration in the committed journal", () => {
  expect(activityEntry).toBeDefined()
})

describe("fresh install", () => {
  beforeEach(() => {
    for (const entry of entries) applyEntry(db, entry)
  })

  it("creates the Activity tables with the expected columns", () => {
    expect(tableNames(db)).toEqual(
      expect.arrayContaining(["activity_logs", "activity_state"]),
    )
    expect(columnNames(db, "activity_logs")).toEqual([
      "calendar_id",
      "calendar_name",
      "change_json",
      "created_at",
      "id",
      "updated_at",
    ])
    expect(columnNames(db, "activity_state")).toEqual([
      "id",
      "last_read_at",
      "last_successful_refresh_at",
      "older_page_complete",
      "older_page_cursor",
      "unread_count",
    ])
  })

  it("creates both Activity indexes", () => {
    expect(indexNames(db)).toEqual(
      expect.arrayContaining([
        "activity_logs_created_at_idx",
        "activity_logs_calendar_id_idx",
      ]),
    )
  })

  it("seeds no activity_state row (a missing row reads as the defaults)", () => {
    const [count] = db
      .prepare("SELECT COUNT(*) AS n FROM activity_state")
      .all() as { n: number }[]
    expect(count?.n).toBe(0)
  })
})

// The test that matters: the path a device with the app already installed takes.
describe("upgrade from an existing installed database", () => {
  const seeds: { table: string; sql: string }[] = [
    {
      table: "personal_events",
      sql: `INSERT INTO personal_events (uid, title, color, starts_at, ends_at, exported_at, location, description)
            VALUES ('pe-1', 'Study group', '#1E88E5', '2026-06-16T09:00:00.000Z', '2026-06-16T10:00:00.000Z', '2026-06-15T08:00:00.000Z', 'Library', 'Bring notes')`,
    },
    {
      table: "user_calendars",
      sql: `INSERT INTO user_calendars (id, token, name, school_name, school_id, last_updated_at, created_at, visible)
            VALUES ('cal-1', 'tok-1', 'L3 Informatique', 'Université', 'school-1', '2026-06-16T09:00:00.000Z', '2026-06-01T09:00:00.000Z', 1)`,
    },
    {
      table: "calendar_events",
      sql: `INSERT INTO calendar_events (uid, title, color, group_color, starts_at, ends_at, exported_at, location, description, all_day, teachers, tags, fields, type, user_calendar_id)
            VALUES ('ev-1', 'Algorithms', '#1E88E5', '#0D47A1', '2026-06-16T09:00:00.000Z', '2026-06-16T10:30:00.000Z', '2026-06-15T08:00:00.000Z', 'Room A1', 'Lecture', 0, '["Dr. Ada"]', '[]', NULL, 'cm', 'cal-1')`,
    },
    {
      table: "checklist_items",
      sql: `INSERT INTO checklist_items (uuid, event_uid, content, is_checked, "order", created_at, updated_at, deleted_at)
            VALUES ('ck-1', 'ev-1', 'Bring the lab coat', 0, 1, '2026-06-15T08:00:00.000Z', NULL, NULL)`,
    },
  ]

  // Everything committed BEFORE the Activity migration — i.e. the schema an
  // already-installed device is sitting on.
  const priorEntries = entries.filter((entry) => entry.idx < activityEntry!.idx)

  beforeEach(() => {
    for (const entry of priorEntries) applyEntry(db, entry)
    for (const seed of seeds) db.exec(seed.sql)
  })

  it("applies without throwing on a database that already holds rows", () => {
    expect(() => applyEntry(db, activityEntry!)).not.toThrow()
  })

  it("adds the Activity tables and indexes to the existing schema", () => {
    applyEntry(db, activityEntry!)

    expect(tableNames(db)).toEqual(
      expect.arrayContaining(["activity_logs", "activity_state"]),
    )
    expect(indexNames(db)).toEqual(
      expect.arrayContaining([
        "activity_logs_created_at_idx",
        "activity_logs_calendar_id_idx",
      ]),
    )
  })

  it("leaves every pre-existing row present and unchanged", () => {
    const before = seeds.map((seed) => ({
      table: seed.table,
      rows: db.prepare(`SELECT * FROM ${seed.table}`).all(),
    }))

    applyEntry(db, activityEntry!)

    for (const snapshot of before) {
      expect(snapshot.rows).toHaveLength(1)
      expect(db.prepare(`SELECT * FROM ${snapshot.table}`).all()).toEqual(
        snapshot.rows,
      )
    }
  })
})

describe("additive-only", () => {
  const existingTables = [
    "personal_events",
    "user_calendars",
    "calendar_events",
    "checklist_items",
  ]

  it("neither drops nor alters any pre-existing table", () => {
    const sql = sqlOf(activityEntry!)

    expect(sql).not.toMatch(/DROP\s+TABLE/i)
    for (const table of existingTables) {
      expect(sql).not.toMatch(
        new RegExp(`ALTER\\s+TABLE\\s+\`?${table}\``, "i"),
      )
    }
  })

  it("creates only the two Activity tables", () => {
    const created = [...sqlOf(activityEntry!).matchAll(/CREATE TABLE `(\w+)`/g)]
    expect(created.map((match) => match[1])).toEqual([
      "activity_logs",
      "activity_state",
    ])
  })
})
