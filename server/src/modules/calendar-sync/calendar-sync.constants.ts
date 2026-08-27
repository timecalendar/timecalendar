import { subDays } from "date-fns"

/**
 * Number of days of inactivity before a calendar is considered inactive
 * and won't be synced automatically anymore.
 * This avoid syncing calendars that are not used anymore.
 */
export const INACTIVITY_DAYS = 14

/** Cut-off after which a calendar counts as still active. */
export const calendarsActiveSince = () => subDays(new Date(), INACTIVITY_DAYS)

/** Interactive sync work must leave time for response hydration and transport. */
export const USER_SYNC_WORK_DEADLINE_MS = 10_000
export const USER_SYNC_CONCURRENCY = 3
export const ICAL_ATTEMPT_TIMEOUT_MS = 7_000
export const ICAL_RETRY_ATTEMPTS = 2
export const ICAL_FETCH_BUDGET_MS = 9_000
export const MOBILE_REQUEST_TIMEOUT_MS = 15_000
