import { CHANGELOG_VERSION } from "@/features/changelog/data"
import { STORAGE_KEYS } from "@/storage"

import type { LegacyMigrationSource } from "./native-source"
import {
  type Dataset,
  diagnose,
  type NativeCandidate,
  type ParsedSource,
} from "./types"

export function preferenceCandidates(
  source: LegacyMigrationSource,
  parsed: ParsedSource,
): NativeCandidate[] {
  const candidates: NativeCandidate[] = []
  const add = (
    dataset: Dataset,
    key: string,
    value: string | number | boolean,
  ) => {
    parsed.counters[dataset].candidate++
    candidates.push({ dataset, key, value })
  }
  const invalid = (dataset: Dataset) => {
    parsed.counters[dataset].candidate++
    parsed.counters[dataset].skipped_invalid++
    diagnose(parsed.diagnostics, "normalize", "INVALID_PREFERENCE", { dataset })
  }
  const preferences = source.preferences
  let theme = preferences.theme
  if (theme.state === "absent") {
    const fallback = preferences.dark_mode
    if (fallback.state === "value" && typeof fallback.value === "boolean")
      theme = { state: "value", value: fallback.value ? "dark" : "system" }
    else if (fallback.state !== "absent") theme = { state: "invalid_type" }
  }
  if (theme.state !== "absent") {
    if (
      theme.state === "value" &&
      ["system", "light", "dark"].includes(theme.value as string)
    )
      add("theme", STORAGE_KEYS.theme, theme.value)
    else invalid("theme")
  }
  const version = preferences.current_version
  if (version.state !== "absent") {
    if (
      version.state === "value" &&
      typeof version.value === "number" &&
      Number.isSafeInteger(version.value) &&
      version.value >= 0 &&
      version.value <= CHANGELOG_VERSION
    )
      add("current_version", STORAGE_KEYS.changelogSeenVersion, version.value)
    else invalid("current_version")
  }
  for (const [dataset, key] of [
    ["notification_calendar", STORAGE_KEYS.notificationIsActive],
    ["show_weekends", STORAGE_KEYS.showWeekends],
  ] as const) {
    const pref = preferences[dataset]
    if (pref.state === "absent") continue
    if (pref.state === "value" && typeof pref.value === "boolean")
      add(dataset, key, pref.value)
    else invalid(dataset)
  }
  const startup = preferences.startup_screen
  if (startup.state !== "absent") {
    if (
      startup.state === "value" &&
      (startup.value === "home" || startup.value === "calendar")
    )
      add("startup_screen", STORAGE_KEYS.startupTab, startup.value)
    else invalid("startup_screen")
  }
  if (parsed.hidden)
    candidates.push({
      dataset: "hidden_events",
      key: STORAGE_KEYS.hiddenEvents,
      value: JSON.stringify(parsed.hidden),
    })
  return candidates
}
