import { STORAGE_KEYS } from "@/storage"
import { fixtureSource } from "@/test-support/legacy-fixtures"

import { preferenceCandidates } from "./preferences"
import { emptyParsed } from "./types"

it("maps every allowed preference without importing deliberately dropped settings", () => {
  const source = fixtureSource(false)
  Object.assign(source.preferences, {
    date_limit: { state: "value", value: 14 },
    calendar_view_type: { state: "value", value: "Day" },
    calendar_hour_height: { state: "value", value: 90 },
    colors_by_group: { state: "value", value: true },
    new_activity: { state: "value", value: true },
    last_activity_update: { state: "value", value: 1 },
    private: { state: "value", value: "SECRET" },
  })
  expect(
    preferenceCandidates(source, emptyParsed()).map(({ key, value }) => [
      key,
      value,
    ]),
  ).toEqual([
    [STORAGE_KEYS.theme, "dark"],
    [STORAGE_KEYS.changelogSeenVersion, 2],
    [STORAGE_KEYS.notificationIsActive, false],
    [STORAGE_KEYS.showWeekends, false],
    [STORAGE_KEYS.startupTab, "calendar"],
  ])
})

it.each([true, false])(
  "maps dark_mode %s only when theme is absent",
  (value) => {
    const source = fixtureSource(false, false)
    source.preferences.dark_mode = { state: "value", value }
    expect(preferenceCandidates(source, emptyParsed())[0]?.value).toBe(
      value ? "dark" : "system",
    )
    source.preferences.theme = { state: "value", value: "light" }
    expect(preferenceCandidates(source, emptyParsed())[0]?.value).toBe("light")
  },
)

it.each([
  "theme",
  "dark_mode",
  "current_version",
  "notification_calendar",
  "startup_screen",
  "show_weekends",
] as const)("isolates invalid type/read failure for %s", (key) => {
  for (const state of ["invalid_type", "read_failed"] as const) {
    const source = fixtureSource(false)
    if (key === "dark_mode") source.preferences.theme = { state: "absent" }
    source.preferences[key] = { state }
    const parsed = emptyParsed()
    expect(preferenceCandidates(source, parsed)).toHaveLength(4)
    expect(parsed.diagnostics.counts).toEqual([
      { stage: "normalize", code: "INVALID_PREFERENCE", count: 1 },
    ])
  }
})

it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 5, "2"])(
  "rejects invalid/future changelog value %p without clamping",
  (value) => {
    const source = fixtureSource(false)
    source.preferences.current_version = { state: "value", value }
    const parsed = emptyParsed()
    expect(
      preferenceCandidates(source, parsed).some(
        (c) => c.key === STORAGE_KEYS.changelogSeenVersion,
      ),
    ).toBe(false)
    expect(parsed.counters.current_version.skipped_invalid).toBe(1)
  },
)

it("keeps no-source preferences absent and never falls back from an invalid theme", () => {
  const source = fixtureSource(false, false)
  expect(preferenceCandidates(source, emptyParsed())).toEqual([])
  source.preferences.theme = { state: "value", value: "invalid" }
  source.preferences.dark_mode = { state: "value", value: true }
  expect(preferenceCandidates(source, emptyParsed())).toEqual([])
})
