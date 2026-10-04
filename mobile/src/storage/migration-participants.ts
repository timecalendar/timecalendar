import {
  getBoolean,
  getNativeEditFingerprint,
  getNumber,
  getString,
  has,
  setBoolean,
  setNumber,
  setString,
  STORAGE_KEYS,
} from "./index"

export interface MigrationNativeStore {
  has(key: string): boolean
  read(
    key: string,
    type: "string" | "number" | "boolean",
  ): string | number | boolean | undefined
  write(key: string, value: string | number | boolean): void
  editedFingerprint(key: string): string | undefined
}

export const migrationNativeStore: MigrationNativeStore = {
  has,
  editedFingerprint: getNativeEditFingerprint,
  read(key, type) {
    return type === "boolean"
      ? getBoolean(key)
      : type === "number"
        ? getNumber(key)
        : getString(key)
  },
  write(key, value) {
    if (typeof value === "boolean") setBoolean(key, value)
    else if (typeof value === "number") setNumber(key, value)
    else setString(key, value)
  },
}

export function getStartupTab(): "home" | "calendar" {
  return getString(STORAGE_KEYS.startupTab) === "calendar" ? "calendar" : "home"
}

export function isMigrationOnboardingSuppressed(): boolean {
  return getBoolean(STORAGE_KEYS.migrationSuppressed) === true
}
