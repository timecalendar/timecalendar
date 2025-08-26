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

/**
 * Maximum number of concurrent updates
 */
export const UPDATE_CONCURRENCY = 10
