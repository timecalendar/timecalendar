/** @jest-environment node */
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { MigrationRun } from "@/db/legacy-migration"
import {
  getBoolean,
  getString,
  remove,
  setBoolean,
  setString,
  STORAGE_KEYS,
} from "@/storage"
import { migrationNativeStore } from "@/storage/migration-participants"
import {
  byteChunks,
  encodeLines,
  FIXTURE_CALENDAR,
  FIXTURE_EVENT,
  FIXTURE_HIDDEN,
  FIXTURE_ID,
  FIXTURE_TIME,
  fixtureLines,
  fixtureSource,
  legacyLine,
} from "@/test-support/legacy-fixtures"
import { openMigrationTestDatabase } from "@/test-support/migration-sqlite"

import {
  type CrashBoundary,
  createLegacyImporter,
  type EngineDependencies,
  MigrationInterruption,
} from "./engine"
import { createReportDelivery } from "./outbox"

let fixture: ReturnType<typeof openMigrationTestDatabase>
let directory: string
let path: string
let input: string
let source: ReturnType<typeof fixtureSource>
let id: number
let now: Date
let dependencies: EngineDependencies
const report = () =>
  JSON.parse(
    fixture.database
      .prepare(
        "SELECT payload_json FROM legacy_migration_report_outbox ORDER BY created_at LIMIT 1",
      )
      .get()!.payload_json as string,
  )
const rows = (table: string) =>
  fixture.database.prepare(`SELECT * FROM ${table}`).all()
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "synthetic-migration-"))
  path = join(directory, "target.db")
  fixture = openMigrationTestDatabase(path)
  for (const key of Object.values(STORAGE_KEYS)) remove(key)
  input = encodeLines(fixtureLines())
  source = fixtureSource()
  id = 0
  now = new Date(FIXTURE_TIME)
  dependencies = {
    repository: fixture.repository,
    native: migrationNativeStore,
    eligible: () => true,
    discover: jest.fn(async () => source),
    read: () => byteChunks(input),
    now: () => now,
    newId: () => `10000000-0000-4000-8000-${String(++id).padStart(12, "0")}`,
    release: {
      platform: "ios",
      targetAppVersion: "4.0.0",
      targetBuild: "200",
      osMajorVersion: 26,
    },
  }
})
afterEach(() => {
  fixture.database.close()
  rmSync(directory, { recursive: true, force: true })
})

function restart() {
  fixture.database.close()
  fixture = openMigrationTestDatabase(path)
  dependencies.repository = fixture.repository
  return createLegacyImporter(dependencies)
}

it.each([1, 2, 3])(
  "imports all approved data at v%s into actual SQLite and MMKV seam, retaining source",
  async (version) => {
    input = encodeLines(fixtureLines(version))
    const before = input
    const run = await createLegacyImporter(dependencies)()
    expect(run?.state).toBe("SETTLED_SUCCESS")
    expect(rows("user_calendars")[0]).toMatchObject({
      id: FIXTURE_ID,
      token: FIXTURE_CALENDAR.token,
      visible: 0,
      school_id: null,
    })
    expect(rows("personal_events")[0]).toMatchObject({
      title: FIXTURE_EVENT.title,
      color: "#aAbBcC",
      location: "",
      description: null,
      exported_at: FIXTURE_TIME,
    })
    expect(rows("checklist_items")[0]).toMatchObject({
      deleted_at: FIXTURE_TIME,
      event_uid: "synthetic-school-event",
    })
    expect(rows("calendar_events")).toEqual([])
    expect(rows("activity_logs")).toEqual([])
    expect(JSON.parse(getString(STORAGE_KEYS.hiddenEvents)!)).toEqual(
      FIXTURE_HIDDEN,
    )
    expect(getBoolean(STORAGE_KEYS.showWeekends)).toBe(false)
    expect(getString(STORAGE_KEYS.startupTab)).toBe("calendar")
    expect(getBoolean(STORAGE_KEYS.notificationIsActive)).toBe(false)
    expect(getBoolean(STORAGE_KEYS.migrationSuppressed)).toBe(true)
    expect(getString(STORAGE_KEYS.schoolId)).toBeUndefined()
    expect(input).toBe(before)
    expect(report()).toMatchObject({
      outcome: "success",
      calendarIds: [FIXTURE_ID],
      attemptCount: 1,
    })
    expect(JSON.stringify(report())).not.toMatch(
      /SYNTHETIC_PRIVATE|sourceFingerprint|preference_progress|🦉/,
    )
    expect(JSON.stringify(run)).not.toMatch(/SYNTHETIC_PRIVATE|🦉/)
  },
)

