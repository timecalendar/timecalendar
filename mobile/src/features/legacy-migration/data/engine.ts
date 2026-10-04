import type { MigrationRepository, MigrationRun } from "@/db/legacy-migration"
import { rowsEqual } from "@/db/legacy-migration"
import { STORAGE_KEYS } from "@/storage"
import { nativeFingerprint } from "@/storage/migration-integrity"
import type { MigrationNativeStore } from "@/storage/migration-participants"

import type { LegacyMigrationSource } from "./native-source"
import { parseSembast } from "./parser"
import { preferenceCandidates } from "./preferences"
import {
  buildReport,
  type ReleaseMetadata,
  type TerminalReason,
} from "./report"
import {
  DEFAULT_LIMITS,
  diagnose,
  emptyParsed,
  type EntityCandidate,
  type Limits,
  type NativeCandidate,
  newCounters,
  newDiagnostics,
  type ParsedSource,
} from "./types"

export type CrashBoundary =
  | "before_journal"
  | "after_journal"
  | "after_parse"
  | "during_sqlite"
  | "after_sqlite"
  | "after_native_write"
  | "after_native_progress"
  | "before_terminal"
  | "after_terminal"
export class MigrationInterruption extends Error {}
export interface EngineDependencies {
  repository: MigrationRepository
  native: MigrationNativeStore
  eligible: () => boolean
  discover: () => Promise<LegacyMigrationSource>
  read: (uri: string) => AsyncIterable<Uint8Array>
  now: () => Date
  newId: () => string
  release: ReleaseMetadata
  limits?: Limits
  checkpoint?: (boundary: CrashBoundary, participant?: string) => void
}

function valueType(key: string): "string" | "number" | "boolean" {
  if (key === STORAGE_KEYS.changelogSeenVersion) return "number"
  return [
    STORAGE_KEYS.theme,
    STORAGE_KEYS.startupTab,
    STORAGE_KEYS.hiddenEvents,
  ].includes(key as typeof STORAGE_KEYS.theme)
    ? "string"
    : "boolean"
}

export function createLegacyImporter(dependencies: EngineDependencies) {
  let active: Promise<MigrationRun | null> | undefined
  return () => {
    if (!active)
      active = runImport(dependencies).finally(() => {
        active = undefined
      })
    return active
  }
}

