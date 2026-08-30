import { Transform } from "class-transformer"

/**
 * Measured in UTF-16 code units, the unit `String.prototype.length`,
 * `@MaxLength` and React Native's `TextInput maxLength` all agree on — so a
 * client-side check and this server-side rule never disagree (emoji cost 2).
 */
export const CALENDAR_NAME_MAX_LENGTH = 100

/**
 * The last line before the non-null `calendar.name` column: an absent or
 * non-string name collapses to the empty string rather than reaching Postgres.
 */
export const normalizeCalendarName = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

/**
 * The DTO-level trim. Non-strings pass through **unchanged** so `@IsString()`
 * still rejects them with a 400; coercing them here would silently accept
 * `{ "name": 42 }` as an empty name.
 */
export const trimCalendarName = (value: unknown): unknown =>
  typeof value === "string" ? value.trim() : value

/**
 * Applied to every DTO property that writes a calendar name, so `@MaxLength`
 * always measures the trimmed value (class-transformer runs before
 * class-validator).
 */
export const TrimCalendarName = () =>
  Transform(({ value }) => trimCalendarName(value))
