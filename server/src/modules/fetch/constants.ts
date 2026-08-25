import { join } from "path/posix"

export const SCHOOL_STRATEGIES = "SCHOOL_STRATEGIES"

export const DATA_PATH = join(__dirname, "..", "..", "data")

/**
 * Minimum number of minutes between two upstream fetches of the same calendar,
 * for a school that does not declare its own interval.
 * A strategy overrides it with `minSyncIntervalMinutes`.
 */
export const DEFAULT_MIN_SYNC_INTERVAL_MINUTES = 30
