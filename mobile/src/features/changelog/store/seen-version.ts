import { getNumber, setNumber } from "@/storage"

export const CHANGELOG_SEEN_VERSION_KEY = "changelogSeenVersion"

export function getChangelogSeenVersion(): number | undefined {
  try {
    const value: unknown = getNumber(CHANGELOG_SEEN_VERSION_KEY)
    return typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0
      ? value
      : undefined
  } catch {
    return undefined
  }
}

export function setChangelogSeenVersion(version: number): void {
  setNumber(CHANGELOG_SEEN_VERSION_KEY, version)
}
