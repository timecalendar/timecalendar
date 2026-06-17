import { NotificationSubscriptionCreateFrequency } from "@/api/generated/timeCalendar.schemas"

// The three persisted notification preferences (design Decision 1). The API is
// PUT-only (no GET), so MMKV is the source of truth: a read parses the raw
// stored value through a TOTAL parser (unset / corrupt / legacy / out-of-range →
// the default, never throws), exactly mirroring settings/prefs — a bad write can
// never produce an invalid preference, crash, or a DTO the server would 400.

// The frequency union is the generated const-union's values (not re-declared
// literals), so the wire contract is the single source of the three options.
export type NotificationFrequency = NotificationSubscriptionCreateFrequency

// Flat namespaced storage keys (the i18n flat-key convention applied to storage
// for greppability — the string in code is the string in the store).
export const NOTIFICATION_KEYS = {
  frequency: "notifications.frequency",
  nbDaysAhead: "notifications.nbDaysAhead",
  isActive: "notifications.isActive",
} as const

// Defaults (Flutter parity + safe-by-default): opt-in, immediate, a conservative
// week horizon.
export const NOTIFICATION_DEFAULTS = {
  // Flutter's legacy /fcm/subscribe default was `date_limit ?? 14`, but the DTO
  // range is 1..30 and the home/agenda surfaces a week — 7 is the conservative
  // reminder horizon (deliberate, trivially changed).
  nbDaysAhead: 7,
  frequency: NotificationSubscriptionCreateFrequency.immediately,
  isActive: true,
} as const

// The DTO clamps nbDaysAhead to [1,30] (@minimum 1 / @maximum 30 on the schema);
// the parser clamps on read so a corrupt store can never produce an out-of-range
// value the server would reject.
const NB_DAYS_MIN = 1
const NB_DAYS_MAX = 30

const FREQUENCIES = Object.values(NotificationSubscriptionCreateFrequency)

// Any value outside the union (unset / corrupt / legacy) → "immediately".
export function parseFrequency(raw: string | undefined): NotificationFrequency {
  return FREQUENCIES.includes(raw as NotificationFrequency)
    ? (raw as NotificationFrequency)
    : NOTIFICATION_DEFAULTS.frequency
}

// Non-number / NaN → the default; otherwise floor + clamp to [1,30].
export function parseNbDaysAhead(raw: number | undefined): number {
  if (raw === undefined || Number.isNaN(raw)) {
    return NOTIFICATION_DEFAULTS.nbDaysAhead
  }
  return Math.min(NB_DAYS_MAX, Math.max(NB_DAYS_MIN, Math.floor(raw)))
}

// Unset → true (opt-in default, matching Flutter `notification_calendar ?? true`).
export function parseIsActive(raw: boolean | undefined): boolean {
  return raw ?? NOTIFICATION_DEFAULTS.isActive
}
