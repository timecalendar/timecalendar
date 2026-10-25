// The Compose date dialog speaks UTC days: it reads its initial value and
// reports the picked day as UTC midnight, independent of the device zone.

export function dateDialogValue(wallClock: Date): Date {
  return new Date(
    Date.UTC(
      wallClock.getFullYear(),
      wallClock.getMonth(),
      wallClock.getDate(),
    ),
  )
}

export function mergePickedDay(wallClock: Date, pickedUtcMidnight: Date): Date {
  return new Date(
    pickedUtcMidnight.getUTCFullYear(),
    pickedUtcMidnight.getUTCMonth(),
    pickedUtcMidnight.getUTCDate(),
    wallClock.getHours(),
    wallClock.getMinutes(),
  )
}
