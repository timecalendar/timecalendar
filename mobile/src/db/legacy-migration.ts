import type {
  Counters,
  Dataset,
  Diagnostics,
  EntityCandidate,
  Outcome,
  Row,
} from "@/features/legacy-migration/data/types"
import { DATASETS, ERROR_CODES } from "@/features/legacy-migration/data/types"
import { STORAGE_KEYS } from "@/storage"

const KNOWN_STORAGE_KEYS = new Set<string>(Object.values(STORAGE_KEYS))

export type SqlValue = string | number | null
export interface MigrationSqlite {
  runSync(sql: string, ...params: SqlValue[]): unknown
  getFirstSync<T>(sql: string, ...params: SqlValue[]): T | null
  getAllSync<T>(sql: string, ...params: SqlValue[]): T[]
  withTransactionSync(task: () => void): void
}
export type RunState =
  | "IN_PROGRESS"
  | "SETTLED_SUCCESS"
  | "SETTLED_PARTIAL"
  | "SETTLED_FAILED"
export interface NativeProgress {
  version: 1
  participants: Partial<
    Record<
      Dataset,
      {
        key: string
        hash: string
        result:
          | "imported"
          | "already_present"
          | "skipped_conflict"
          | "skipped_invalid"
      }
    >
  >
  integrityReportId?: string
}
export interface MigrationRun {
  state: RunState
  reportId: string
  attemptCount: number
  startedAt: string
  completedAt: string | null
  sourceVersion: number | null
  sourceSizeBytes: number | null
  sourceFingerprint: string | null
  sqliteCommitted: boolean
  progress: NativeProgress
  counters: Counters
  diagnostics: Diagnostics
  outcome: Outcome | null
}
export interface OutboxRow {
  report_id: string
  payload_json: string
  attempt_count: number
  next_attempt_at: string | null
  delivered_at: string | null
  created_at: string
}
interface JournalRow {
  state: RunState
  report_id: string
  attempt_count: number
  started_at: string
  completed_at: string | null
  source_version: number | null
  source_size_bytes: number | null
  source_fingerprint: string | null
  sqlite_committed: number
  preference_progress: string
  counters_json: string
  error_codes_json: string
  terminal_outcome: Outcome | null
}

export function rowsEqual(actual: Row, expected: Row): boolean {
  return Object.keys(expected).every((key) => {
    const value = actual[key]
    if (
      key.endsWith("_at") &&
      typeof value === "string" &&
      typeof expected[key] === "string"
    ) {
      const instant = new Date(value)
      return (
        Number.isFinite(instant.getTime()) &&
        instant.toISOString() === expected[key]
      )
    }
    return value === expected[key]
  })
}

