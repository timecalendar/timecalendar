import { subDays, subMinutes } from "date-fns"

/**
 * Number of days of inactivity before a calendar is considered inactive
 * and won't be synced automatically anymore.
 * This avoid syncing calendars that are not used anymore.
 */
export const INACTIVITY_DAYS = 14

/**
 * Number of minutes after the last update before a calendar is considered
 * outdated and should be synced.
 */
export const UPDATE_AFTER_MIN = 30

/** Cut-off before which a calendar counts as outdated (due for sync). */
export const calendarsDueBefore = () => subMinutes(new Date(), UPDATE_AFTER_MIN)

/** Cut-off after which a calendar counts as still active. */
export const calendarsActiveSince = () => subDays(new Date(), INACTIVITY_DAYS)
