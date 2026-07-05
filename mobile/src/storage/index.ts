import {
  createMMKV,
  useMMKVBoolean,
  useMMKVNumber,
  useMMKVString,
} from "react-native-mmkv"

// Thin seam over react-native-mmkv (v4 / Nitro) — the single place the app
// touches the KV backend, so it stays swappable and feature call sites import
// @/storage, never react-native-mmkv directly (lint-enforced, see eslint.config.js).
// One module-scoped instance with the default config. No JSON-object helper and
// no encryption/multi-instance until a consumer needs them (R-2).

const storage = createMMKV()

export function getString(key: string): string | undefined {
  return storage.getString(key)
}

export function setString(key: string, value: string): void {
  storage.set(key, value)
}

export function getBoolean(key: string): boolean | undefined {
  return storage.getBoolean(key)
}

export function setBoolean(key: string, value: boolean): void {
  storage.set(key, value)
}

export function getNumber(key: string): number | undefined {
  return storage.getNumber(key)
}

export function setNumber(key: string, value: number): void {
  storage.set(key, value)
}

export function has(key: string): boolean {
  return storage.contains(key)
}

export function remove(key: string): void {
  storage.remove(key)
}

// A JSON-array-of-strings type guard, shared by the total array parsers below and
// their callers (school-selection group values, the hidden-events record fields).
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
}

// The single total parser for a JSON-encoded array stored as a KV blob —
// consolidating school-selection's parseGroupValues, the hidden-events record-
// field parse, and calendar-sync's decodeJsonArray. It reproduces their posture
// VERBATIM: this guards irreplaceable, no-server-backup local data, so an
// undefined, non-JSON, non-array, or guard-failing value decodes to the empty
// array and NEVER throws. The optional `guard` validates the whole parsed array
// (e.g. isStringArray); with no `guard` it casts `as T[]` WITHOUT element
// validation (the exact decodeJsonArray behavior — the calendar-sync columns are
// notNull, so `raw` is always a string there and the undefined branch is unreached).
export function parseJsonArray<T>(
  raw: string | undefined,
  guard?: (v: unknown) => v is T[],
): T[] {
  if (raw === undefined) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    if (guard !== undefined && !guard(parsed)) return []
    return parsed as T[]
  } catch {
    return []
  }
}

// Reactive read bound to the seam's module-scoped instance (MMKV v4's
// useMMKVString → useSyncExternalStore over addOnValueChangedListener), so a
// preference change re-renders its consumers (design D3). Read-only: writes
// stay on the imperative setString above, keeping one write path. It lives here
// because react-native-mmkv is lint-banned outside the seam — feature code reads
// preferences through this, never the backend.
export function useStoredString(key: string): string | undefined {
  return useMMKVString(key, storage)[0]
}

// The reactive parsed read — the shared `parser(useStoredString(key))` pairing
// that settings prefs, school selection, and hidden events each wrote by hand.
// Read-only (same posture as useStoredString): the parser total-decodes the
// reactive raw string into the typed value on every change. It calls
// useStoredString once, unconditionally, so it substitutes for the hand-written
// pair without touching the hooks-rules contract.
export function useParsedStoredString<T>(
  key: string,
  parser: (raw: string | undefined) => T,
): T {
  return parser(useStoredString(key))
}

// The boolean/number reactive variants, added alongside useStoredString when the
// notifications prefs feature (the source-of-truth subscription store, ADR 027)
// needed reactive boolean (isActive) and number (nbDaysAhead) reads. Same
// read-only posture — writes stay on the imperative setBoolean/setNumber.
export function useStoredBoolean(key: string): boolean | undefined {
  return useMMKVBoolean(key, storage)[0]
}

export function useStoredNumber(key: string): number | undefined {
  return useMMKVNumber(key, storage)[0]
}

// A synchronous Storage-shaped adapter over the seam's instance, for the
// TanStack Query offline persister (createSyncStoragePersister, ADR 013 / D1).
// It lives HERE — not in the query feature — because react-native-mmkv is
// lint-banned outside src/storage/: the persister rides the seam, never the
// backend. MMKV is synchronous (JSI/Nitro), so the sync Storage shape is the
// natural fit (no async restore gate). getItem returns null (not undefined) on
// a miss, which is what createSyncStoragePersister expects.
export const mmkvQueryStorage = {
  getItem(key: string): string | null {
    return getString(key) ?? null
  },
  setItem(key: string, value: string): void {
    setString(key, value)
  },
  removeItem(key: string): void {
    remove(key)
  },
}