export function createMigrationRepository(sqlite: MigrationSqlite) {
  function getRun(): MigrationRun | null {
    const row = sqlite.getFirstSync<JournalRow>(
      "SELECT * FROM legacy_migration_run WHERE id = 1",
    )
    if (!row) return null
    const run: MigrationRun = {
      state: row.state,
      reportId: row.report_id,
      attemptCount: row.attempt_count,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      sourceVersion: row.source_version,
      sourceSizeBytes: row.source_size_bytes,
      sourceFingerprint: row.source_fingerprint,
      sqliteCommitted: row.sqlite_committed === 1,
      progress: JSON.parse(row.preference_progress),
      counters: decodeVersioned(row.counters_json).datasets as Counters,
      diagnostics: decodeVersioned(row.error_codes_json)
        .diagnostics as Diagnostics,
      outcome: row.terminal_outcome,
    }
    validateRun(run)
    return run
  }
  function saveRun(run: MigrationRun): void {
    validateRun(run)
    const existing = getRun()
    if (
      existing &&
      (existing.reportId !== run.reportId ||
        existing.startedAt !== run.startedAt ||
        (existing.state !== "IN_PROGRESS" && existing.state !== run.state))
    )
      throw new Error("MIGRATION_JOURNAL_INVARIANT")
    if (existing && existing.state !== "IN_PROGRESS") {
      const immutable = (value: MigrationRun) =>
        JSON.stringify({
          ...value,
          progress: { ...value.progress, integrityReportId: undefined },
        })
      if (immutable(existing) !== immutable(run))
        throw new Error("MIGRATION_JOURNAL_INVARIANT")
    }
    sqlite.runSync(
      `INSERT INTO legacy_migration_run (id,state,report_id,attempt_count,started_at,completed_at,source_version,source_size_bytes,source_fingerprint,sqlite_committed,preference_progress,counters_json,error_codes_json,terminal_outcome)
      VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,attempt_count=excluded.attempt_count,completed_at=excluded.completed_at,source_version=excluded.source_version,source_size_bytes=excluded.source_size_bytes,source_fingerprint=excluded.source_fingerprint,sqlite_committed=excluded.sqlite_committed,preference_progress=excluded.preference_progress,counters_json=excluded.counters_json,error_codes_json=excluded.error_codes_json,terminal_outcome=excluded.terminal_outcome`,
      run.state,
      run.reportId,
      run.attemptCount,
      run.startedAt,
      run.completedAt,
      run.sourceVersion,
      run.sourceSizeBytes,
      run.sourceFingerprint,
      run.sqliteCommitted ? 1 : 0,
      JSON.stringify(run.progress),
      JSON.stringify({ version: 1, datasets: run.counters }),
      JSON.stringify({ version: 1, diagnostics: run.diagnostics }),
      run.outcome,
    )
  }
  function readEntity(candidate: EntityCandidate): Row | null {
    const primary = {
      user_calendars: "id",
      personal_events: "uid",
      checklist_items: "uuid",
    }[candidate.store]
    return sqlite.getFirstSync<Row>(
      `SELECT * FROM ${candidate.store} WHERE ${primary} = ?`,
      candidate.id,
    )
  }
  return {
    getRun,
    saveRun,
    transaction: (task: () => void) => sqlite.withTransactionSync(task),
    readEntity,
    applyEntity(
      candidate: EntityCandidate,
    ): "imported" | "already_present" | "id_conflict" | "token_conflict" {
      const existing = readEntity(candidate)
      if (existing && !rowsEqual(existing, candidate.row)) return "id_conflict"
      if (
        candidate.store === "user_calendars" &&
        sqlite.getFirstSync<Row>(
          "SELECT id FROM user_calendars WHERE token = ? AND id <> ? LIMIT 1",
          candidate.row.token!,
          candidate.id,
        )
      )
        return "token_conflict"
      if (existing) return "already_present"
      const columns = Object.keys(candidate.row)
      sqlite.runSync(
        `INSERT INTO ${candidate.store} (${columns.map((column) => `"${column}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
        ...columns.map((column) => candidate.row[column]!),
      )
      return "imported"
    },
    enqueue(reportId: string, payload: string, at: string): void {
      if (new TextEncoder().encode(payload).length > 16_384)
        throw new Error("MIGRATION_REPORT_LIMIT")
      sqlite.runSync(
        "INSERT INTO legacy_migration_report_outbox (report_id,payload_json,created_at) VALUES (?,?,?) ON CONFLICT(report_id) DO NOTHING",
        reportId,
        payload,
        at,
      )
    },
    pending(at: string): OutboxRow[] {
      return sqlite.getAllSync<OutboxRow>(
        "SELECT * FROM legacy_migration_report_outbox WHERE delivered_at IS NULL AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY created_at LIMIT 2",
        at,
      )
    },
    deliveryAttempt(id: string, nextAt: string): void {
      sqlite.runSync(
        "UPDATE legacy_migration_report_outbox SET attempt_count = MIN(attempt_count + 1,1000000), next_attempt_at = ? WHERE report_id = ? AND delivered_at IS NULL",
        nextAt,
        id,
      )
    },
    reschedule(id: string, nextAt: string): void {
      sqlite.runSync(
        "UPDATE legacy_migration_report_outbox SET next_attempt_at = ? WHERE report_id = ? AND delivered_at IS NULL",
        nextAt,
        id,
      )
    },
    delivered(id: string, at: string): void {
      sqlite.runSync(
        "UPDATE legacy_migration_report_outbox SET delivered_at = ?, next_attempt_at = NULL WHERE report_id = ?",
        at,
        id,
      )
    },
  }
}
export type MigrationRepository = ReturnType<typeof createMigrationRepository>

