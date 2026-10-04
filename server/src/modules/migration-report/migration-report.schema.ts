import { z } from "zod"
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface"

export const MIGRATION_REPORT_PATH = "/v1/migration-reports"
export const MIGRATION_REPORT_MAX_BYTES = 16_384
export const MIGRATION_REPORT_RETENTION_DAYS = 180

export const MIGRATION_ERROR_CODES = {
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
} as const

const count = z.number().int().min(0).max(1_000_000)
const dataset = z.strictObject({
  candidate: count,
  imported: count,
  already_present: count,
  skipped_invalid: count,
  skipped_conflict: count,
})
const version = z
  .string()
  .max(20)
  .regex(/^\d{1,6}\.\d{1,6}\.\d{1,6}$/)
const timestamp = z.iso.datetime({ precision: 3 }).length(24)
const errors = Object.entries(MIGRATION_ERROR_CODES).map(([stage, codes]) =>
  z.strictObject({
    stage: z.literal(stage),
    code: z.enum(codes),
    count: z.number().int().min(1).max(1_000_000),
  }),
)

export const migrationReportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  reportId: z.uuidv4(),
  platform: z.enum(["ios", "android"]),
  targetAppVersion: version,
  targetBuild: z
    .string()
    .max(10)
    .regex(/^\d{1,10}$/),
  sourceAppVersion: version.optional(),
  sourceDatabaseVersion: z.number().int().min(0).max(2_147_483_647).optional(),
  osMajorVersion: z.number().int().min(1).max(100),
  startedAt: timestamp,
  completedAt: timestamp,
  durationMs: z.number().int().min(0).max(604_800_000),
  attemptCount: z.number().int().min(1).max(1000),
  outcome: z.enum(["success", "partial", "failed"]),
  reason: z.enum([
    "completed",
    "no_legacy_source",
    "empty_legacy_store",
    "malformed_source",
    "source_unavailable",
    "resource_limit",
    "target_failure",
    "integrity_failure",
  ]),
  datasets: z.strictObject({
    calendars: dataset,
    personal_events: dataset,
    checklist_items: dataset,
    hidden_events: dataset,
    preferences: dataset,
  }),
  errors: z.array(z.union(errors)).max(23),
  examplesTruncated: z.boolean(),
  calendarIds: z.array(z.uuid()).max(100),
  calendarIdsTruncated: z.boolean(),
})

export type MigrationReport = z.infer<typeof migrationReportSchema>

export const migrationReportOpenApiSchema = {
  ...z.toJSONSchema(migrationReportSchema, { target: "openapi-3.0" }),
  description:
    "Strict terminal migration report, at most 16384 uncompressed bytes. All nested objects reject unknown fields. completedAt must not precede startedAt. Calendar IDs and error stage/code pairs must be unique. Durations/counts are capped by the client; non-UUID calendar IDs are omitted and calendarIdsTruncated is set. No credentials or source content are allowed.",
} as SchemaObject

export function parseMigrationReport(input: unknown): MigrationReport | null {
  const result = migrationReportSchema.safeParse(input)
  if (!result.success) return null
  const report = result.data
  if (report.completedAt < report.startedAt) return null
  if (
    new Set(report.calendarIds.map((id) => id.toLowerCase())).size !==
    report.calendarIds.length
  )
    return null
  if (
    new Set(report.errors.map(({ stage, code }) => `${stage}:${code}`)).size !==
    report.errors.length
  )
    return null
  return report
}
