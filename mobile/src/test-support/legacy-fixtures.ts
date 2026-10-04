import type { LegacyMigrationSource } from "@/features/legacy-migration/data/native-source"

export const FIXTURE_TIME = "2026-03-29T00:30:00.000Z"
export const FIXTURE_ID = "00000000-0000-4000-8000-000000000001"
export const FIXTURE_CALENDAR = {
  id: FIXTURE_ID,
  token: "SYNTHETIC_PRIVATE_TOKEN",
  name: "SYNTHETIC_PRIVATE_CALENDAR",
  schoolId: null,
  schoolName: "Université 🦉",
  createdAt: FIXTURE_TIME,
  lastUpdatedAt: "2026-03-29T03:30:00+02:00",
  visible: false,
}
export const FIXTURE_EVENT = {
  uid: "synthetic-personal",
  title: "SYNTHETIC_PRIVATE_EVENT 🦉",
  color: "#aAbBcC",
  startsAt: FIXTURE_TIME,
  endsAt: "2026-03-29T03:30:00+02:00",
  exportedAt: FIXTURE_TIME,
  location: "",
  description: null,
}
export const FIXTURE_CHECKLIST = {
  uuid: "synthetic-checklist",
  eventUid: "synthetic-school-event",
  content: "SYNTHETIC_PRIVATE_CHECKLIST",
  isChecked: true,
  order: 2,
  createdAt: "2026-03-28T12:00:00.000",
  updatedAt: FIXTURE_TIME,
  deletedAt: FIXTURE_TIME,
}
export const FIXTURE_HIDDEN = {
  uidHiddenEvents: ["SYNTHETIC_PRIVATE_HIDDEN_UID"],
  namedHiddenEvents: ["SYNTHETIC_PRIVATE_HIDDEN_NAME"],
}
export const legacyLine = (
  store: string,
  key: string | number,
  value: unknown,
) => ({ store, key, value })
export function fixtureLines(version = 3): unknown[] {
  return [
    { version, sembast: 1 },
    legacyLine(
      "user_calendars",
      version < 3 ? 1 : FIXTURE_ID,
      FIXTURE_CALENDAR,
    ),
    legacyLine(
      "personal_events",
      "synthetic-personal",
      version === 1
        ? {
            ...FIXTURE_EVENT,
            startsAt: undefined,
            endsAt: undefined,
            exportedAt: undefined,
            start: FIXTURE_EVENT.startsAt,
            end: FIXTURE_EVENT.endsAt,
          }
        : FIXTURE_EVENT,
    ),
    legacyLine("checklist_items", "synthetic-checklist", FIXTURE_CHECKLIST),
    legacyLine("hidden_events", 3, FIXTURE_HIDDEN),
    legacyLine("calendar_events", "cache", { title: "CACHE_NOT_IMPORTED" }),
    legacyLine("calendar_logs", "cache", { text: "CACHE_NOT_IMPORTED" }),
  ]
}
export const encodeLines = (lines: unknown[]) =>
  lines.map((line) => JSON.stringify(line)).join("\n") + "\n"
export async function* byteChunks(value: string | Uint8Array, size = 17) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value
  for (let offset = 0; offset < bytes.length; offset += size)
    yield bytes.subarray(offset, offset + size)
}
export function fixtureSource(
  database = true,
  preferences = true,
): LegacyMigrationSource {
  return {
    database: database
      ? {
          uri: "synthetic://simple_database.db",
          sizeBytes: 1024,
          modifiedAtMs: null,
        }
      : null,
    preferences: preferences
      ? {
          theme: { state: "value", value: "dark" },
          dark_mode: { state: "value", value: false },
          current_version: { state: "value", value: 2 },
          notification_calendar: { state: "value", value: false },
          startup_screen: { state: "value", value: "calendar" },
          show_weekends: { state: "value", value: false },
        }
      : {
          theme: { state: "absent" },
          dark_mode: { state: "absent" },
          current_version: { state: "absent" },
          notification_calendar: { state: "absent" },
          startup_screen: { state: "absent" },
          show_weekends: { state: "absent" },
        },
    platformEvidence: { preferenceBackend: "ios-user-defaults" },
  }
}
