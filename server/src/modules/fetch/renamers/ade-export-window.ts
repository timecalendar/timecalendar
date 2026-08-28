export const ADE_EXPORT_WINDOW_MONTHS_PAST = 12
export const ADE_EXPORT_WINDOW_MONTHS_FUTURE = 12

const shiftUtcCalendarMonths = (date: Date, months: number) => {
  const targetMonthIndex = date.getUTCMonth() + months
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12)
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate()

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      Math.min(date.getUTCDate(), lastDayOfTargetMonth),
    ),
  )
}

const formatUtcCalendarDate = (date: Date) => date.toISOString().slice(0, 10)

export const getAdeExportWindow = (currentDate: Date) => ({
  firstDate: formatUtcCalendarDate(
    shiftUtcCalendarMonths(currentDate, -ADE_EXPORT_WINDOW_MONTHS_PAST),
  ),
  lastDate: formatUtcCalendarDate(
    shiftUtcCalendarMonths(currentDate, ADE_EXPORT_WINDOW_MONTHS_FUTURE),
  ),
})