it.each([
  "before_journal",
  "after_journal",
  "after_parse",
  "during_sqlite",
  "after_sqlite",
  "after_native_write",
  "after_native_progress",
  "before_terminal",
  "after_terminal",
] as CrashBoundary[])(
  "converges after real SQLite close/reopen at %s",
  async (boundary) => {
    let crashed = false
    dependencies.checkpoint = (current) => {
      if (!crashed && current === boundary) {
        crashed = true
        throw new MigrationInterruption("synthetic kill")
      }
    }
    await expect(createLegacyImporter(dependencies)()).rejects.toBeInstanceOf(
      MigrationInterruption,
    )
    if (boundary === "during_sqlite") expect(rows("user_calendars")).toEqual([])
    const prior = fixture.repository.getRun()
    const result = await restart()()
    expect(result?.state).toBe("SETTLED_SUCCESS")
    expect(result?.attemptCount).toBe(
      boundary === "before_journal" || boundary === "after_terminal" ? 1 : 2,
    )
    if (prior) expect(result?.reportId).toBe(prior.reportId)
    expect(rows("user_calendars")).toHaveLength(1)
    expect(rows("personal_events")).toHaveLength(1)
    expect(rows("legacy_migration_report_outbox")).toHaveLength(1)
  },
)

it("keeps terminal state immutable, skips source discovery, and verifies native restore once", async () => {
  await createLegacyImporter(dependencies)()
  const originalReport = report()
  remove(STORAGE_KEYS.hiddenEvents)
  await restart()()
  await restart()()
  expect(dependencies.discover).toHaveBeenCalledTimes(1)
  expect(rows("legacy_migration_report_outbox")).toHaveLength(2)
  expect(report()).toEqual(originalReport)
  expect(fixture.repository.getRun()?.state).toBe("SETTLED_SUCCESS")
  expect(getString(STORAGE_KEYS.hiddenEvents)).toBeUndefined()
})

it("accepts legitimate post-import RN edits without a restore alarm", async () => {
  await createLegacyImporter(dependencies)()
  setString(STORAGE_KEYS.theme, "light")
  setBoolean(STORAGE_KEYS.showWeekends, true)
  setBoolean(STORAGE_KEYS.notificationIsActive, true)
  setString(
    STORAGE_KEYS.hiddenEvents,
    JSON.stringify({ uidHiddenEvents: [], namedHiddenEvents: [] }),
  )
  await restart()()
  expect(rows("legacy_migration_report_outbox")).toHaveLength(1)
  expect(getString(STORAGE_KEYS.theme)).toBe("light")
})

it("does not overwrite divergent RN rows, tokens or native preferences", async () => {
  fixture.database
    .prepare(
      "INSERT INTO personal_events (uid,title,color,starts_at,ends_at,exported_at) VALUES (?,?,?,?,?,?)",
    )
    .run(
      FIXTURE_EVENT.uid,
      "newer RN title",
      "#FFFFFF",
      FIXTURE_TIME,
      FIXTURE_TIME,
      FIXTURE_TIME,
    )
  fixture.database
    .prepare(
      "INSERT INTO user_calendars (id,token,name,created_at,last_updated_at,visible) VALUES (?,?,?,?,?,?)",
    )
    .run(
      "newer-id",
      FIXTURE_CALENDAR.token,
      "newer",
      FIXTURE_TIME,
      FIXTURE_TIME,
      1,
    )
  setString(STORAGE_KEYS.theme, "light")
  const before = rows("personal_events")
  const run = await createLegacyImporter(dependencies)()
  expect(run?.state).toBe("SETTLED_PARTIAL")
  expect(run?.counters.personal_events.skipped_conflict).toBe(1)
  expect(run?.counters.user_calendars.skipped_conflict).toBe(1)
  expect(run?.counters.theme.skipped_conflict).toBe(1)
  expect(rows("personal_events")).toEqual(before)
  expect(rows("user_calendars")).toHaveLength(1)
  expect(getString(STORAGE_KEYS.theme)).toBe("light")
  expect(getBoolean(STORAGE_KEYS.migrationSuppressed)).toBeUndefined()
})

