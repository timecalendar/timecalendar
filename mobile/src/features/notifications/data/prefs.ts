import {
  getBoolean,
  getNumber,
  getString,
  setBoolean,
  setNumber,
  setString,
  useStoredBoolean,
  useStoredNumber,
  useStoredString,
} from "@/storage"

import {
  NOTIFICATION_KEYS,
  type NotificationFrequency,
  parseFrequency,
  parseIsActive,
  parseNbDaysAhead,
} from "./types"

// The local source of truth for the three notification preferences (design
// Decision 1 / ADR 027) — the PUT-only API has no read-back, so MMKV holds the
// state and the registration seam PUTs it idempotently. Mirrors settings/prefs:
// imperative get/set over the @/storage seam, each read validated through the
// total parsers, plus reactive read hooks so the prefs screen re-renders on a
// change. This is the ONLY place the notifications feature touches @/storage (B-1).

export function getFrequency(): NotificationFrequency {
  return parseFrequency(getString(NOTIFICATION_KEYS.frequency))
}

export function setFrequency(frequency: NotificationFrequency): void {
  setString(NOTIFICATION_KEYS.frequency, frequency)
}

export function getNbDaysAhead(): number {
  return parseNbDaysAhead(getNumber(NOTIFICATION_KEYS.nbDaysAhead))
}

export function setNbDaysAhead(nbDaysAhead: number): void {
  // Persist the clamped value so the store never holds an out-of-range number.
  setNumber(NOTIFICATION_KEYS.nbDaysAhead, parseNbDaysAhead(nbDaysAhead))
}

export function getIsActive(): boolean {
  return parseIsActive(getBoolean(NOTIFICATION_KEYS.isActive))
}

export function setIsActive(isActive: boolean): void {
  setBoolean(NOTIFICATION_KEYS.isActive, isActive)
}

// Reactive reads over the seam's useStored* (re-render consumers on a change),
// each validated through the total parsers — a read is infallible (Decision 6:
// the reactive prefs read never records).
export function useFrequency(): NotificationFrequency {
  return parseFrequency(useStoredString(NOTIFICATION_KEYS.frequency))
}

export function useNbDaysAhead(): number {
  return parseNbDaysAhead(useStoredNumber(NOTIFICATION_KEYS.nbDaysAhead))
}

export function useIsActive(): boolean {
  return parseIsActive(useStoredBoolean(NOTIFICATION_KEYS.isActive))
}
