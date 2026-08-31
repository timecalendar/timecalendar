import {
  getString,
  setString,
  STORAGE_KEYS,
  useParsedStoredString,
} from "@/storage"

export type FirstIcalReminderState = "pending" | "dismissed"

export function parseFirstIcalReminderState(
  value: string | undefined,
): FirstIcalReminderState {
  return value === "dismissed" ? "dismissed" : "pending"
}

export function getFirstIcalReminderState(): FirstIcalReminderState {
  return parseFirstIcalReminderState(
    getString(STORAGE_KEYS.firstIcalReminderState),
  )
}

export function dismissFirstIcalReminder(): void {
  setString(STORAGE_KEYS.firstIcalReminderState, "dismissed")
}

export function useFirstIcalReminderState(): FirstIcalReminderState {
  return useParsedStoredString(
    STORAGE_KEYS.firstIcalReminderState,
    parseFirstIcalReminderState,
  )
}