it("compares decoded hidden fields, ignoring JSON formatting and key order", async () => {
  setString(
    STORAGE_KEYS.hiddenEvents,
    JSON.stringify(
      {
        namedHiddenEvents: FIXTURE_HIDDEN.namedHiddenEvents,
        uidHiddenEvents: FIXTURE_HIDDEN.uidHiddenEvents,
      },
      null,
      2,
    ),
  )
  const before = getString(STORAGE_KEYS.hiddenEvents)
  const run = await createLegacyImporter(dependencies)()
  expect(run?.counters.hidden_events.already_present).toBe(1)
  expect(run?.state).toBe("SETTLED_SUCCESS")
  expect(getString(STORAGE_KEYS.hiddenEvents)).toBe(before)
})

it("reparses a changed source on retry and preserves newer RN content", async () => {
  dependencies.checkpoint = (boundary) => {
    if (boundary === "after_sqlite") throw new MigrationInterruption()
  }
  await expect(createLegacyImporter(dependencies)()).rejects.toBeInstanceOf(
    MigrationInterruption,
  )
  input = encodeLines([
    ...fixtureLines(),
    legacyLine("personal_events", FIXTURE_EVENT.uid, {
      ...FIXTURE_EVENT,
      title: "changed source",
    }),
  ])
  delete dependencies.checkpoint
  const run = await restart()()
  expect(run?.state).toBe("SETTLED_PARTIAL")
  expect(run?.diagnostics.counts.map((entry) => entry.code)).toEqual(
    expect.arrayContaining([
      "SOURCE_CHANGED_DURING_RETRY",
      "TARGET_ID_CONFLICT",
    ]),
  )
  expect(rows("personal_events")[0]?.title).toBe(FIXTURE_EVENT.title)
})

it.each([
  "hidden_events",
  "theme",
  "current_version",
  "notification_calendar",
  "startup_screen",
  "show_weekends",
  "onboarding",
])(
  "recovers a kill after the %s native write before progress journaling",
  async (participant) => {
    dependencies.checkpoint = (boundary, dataset) => {
      if (boundary === "after_native_write" && dataset === participant)
        throw new MigrationInterruption()
    }
    await expect(createLegacyImporter(dependencies)()).rejects.toBeInstanceOf(
      MigrationInterruption,
    )
    delete dependencies.checkpoint
    const run = await restart()()
    expect(run?.state).toBe("SETTLED_SUCCESS")
    expect(run?.attemptCount).toBe(2)
  },
)

it.each([
  STORAGE_KEYS.hiddenEvents,
  STORAGE_KEYS.theme,
  STORAGE_KEYS.changelogSeenVersion,
  STORAGE_KEYS.notificationIsActive,
  STORAGE_KEYS.startupTab,
  STORAGE_KEYS.showWeekends,
  STORAGE_KEYS.migrationSuppressed,
])("settles a failure for %s independently from siblings", async (key) => {
  dependencies.native = {
    ...migrationNativeStore,
    write(target, value) {
      if (target === key) throw new Error("SYNTHETIC_PRIVATE_ERROR")
      migrationNativeStore.write(target, value)
    },
  }
  const run = await createLegacyImporter(dependencies)()
  expect(run?.state).toBe("SETTLED_PARTIAL")
  expect(rows("personal_events")).toHaveLength(1)
  expect(run?.diagnostics.counts.map((error) => error.code)).toContain(
    "MMKV_WRITE_FAILED",
  )
  expect(JSON.stringify(report())).not.toContain("PRIVATE")
})

it.each([
  STORAGE_KEYS.hiddenEvents,
  STORAGE_KEYS.theme,
  STORAGE_KEYS.changelogSeenVersion,
  STORAGE_KEYS.notificationIsActive,
  STORAGE_KEYS.startupTab,
  STORAGE_KEYS.showWeekends,
  STORAGE_KEYS.migrationSuppressed,
])("settles a readback failure for %s independently", async (key) => {
  const written = new Set<string>()
  dependencies.native = {
    ...migrationNativeStore,
    write(target, value) {
      migrationNativeStore.write(target, value)
      written.add(target)
    },
    read(target, type) {
      if (target === key && written.has(target))
        throw new Error("SYNTHETIC_PRIVATE_ERROR")
      return migrationNativeStore.read(target, type)
    },
  }
  const run = await createLegacyImporter(dependencies)()
  expect(run?.state).toBe("SETTLED_PARTIAL")
  expect(run?.diagnostics.counts.map((error) => error.code)).toContain(
    "MMKV_READBACK_FAILED",
  )
})

