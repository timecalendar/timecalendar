// The Compose date picker reads and confirms UTC-midnight day millis whatever
// the device zone (DatePickerView.kt, pinned in compose-date-day.test.ts).

export function composeDayOf(local: Date): Date {
  return new Date(
    Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()),
  )
}

export function fromComposeDay(picked: Date, timeOfDay: Date): Date {
  return new Date(
    picked.getUTCFullYear(),
    picked.getUTCMonth(),
    picked.getUTCDate(),
    timeOfDay.getHours(),
    timeOfDay.getMinutes(),
  )
}
