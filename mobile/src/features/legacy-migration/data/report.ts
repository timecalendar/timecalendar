import type { MigrationRun } from "@/db/legacy-migration"

import { type Counts, DATASETS, type Outcome } from "./types"

export type TerminalReason =
  | "completed"
  | "no_legacy_source"
  | "empty_legacy_store"
  | "malformed_source"
  | "source_unavailable"
  | "resource_limit"
  | "target_failure"
  | "integrity_failure"
export interface ReleaseMetadata {
  platform: "ios" | "android"
  targetAppVersion: string
  targetBuild: string
  osMajorVersion: number
}
export function buildReport(
  run: MigrationRun,
  release: ReleaseMetadata,
  reason: TerminalReason,
  calendarIds: string[],
) {
  const bound = (value: number, maximum = 1_000_000) =>
    Math.max(0, Math.min(maximum, Math.floor(value)))
  const count = (input: Counts): Counts => ({
    candidate: bound(input.candidate),
    imported: bound(input.imported),
    already_present: bound(input.already_present),
    skipped_invalid: bound(input.skipped_invalid),
    skipped_conflict: bound(input.skipped_conflict),
  })
  const preferences: Counts = {
    candidate: 0,
    imported: 0,
    already_present: 0,
    skipped_invalid: 0,
    skipped_conflict: 0,
  }
  for (const dataset of DATASETS.slice(4))
    for (const key of Object.keys(preferences) as (keyof Counts)[])
      preferences[key] += run.counters[dataset][key]
  const ids = [...new Set(calendarIds)]
  const validIds = new Set<string>()
  for (const id of ids)
    if (
      /^(?:[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i.test(
        id,
      )
    )
      validIds.add(id.toLowerCase())
  const acceptedIds = [...validIds].slice(0, 100)
  return {
    schemaVersion: 1 as const,
    reportId: run.reportId,
    platform: release.platform,
    targetAppVersion: /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(
      release.targetAppVersion,
    )
      ? release.targetAppVersion
      : "0.0.0",
    targetBuild: /^\d{1,10}$/.test(release.targetBuild)
      ? release.targetBuild
      : "0",
    ...(run.sourceVersion !== null &&
    run.sourceVersion >= 0 &&
    run.sourceVersion <= 2_147_483_647
      ? { sourceDatabaseVersion: run.sourceVersion }
      : {}),
    osMajorVersion: Math.max(1, bound(release.osMajorVersion || 1, 100)),
    startedAt: run.startedAt,
    completedAt: run.completedAt!,
    durationMs: bound(
      Date.parse(run.completedAt!) - Date.parse(run.startedAt),
      604_800_000,
    ),
    attemptCount: Math.max(1, bound(run.attemptCount, 1000)),
    outcome: run.outcome as Outcome,
    reason,
    datasets: {
      calendars: count(run.counters.user_calendars),
      personal_events: count(run.counters.personal_events),
      checklist_items: count(run.counters.checklist_items),
      hidden_events: count(run.counters.hidden_events),
      preferences: count(preferences),
    },
    errors: run.diagnostics.counts.map(({ stage, code, count }) => ({
      stage,
      code,
      count: Math.max(1, bound(count)),
    })),
    examplesTruncated: run.diagnostics.truncated,
    calendarIds: acceptedIds,
    calendarIdsTruncated: ids.length !== acceptedIds.length,
  }
}