it.each([
  "absent",
  "empty",
  "prefs_only",
  "invalid",
  "unsupported",
  "unavailable",
  "limit",
])("settles %s startup durably with one offline outbox entry", async (kind) => {
  if (kind === "absent") source = fixtureSource(false, false)
  if (kind === "empty") {
    source = fixtureSource(true, false)
    input = encodeLines([{ sembast: 1, version: 3 }])
  }
  if (kind === "prefs_only") source = fixtureSource(false, true)
  if (kind === "invalid") input = ""
  if (kind === "unsupported") input = encodeLines([{ sembast: 1, version: 20 }])
  if (kind === "unavailable")
    dependencies.discover = async () => {
      throw new Error("PRIVATE")
    }
  if (kind === "limit")
    dependencies.limits = {
      fileBytes: 1,
      lines: 1,
      lineBytes: 1,
      records: 1,
      textBytes: 1,
      arrayMembers: 1,
      errors: 1,
    }
  const run = await createLegacyImporter(dependencies)()
  expect(run?.state).toBe(
    ["absent", "empty", "prefs_only"].includes(kind)
      ? "SETTLED_SUCCESS"
      : "SETTLED_FAILED",
  )
  expect(rows("legacy_migration_report_outbox")).toHaveLength(1)
  expect(rows("user_calendars")).toEqual([])
})

it("never creates journal/discovers while identity or effective backend is ineligible", async () => {
  dependencies.eligible = () => false
  expect(await createLegacyImporter(dependencies)()).toBeNull()
  expect(dependencies.discover).not.toHaveBeenCalled()
  expect(rows("legacy_migration_run")).toHaveLength(0)
  dependencies.eligible = () => true
  expect((await createLegacyImporter(dependencies)())?.state).toBe(
    "SETTLED_SUCCESS",
  )
})

it("leaves a failed terminal transaction retryable rather than falsely complete", async () => {
  const enqueue = fixture.repository.enqueue
  fixture.repository.enqueue = () => {
    throw new Error("disk full")
  }
  await expect(createLegacyImporter(dependencies)()).rejects.toThrow(
    "disk full",
  )
  expect(fixture.repository.getRun()?.state).toBe("IN_PROGRESS")
  expect(rows("legacy_migration_report_outbox")).toHaveLength(0)
  fixture.repository.enqueue = enqueue
  expect((await restart()())?.state).toBe("SETTLED_SUCCESS")
})

it("rolls back entity writes atomically and preserves independent preferences after handled SQLite failure", async () => {
  const apply = fixture.repository.applyEntity
  let count = 0
  fixture.repository.applyEntity = (candidate) => {
    if (++count === 2) throw new Error("disk full")
    return apply(candidate)
  }
  const run = await createLegacyImporter(dependencies)()
  expect(run?.state).toBe("SETTLED_PARTIAL")
  expect(rows("user_calendars")).toEqual([])
  expect(run?.counters.user_calendars.imported).toBe(0)
  expect(getString(STORAGE_KEYS.theme)).toBe("dark")
  expect(report().errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: "SQLITE_WRITE_FAILED" }),
    ]),
  )
})

it("maintains report privacy and bounds independently of imported nonUUID IDs", async () => {
  input = encodeLines([
    { sembast: 1, version: 3 },
    ...Array.from({ length: 110 }, (_, i) =>
      legacyLine("user_calendars", i, {
        ...FIXTURE_CALENDAR,
        id: `nonUUID-${i}`,
        token: `SYNTHETIC_TOKEN_${i}`,
      }),
    ),
  ])
  const run = await createLegacyImporter(dependencies)()
  expect(run?.counters.user_calendars.imported).toBe(110)
  expect(report()).toMatchObject({
    calendarIds: [],
    calendarIdsTruncated: true,
  })
  expect(
    new TextEncoder().encode(JSON.stringify(report())).length,
  ).toBeLessThan(16_384)
})

it("delivers offline outbox independently with stable replay ID, bounded retry and accurate permanent rejection attempts", async () => {
  await createLegacyImporter(dependencies)()
  const terminal = fixture.repository.getRun()
  const send = jest
    .fn<Promise<number>, [string]>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(400)
    .mockResolvedValue(200)
  const deliver = createReportDelivery({
    repository: fixture.repository,
    now: () => now,
    eligible: () => true,
    send,
  })
  await Promise.all([deliver(), deliver()])
  expect(send).toHaveBeenCalledTimes(1)
  await deliver()
  expect(send).toHaveBeenCalledTimes(1)
  now = new Date(now.getTime() + 30_001)
  await deliver()
  expect(rows("legacy_migration_report_outbox")[0]?.attempt_count).toBe(2)
  now = new Date(now.getTime() + 86_400_001)
  await deliver()
  expect(rows("legacy_migration_report_outbox")[0]?.delivered_at).not.toBeNull()
  expect(
    send.mock.calls.map(([payload]) => JSON.parse(payload).reportId),
  ).toEqual([terminal!.reportId, terminal!.reportId, terminal!.reportId])
  expect(fixture.repository.getRun()).toEqual(terminal)
})

