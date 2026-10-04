export const DATASETS = [
  "user_calendars",
  "personal_events",
  "checklist_items",
  "hidden_events",
  "theme",
  "current_version",
  "notification_calendar",
  "startup_screen",
  "show_weekends",
  "onboarding",
] as const
export type Dataset = (typeof DATASETS)[number]
export type EntityStore =
  | "user_calendars"
  | "personal_events"
  | "checklist_items"
export type SourceStore = EntityStore | "hidden_events"
export type Row = Record<string, string | number | null>
export type Outcome = "success" | "partial" | "failed"
export type Stage =
  | "discovery"
  | "parse"
  | "normalize"
  | "apply_sqlite"
  | "apply_native"
  | "verify"
  | "report_delivery"
export type ErrorCode =
  | "SOURCE_OPEN_FAILED"
  | "SOURCE_CHANGED_DURING_RETRY"
  | "INVALID_UTF8"
  | "INVALID_METADATA"
  | "UNSUPPORTED_VERSION"
  | "FILE_LIMIT"
  | "LINE_LIMIT"
  | "LINE_TOO_LONG"
  | "MALFORMED_JSON"
  | "TRUNCATED_TAIL"
  | "INVALID_RECORD"
  | "INVALID_PREFERENCE"
  | "DUPLICATE_SOURCE_ID"
  | "DUPLICATE_SOURCE_TOKEN"
  | "TARGET_ID_CONFLICT"
  | "TARGET_TOKEN_CONFLICT"
  | "SQLITE_WRITE_FAILED"
  | "TARGET_NATIVE_CONFLICT"
  | "MMKV_WRITE_FAILED"
  | "MMKV_READBACK_FAILED"
  | "TARGET_VERIFY_FAILED"
  | "TERMINAL_INTEGRITY_MISMATCH"
  | "REPORT_REJECTED"

export const ERROR_CODES: Record<Stage, readonly ErrorCode[]> = {
  discovery: ["SOURCE_OPEN_FAILED", "SOURCE_CHANGED_DURING_RETRY"],
  parse: [
    "INVALID_UTF8",
    "INVALID_METADATA",
    "UNSUPPORTED_VERSION",
    "FILE_LIMIT",
    "LINE_LIMIT",
    "LINE_TOO_LONG",
    "MALFORMED_JSON",
    "TRUNCATED_TAIL",
  ],
  normalize: [
    "INVALID_RECORD",
    "INVALID_PREFERENCE",
    "DUPLICATE_SOURCE_ID",
    "DUPLICATE_SOURCE_TOKEN",
  ],
  apply_sqlite: [
    "TARGET_ID_CONFLICT",
    "TARGET_TOKEN_CONFLICT",
    "SQLITE_WRITE_FAILED",
  ],
  apply_native: [
    "TARGET_NATIVE_CONFLICT",
    "MMKV_WRITE_FAILED",
    "MMKV_READBACK_FAILED",
  ],
  verify: ["TARGET_VERIFY_FAILED", "TERMINAL_INTEGRITY_MISMATCH"],
  report_delivery: ["REPORT_REJECTED"],
}
export interface Counts {
  candidate: number
  imported: number
  already_present: number
  skipped_invalid: number
  skipped_conflict: number
}
export type Counters = Record<Dataset, Counts>
export interface Diagnostic {
  stage: Stage
  code: ErrorCode
  count: number
}
export interface Diagnostics {
  counts: Diagnostic[]
  examples: {
    stage: Stage
    code: ErrorCode
    line?: number
    dataset?: Dataset
  }[]
  truncated: boolean
}
export interface EntityCandidate {
  store: EntityStore
  id: string
  row: Row
  line: number
}
export interface NativeCandidate {
  dataset: Dataset
  key: string
  value: string | number | boolean
}
export interface ParsedSource {
  version: number | null
  entities: EntityCandidate[]
  hidden: { uidHiddenEvents: string[]; namedHiddenEvents: string[] } | null
  counters: Counters
  diagnostics: Diagnostics
  fatal: boolean
}
export interface Limits {
  fileBytes: number
  lines: number
  lineBytes: number
  records: number
  textBytes: number
  arrayMembers: number
  errors: number
}
export const DEFAULT_LIMITS: Limits = {
  fileBytes: 64 * 1024 * 1024,
  lines: 200_000,
  lineBytes: 2 * 1024 * 1024,
  records: 100_000,
  textBytes: 256 * 1024,
  arrayMembers: 50_000,
  errors: 100,
}
export function newCounters(): Counters {
  return Object.fromEntries(
    DATASETS.map((key) => [
      key,
      {
        candidate: 0,
        imported: 0,
        already_present: 0,
        skipped_invalid: 0,
        skipped_conflict: 0,
      },
    ]),
  ) as Counters
}
export function newDiagnostics(): Diagnostics {
  return { counts: [], examples: [], truncated: false }
}
export function diagnose(
  diagnostics: Diagnostics,
  stage: Stage,
  code: ErrorCode,
  detail: { line?: number; dataset?: Dataset } = {},
  limit = DEFAULT_LIMITS.errors,
): void {
  const existing = diagnostics.counts.find(
    (entry) => entry.stage === stage && entry.code === code,
  )
  if (existing) existing.count++
  else diagnostics.counts.push({ stage, code, count: 1 })
  if (diagnostics.examples.length < limit)
    diagnostics.examples.push({ stage, code, ...detail })
  else diagnostics.truncated = true
}
export function emptyParsed(): ParsedSource {
  return {
    version: null,
    entities: [],
    hidden: null,
    counters: newCounters(),
    diagnostics: newDiagnostics(),
    fatal: false,
  }
}
