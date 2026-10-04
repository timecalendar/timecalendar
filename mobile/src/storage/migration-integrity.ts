import { sha256 } from "@noble/hashes/sha256"
import { bytesToHex } from "@noble/hashes/utils"

const TRACKED_KEYS = [
  "settings.themePreference",
  "changelogSeenVersion",
  "notifications.isActive",
  "navigation.startupTab",
  "settings.showWeekends",
  "hiddenEvents.set",
  "onboarding.migrationSuppressed",
]
export const MIGRATION_EDITS_KEY = "legacyMigration.nativeEdits.v1"
interface Store {
  getString(key: string): string | undefined
  set(key: string, value: string): void
}

export function nativeFingerprint(value: string | number | boolean): string {
  let canonical: unknown = value
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>
        if (
          Array.isArray(record.uidHiddenEvents) &&
          Array.isArray(record.namedHiddenEvents) &&
          record.uidHiddenEvents.every((v) => typeof v === "string") &&
          record.namedHiddenEvents.every((v) => typeof v === "string")
        )
          canonical = {
            uidHiddenEvents: [...new Set(record.uidHiddenEvents)],
            namedHiddenEvents: [...new Set(record.namedHiddenEvents)],
          }
      }
    } catch {
      /* Ordinary string preferences are not JSON. */
    }
  }
  return bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(canonical))))
}

function edits(store: Store): Record<string, string> {
  try {
    const value: unknown = JSON.parse(
      store.getString(MIGRATION_EDITS_KEY) ?? "{}",
    )
    if (!value || typeof value !== "object" || Array.isArray(value)) return {}
    return Object.fromEntries(
      Object.entries(value).filter(
        ([key, hash]) =>
          TRACKED_KEYS.includes(key) &&
          typeof hash === "string" &&
          /^[a-f0-9]{64}$/.test(hash),
      ),
    )
  } catch {
    return {}
  }
}

export function recordMigrationEdit(
  store: Store,
  key: string,
  value: string | number | boolean,
): void {
  if (!TRACKED_KEYS.includes(key)) return
  // Local hashes distinguish normal RN choices from a missing/divergent restore;
  // they never enter migration reports or any observability surface.
  try {
    store.set(
      MIGRATION_EDITS_KEY,
      JSON.stringify({ ...edits(store), [key]: nativeFingerprint(value) }),
    )
  } catch {
    /* An integrity witness failure must not reject a successful user edit. */
  }
}

export function getMigrationEdit(
  store: Store,
  key: string,
): string | undefined {
  return edits(store)[key]
}
