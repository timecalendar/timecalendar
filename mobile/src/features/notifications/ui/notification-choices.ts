import type { NotificationFrequency } from "@/features/notifications/data"

export const NOTIFICATION_FREQUENCIES = [
  { value: "immediately", labelKey: "notifications.frequency.immediately" },
  { value: "hourly", labelKey: "notifications.frequency.hourly" },
  { value: "daily", labelKey: "notifications.frequency.daily" },
] as const satisfies readonly {
  value: NotificationFrequency
  labelKey:
    | "notifications.frequency.immediately"
    | "notifications.frequency.hourly"
    | "notifications.frequency.daily"
}[]

export const NOTIFICATION_DAY_PRESETS = [1, 3, 7, 14, 30] as const

export type NotificationDaysChoice =
  | `${(typeof NOTIFICATION_DAY_PRESETS)[number]}`
  | "custom"

export const NOTIFICATION_DAY_CHOICES = [
  ...NOTIFICATION_DAY_PRESETS.map((value) => ({
    value: String(value) as NotificationDaysChoice,
    days: value,
  })),
  { value: "custom" as const, days: null },
] as const

export function selectedDaysChoice(days: number): NotificationDaysChoice {
  return NOTIFICATION_DAY_PRESETS.includes(
    days as (typeof NOTIFICATION_DAY_PRESETS)[number],
  )
    ? (String(days) as NotificationDaysChoice)
    : "custom"
}

export type CustomDaysValidation =
  | { state: "valid"; value: number }
  | { state: "empty" }
  | { state: "invalid" }
  | { state: "range" }

export function validateCustomDays(input: string): CustomDaysValidation {
  const value = input.trim()
  if (value.length === 0) return { state: "empty" }
  if (!/^\d+$/.test(value)) return { state: "invalid" }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 30) {
    return { state: "range" }
  }
  return { state: "valid", value: parsed }
}