function validateRun(run: MigrationRun): void {
  const states: RunState[] = [
    "IN_PROGRESS",
    "SETTLED_SUCCESS",
    "SETTLED_PARTIAL",
    "SETTLED_FAILED",
  ]
  if (
    !states.includes(run.state) ||
    !Number.isSafeInteger(run.attemptCount) ||
    run.attemptCount < 1 ||
    !Number.isFinite(Date.parse(run.startedAt)) ||
    run.progress.version !== 1 ||
    !run.progress.participants ||
    Object.keys(run.progress.participants).length > 10 ||
    !Array.isArray(run.diagnostics.counts) ||
    run.diagnostics.counts.length > 24 ||
    !Array.isArray(run.diagnostics.examples) ||
    run.diagnostics.examples.length > 100 ||
    (run.state === "IN_PROGRESS"
      ? run.outcome !== null || run.completedAt !== null
      : run.outcome === null ||
        run.state !== `SETTLED_${run.outcome.toUpperCase()}` ||
        !Number.isFinite(Date.parse(run.completedAt!)))
  )
    throw new Error("MIGRATION_JOURNAL_INVARIANT")
  const fail = () => {
    throw new Error("MIGRATION_JOURNAL_INVARIANT")
  }
  if (Object.keys(run.counters).length !== DATASETS.length) fail()
  for (const dataset of DATASETS) {
    const counts = run.counters[dataset]
    if (!counts || Object.keys(counts).length !== 5) fail()
    for (const key of [
      "candidate",
      "imported",
      "already_present",
      "skipped_invalid",
      "skipped_conflict",
    ] as const) {
      if (!Number.isSafeInteger(counts[key]) || counts[key] < 0) fail()
    }
  }
  for (const diagnostic of [
    ...run.diagnostics.counts,
    ...run.diagnostics.examples,
  ]) {
    if (!ERROR_CODES[diagnostic.stage]?.includes(diagnostic.code)) fail()
    if (
      "count" in diagnostic &&
      (!Number.isSafeInteger(diagnostic.count) || diagnostic.count < 1)
    )
      fail()
    if (
      "line" in diagnostic &&
      (!Number.isSafeInteger(diagnostic.line) || diagnostic.line! < 0)
    )
      fail()
    if ("dataset" in diagnostic && !DATASETS.includes(diagnostic.dataset!))
      fail()
  }
  for (const [dataset, progress] of Object.entries(run.progress.participants)) {
    if (
      !DATASETS.includes(dataset as Dataset) ||
      !KNOWN_STORAGE_KEYS.has(progress.key) ||
      !/^[a-f0-9]{64}$/.test(progress.hash) ||
      ![
        "imported",
        "already_present",
        "skipped_invalid",
        "skipped_conflict",
      ].includes(progress.result)
    )
      fail()
  }
}

function decodeVersioned(raw: string): Record<string, unknown> {
  if (raw.length > 65_536) throw new Error("MIGRATION_JOURNAL_INVARIANT")
  const decoded: unknown = JSON.parse(raw)
  if (
    !decoded ||
    typeof decoded !== "object" ||
    !("version" in decoded) ||
    decoded.version !== 1
  )
    throw new Error("MIGRATION_JOURNAL_INVARIANT")
  return decoded as Record<string, unknown>
}