it("replays upload after a killed acknowledgement without changing its payload", async () => {
  await createLegacyImporter(dependencies)()
  const send = jest.fn(async () => 200)
  const delivered = fixture.repository.delivered
  fixture.repository.delivered = () => {
    throw new MigrationInterruption()
  }
  const deliver = createReportDelivery({
    repository: fixture.repository,
    now: () => now,
    eligible: () => true,
    send,
  })
  await expect(deliver()).rejects.toBeInstanceOf(MigrationInterruption)
  fixture.repository.delivered = delivered
  now = new Date(now.getTime() + 30_001)
  await deliver()
  expect(send).toHaveBeenCalledTimes(2)
  expect(send.mock.calls[0]).toEqual(send.mock.calls[1])
})

it("rejects invalid journal terminal/retry shapes and singleton duplicates in actual SQLite", async () => {
  await createLegacyImporter(dependencies)()
  const run = fixture.repository.getRun()!
  expect(() =>
    fixture.repository.saveRun({
      ...run,
      state: "IN_PROGRESS",
      outcome: null,
      completedAt: null,
    }),
  ).toThrow("MIGRATION_JOURNAL_INVARIANT")
  expect(() =>
    fixture.repository.saveRun({ ...run, attemptCount: 0 } as MigrationRun),
  ).toThrow("MIGRATION_JOURNAL_INVARIANT")
  expect(() => fixture.repository.saveRun({ ...run, attemptCount: 2 })).toThrow(
    "MIGRATION_JOURNAL_INVARIANT",
  )
  expect(() =>
    fixture.repository.enqueue("synthetic", "x".repeat(16_385), FIXTURE_TIME),
  ).toThrow("MIGRATION_REPORT_LIMIT")
  expect(() =>
    fixture.database.exec("UPDATE legacy_migration_run SET id = 2"),
  ).toThrow()
})

it.each([
  ["counters_json", JSON.stringify({ version: 2 })],
  ["counters_json", " ".repeat(65_537)],
  ["counters_json", JSON.stringify({ version: 1, datasets: {} })],
  [
    "error_codes_json",
    JSON.stringify({
      version: 1,
      diagnostics: {
        counts: [{ stage: "parse", code: "PRIVATE_ERROR", count: 1 }],
        examples: [],
        truncated: false,
      },
    }),
  ],
  [
    "error_codes_json",
    JSON.stringify({
      version: 1,
      diagnostics: {
        counts: [{ stage: "parse", code: "INVALID_UTF8", count: 0 }],
        examples: [],
        truncated: false,
      },
    }),
  ],
  [
    "error_codes_json",
    JSON.stringify({
      version: 1,
      diagnostics: {
        counts: [],
        examples: [{ stage: "parse", code: "INVALID_UTF8", line: -1 }],
        truncated: false,
      },
    }),
  ],
  [
    "error_codes_json",
    JSON.stringify({
      version: 1,
      diagnostics: {
        counts: [],
        examples: [
          { stage: "normalize", code: "INVALID_RECORD", dataset: "unknown" },
        ],
        truncated: false,
      },
    }),
  ],
  [
    "preference_progress",
    JSON.stringify({
      version: 1,
      participants: {
        theme: { key: "unknown", hash: "not-a-hash", result: "imported" },
      },
    }),
  ],
])(
  "rejects malformed durable %s before any source discovery",
  async (column, value) => {
    await createLegacyImporter(dependencies)()
    fixture.database
      .prepare(`UPDATE legacy_migration_run SET ${column} = ?`)
      .run(value)
    await expect(restart()()).rejects.toThrow("MIGRATION_JOURNAL_INVARIANT")
    expect(dependencies.discover).toHaveBeenCalledTimes(1)
  },
)