async function runImport(d: EngineDependencies): Promise<MigrationRun | null> {
  if (!d.eligible()) return null
  const repo = d.repository
  let run = repo.getRun()
  if (run && run.state !== "IN_PROGRESS") {
    verifyTerminal(d, run)
    return run
  }
  d.checkpoint?.("before_journal")
  if (!run)
    run = {
      state: "IN_PROGRESS",
      reportId: d.newId(),
      attemptCount: 1,
      startedAt: d.now().toISOString(),
      completedAt: null,
      sourceVersion: null,
      sourceSizeBytes: null,
      sourceFingerprint: null,
      sqliteCommitted: false,
      progress: { version: 1, participants: {} },
      counters: newCounters(),
      diagnostics: newDiagnostics(),
      outcome: null,
    }
  else run.attemptCount++
  repo.saveRun(run)
  d.checkpoint?.("after_journal")
  let parsed: ParsedSource = emptyParsed()
  let source: LegacyMigrationSource | undefined
  let natives: NativeCandidate[] = []
  let reason: TerminalReason = "completed"
  const limits = d.limits ?? DEFAULT_LIMITS
  try {
    source = await d.discover()
    if (source.database) {
      if (source.database.sizeBytes > limits.fileBytes) {
        diagnose(parsed.diagnostics, "parse", "FILE_LIMIT")
        parsed.fatal = true
      } else {
        const replay = await parseSembast(
          d.read(source.database.uri),
          run.startedAt,
          limits,
        )
        parsed = replay
        if (
          run.sourceFingerprint !== null &&
          run.sourceFingerprint !== replay.fingerprint
        )
          diagnose(
            parsed.diagnostics,
            "discovery",
            "SOURCE_CHANGED_DURING_RETRY",
          )
        run.sourceFingerprint = replay.fingerprint
        run.sourceSizeBytes = replay.sizeBytes
        run.sourceVersion = replay.version
      }
    }
    // Unsupported or hard-bounded files have no trusted snapshot to import.
    if (!parsed.fatal) natives = preferenceCandidates(source, parsed)
  } catch (error) {
    if (error instanceof MigrationInterruption) throw error
    diagnose(parsed.diagnostics, "discovery", "SOURCE_OPEN_FAILED")
    parsed.fatal = true
  }
  run.counters = parsed.counters
  run.diagnostics = parsed.diagnostics
  repo.saveRun(run)
  d.checkpoint?.("after_parse")
  const verified: EntityCandidate[] = []
  const calendarIds: string[] = []
  if (!parsed.fatal) {
    const priorCounters = JSON.parse(
      JSON.stringify(run.counters),
    ) as typeof run.counters
    try {
      repo.transaction(() => {
        for (const candidate of parsed.entities) {
          const result = repo.applyEntity(candidate)
          if (result === "id_conflict" || result === "token_conflict") {
            run.counters[candidate.store].skipped_conflict++
            diagnose(
              run.diagnostics,
              "apply_sqlite",
              result === "id_conflict"
                ? "TARGET_ID_CONFLICT"
                : "TARGET_TOKEN_CONFLICT",
              { dataset: candidate.store },
            )
          } else {
            run.counters[candidate.store][result]++
            verified.push(candidate)
            if (candidate.store === "user_calendars")
              calendarIds.push(candidate.id)
          }
          d.checkpoint?.("during_sqlite")
        }
        run.sqliteCommitted = true
        repo.saveRun(run)
      })
    } catch (error) {
      if (error instanceof MigrationInterruption) throw error
      run.counters = priorCounters
      run.sqliteCommitted = false
      verified.length = 0
      calendarIds.length = 0
      diagnose(run.diagnostics, "apply_sqlite", "SQLITE_WRITE_FAILED")
      reason = "target_failure"
      repo.saveRun(run)
    }
    d.checkpoint?.("after_sqlite")
    if (calendarIds.length > 0) {
      run.counters.onboarding.candidate++
      natives.push({
        dataset: "onboarding",
        key: STORAGE_KEYS.migrationSuppressed,
        value: true,
      })
    }
    for (const candidate of natives) applyNative(d, run, candidate)
  }
  d.checkpoint?.("before_terminal")
  repo.transaction(() => {
    for (const candidate of verified) {
      try {
        const current = repo.readEntity(candidate)
        if (!current || !rowsEqual(current, candidate.row))
          diagnose(run.diagnostics, "verify", "TARGET_VERIFY_FAILED", {
            dataset: candidate.store,
          })
      } catch {
        diagnose(run.diagnostics, "verify", "TARGET_VERIFY_FAILED", {
          dataset: candidate.store,
        })
      }
    }
    for (const candidate of natives) {
      const progress = run.progress.participants[candidate.dataset]
      if (
        !progress ||
        (progress.result !== "imported" &&
          progress.result !== "already_present")
      )
        continue
      try {
        const actual = d.native.read(candidate.key, valueType(candidate.key))
        if (actual === undefined || nativeFingerprint(actual) !== progress.hash)
          diagnose(run.diagnostics, "verify", "TARGET_VERIFY_FAILED", {
            dataset: candidate.dataset,
          })
      } catch {
        diagnose(run.diagnostics, "verify", "TARGET_VERIFY_FAILED", {
          dataset: candidate.dataset,
        })
      }
    }
    const usable = Object.values(run.counters).reduce(
      (sum, counts) => sum + counts.imported + counts.already_present,
      0,
    )
    if (parsed.fatal) {
      reason = run.diagnostics.counts.some((entry) =>
        ["FILE_LIMIT", "LINE_LIMIT"].includes(entry.code),
      )
        ? "resource_limit"
        : run.diagnostics.counts.some(
              (entry) => entry.code === "SOURCE_OPEN_FAILED",
            )
          ? "source_unavailable"
          : "malformed_source"
    } else if (
      run.diagnostics.counts.length === 0 &&
      parsed.entities.length === 0 &&
      natives.length === 0
    )
      reason = source?.database ? "empty_legacy_store" : "no_legacy_source"
    run.outcome = parsed.fatal
      ? "failed"
      : run.diagnostics.counts.length > 0
        ? usable > 0
          ? "partial"
          : "failed"
        : "success"
    run.state =
      run.outcome === "success"
        ? "SETTLED_SUCCESS"
        : run.outcome === "partial"
          ? "SETTLED_PARTIAL"
          : "SETTLED_FAILED"
    run.completedAt = new Date(
      Math.max(d.now().getTime(), Date.parse(run.startedAt)),
    ).toISOString()
    repo.saveRun(run)
    repo.enqueue(
      run.reportId,
      JSON.stringify(buildReport(run, d.release, reason, calendarIds)),
      run.completedAt!,
    )
  })
  d.checkpoint?.("after_terminal")
  return run
}

