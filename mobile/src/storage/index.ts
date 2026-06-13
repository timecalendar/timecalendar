import { createMMKV } from "react-native-mmkv"

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