it("validates every dataset counter before updating the durable journal", async () => {
  await createLegacyImporter(dependencies)()
  const run = fixture.repository.getRun()!
  delete (run.counters.theme as Partial<typeof run.counters.theme>).candidate
  expect(() => fixture.repository.saveRun(run)).toThrow(
    "MIGRATION_JOURNAL_INVARIANT",
  )
  run.counters.theme.candidate = -1
  expect(() => fixture.repository.saveRun(run)).toThrow(
    "MIGRATION_JOURNAL_INVARIANT",
  )
})

it("pauses report delivery on backend changes and bounds transient retry delays", async () => {
  await createLegacyImporter(dependencies)()
  let eligible = false
  const send = jest.fn(async () => 503)
  const deliver = createReportDelivery({
    repository: fixture.repository,
    now: () => now,
    eligible: () => eligible,
    send,
  })
  await deliver()
  expect(send).not.toHaveBeenCalled()
  eligible = true
  await deliver()
  expect(send).toHaveBeenCalledTimes(1)
  fixture.database.exec(
    "UPDATE legacy_migration_report_outbox SET attempt_count = 100000, next_attempt_at = NULL",
  )
  await deliver()
  expect(rows("legacy_migration_report_outbox")[0]?.next_attempt_at).toBe(
    new Date(now.getTime() + 86_400_000).toISOString(),
  )
  const switched = createReportDelivery({
    repository: fixture.repository,
    now: () => new Date(now.getTime() + 86_400_001),
    eligible: jest.fn().mockReturnValueOnce(true).mockReturnValue(false),
    send,
  })
  await switched()
  expect(send).toHaveBeenCalledTimes(2)
  expect(rows("legacy_migration_report_outbox")[0]?.delivered_at).toBeNull()
})

it.each([false, true])(
  "recovers actual SIGKILL of a SQLite writer with transaction committed=%s",
  async (committed) => {
    dependencies.checkpoint = (boundary) => {
      if (boundary === "after_journal") throw new MigrationInterruption()
    }
    await expect(createLegacyImporter(dependencies)()).rejects.toBeInstanceOf(
      MigrationInterruption,
    )
    fixture.database.close()
    const script = `const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync(process.argv[1]); db.exec('PRAGMA journal_mode=WAL; BEGIN IMMEDIATE'); db.prepare('INSERT INTO personal_events (uid,title,color,starts_at,ends_at,exported_at,location,description) VALUES (?,?,?,?,?,?,?,?)').run('synthetic-personal','SYNTHETIC_PRIVATE_EVENT 🦉','#aAbBcC','${FIXTURE_TIME}','2026-03-29T01:30:00.000Z','${FIXTURE_TIME}','',null); db.exec('UPDATE legacy_migration_run SET sqlite_committed=1'); if(process.argv[2] === 'yes') db.exec('COMMIT'); process.kill(process.pid,'SIGKILL');`
    const child = spawnSync(
      process.execPath,
      ["-e", script, path, committed ? "yes" : "no"],
      { stdio: "pipe" },
    )
    expect(child.signal).toBe("SIGKILL")
    fixture = openMigrationTestDatabase(path)
    dependencies.repository = fixture.repository
    delete dependencies.checkpoint
    expect(rows("personal_events")).toHaveLength(committed ? 1 : 0)
    expect(fixture.repository.getRun()?.sqliteCommitted).toBe(committed)
    const run = await createLegacyImporter(dependencies)()
    expect(run?.state).toBe("SETTLED_SUCCESS")
    expect(rows("personal_events")).toHaveLength(1)
  },
)

it("keeps terminal reports and imported values intact after normal RN edits and deletions", async () => {
  await createLegacyImporter(dependencies)()
  const payload = report()
  fixture.database
    .prepare("UPDATE personal_events SET title = ? WHERE uid = ?")
    .run("newer edited content", FIXTURE_EVENT.uid)
  fixture.database.exec("DELETE FROM checklist_items")
  await restart()()
  expect(rows("personal_events")[0]?.title).toBe("newer edited content")
  expect(rows("checklist_items")).toEqual([])
  expect(report()).toEqual(payload)
  expect(dependencies.discover).toHaveBeenCalledTimes(1)
})

it("settles target verification read failures with a private bounded code", async () => {
  fixture.repository.readEntity = () => {
    throw new Error("SYNTHETIC_PRIVATE_SQL_ERROR")
  }
  const run = await createLegacyImporter(dependencies)()
  expect(run?.state).toBe("SETTLED_PARTIAL")
  expect(report().errors).toContainEqual({
    stage: "verify",
    code: "TARGET_VERIFY_FAILED",
    count: 3,
  })
  expect(JSON.stringify(report())).not.toContain("PRIVATE")
})
