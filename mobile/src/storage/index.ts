import { createMMKV, useMMKVString } from "react-native-mmkv"

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

// Reactive read bound to the seam's module-scoped instance (MMKV v4's
// useMMKVString → useSyncExternalStore over addOnValueChangedListener), so a
// preference change re-renders its consumers (design D3). Read-only: writes
// stay on the imperative setString above, keeping one write path. It lives here
// because react-native-mmkv is lint-banned outside the seam — feature code reads
// preferences through this, never the backend. Only the string variant is added;
// boolean/number reactive variants wait for a consumer (R-2).
export function useStoredString(key: string): string | undefined {
  return useMMKVString(key, storage)[0]
}
