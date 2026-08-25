import type { UserCalendar } from "@/features/calendar-sources/data"

export type CalendarSummary =
  | { state: "loading" }
  | {
      state: "loaded"
      calendarCount: number
      schoolCount: number
      schoolName: string | undefined
    }

function clean(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/\s+/g, " ")
  return cleaned ? cleaned : undefined
}

function normalizedName(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US")
}

export function deriveCalendarSummary(
  calendars: readonly UserCalendar[],
  loaded: boolean,
): CalendarSummary {
  if (!loaded) return { state: "loading" }

  const idSchools = new Map<string, Map<string, string>>()
  const nameOnlySchools = new Map<string, string>()

  for (const calendar of calendars) {
    const schoolId = clean(calendar.schoolId)
    const schoolName = clean(calendar.schoolName)
    if (schoolId) {
      const names = idSchools.get(schoolId) ?? new Map<string, string>()
      if (schoolName) names.set(normalizedName(schoolName), schoolName)
      idSchools.set(schoolId, names)
    } else if (schoolName) {
      nameOnlySchools.set(normalizedName(schoolName), schoolName)
    }
  }

  const idBackedNames = new Set(
    [...idSchools.values()].flatMap((names) => [...names.keys()]),
  )
  for (const name of idBackedNames) nameOnlySchools.delete(name)

  const schoolCount = idSchools.size + nameOnlySchools.size
  let schoolName: string | undefined
  if (schoolCount === 1) {
    if (idSchools.size === 1) {
      const names = [...idSchools.values()][0]!
      schoolName = [...names.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      )[0]?.[1]
    } else {
      schoolName = [...nameOnlySchools.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      )[0]?.[1]
    }
  }

  return {
    state: "loaded",
    calendarCount: calendars.length,
    schoolCount,
    schoolName,
  }
}
