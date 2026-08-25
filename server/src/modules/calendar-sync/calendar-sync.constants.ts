import { subDays } from "date-fns"

/**
 * Number of days of inactivity before a calendar is considered inactive
 * and won't be synced automatically anymore.
 * This avoid syncing calendars that are not used anymore.
 */
export const INACTIVITY_DAYS = 14

/** Cut-off after which a calendar counts as still active. */
export const calendarsActiveSince = () => subDays(new Date(), INACTIVITY_DAYS)