function applyNative(
  d: EngineDependencies,
  run: MigrationRun,
  candidate: NativeCandidate,
): void {
  const hash = nativeFingerprint(candidate.value)
  const progress = {
    key: candidate.key,
    hash,
    result: "skipped_invalid" as
      | "imported"
      | "already_present"
      | "skipped_conflict"
      | "skipped_invalid",
  }
  let existing: string | number | boolean | undefined
  let exists: boolean
  try {
    exists = d.native.has(candidate.key)
    existing = d.native.read(candidate.key, valueType(candidate.key))
  } catch {
    diagnose(run.diagnostics, "apply_native", "MMKV_READBACK_FAILED", {
      dataset: candidate.dataset,
    })
    run.counters[candidate.dataset].skipped_invalid++
    d.repository.saveRun(run)
    return
  }
  if (
    exists &&
    (existing === undefined || nativeFingerprint(existing) !== hash)
  ) {
    progress.result = "skipped_conflict"
    diagnose(run.diagnostics, "apply_native", "TARGET_NATIVE_CONFLICT", {
      dataset: candidate.dataset,
    })
  } else {
    try {
      if (!exists) d.native.write(candidate.key, candidate.value)
    } catch {
      diagnose(run.diagnostics, "apply_native", "MMKV_WRITE_FAILED", {
        dataset: candidate.dataset,
      })
      run.counters[candidate.dataset].skipped_invalid++
      d.repository.saveRun(run)
      return
    }
    d.checkpoint?.("after_native_write", candidate.dataset)
    try {
      const actual = d.native.read(candidate.key, valueType(candidate.key))
      if (actual === undefined || nativeFingerprint(actual) !== hash)
        throw new Error("MMKV_READBACK_FAILED")
      progress.result = exists ? "already_present" : "imported"
    } catch {
      diagnose(run.diagnostics, "apply_native", "MMKV_READBACK_FAILED", {
        dataset: candidate.dataset,
      })
    }
  }
  run.counters[candidate.dataset][progress.result]++
  run.progress.participants[candidate.dataset] = progress
  d.repository.saveRun(run)
  d.checkpoint?.("after_native_progress", candidate.dataset)
}

function verifyTerminal(d: EngineDependencies, run: MigrationRun): void {
  if (run.progress.integrityReportId) return
  let mismatch = false
  for (const participant of Object.values(run.progress.participants)) {
    if (
      participant.result !== "imported" &&
      participant.result !== "already_present"
    )
      continue
    try {
      const actual = d.native.read(participant.key, valueType(participant.key))
      if (actual === undefined) mismatch = true
      else {
        const fingerprint = nativeFingerprint(actual)
        if (
          fingerprint !== participant.hash &&
          fingerprint !== d.native.editedFingerprint(participant.key)
        )
          mismatch = true
      }
    } catch {
      mismatch = true
    }
  }
  if (!mismatch) return
  const reportRun: MigrationRun = {
    ...run,
    reportId: d.newId(),
    state: "SETTLED_PARTIAL",
    outcome: "partial",
    completedAt: new Date(
      Math.max(d.now().getTime(), Date.parse(run.startedAt)),
    ).toISOString(),
    diagnostics: newDiagnostics(),
  }
  diagnose(reportRun.diagnostics, "verify", "TERMINAL_INTEGRITY_MISMATCH")
  run.progress.integrityReportId = reportRun.reportId
  d.repository.transaction(() => {
    d.repository.enqueue(
      reportRun.reportId,
      JSON.stringify(
        buildReport(reportRun, d.release, "integrity_failure", []),
      ),
      reportRun.completedAt!,
    )
    d.repository.saveRun(run)
  })
}
