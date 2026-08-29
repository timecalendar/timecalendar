/**
 * Redaction for anything this harness prints.
 *
 * `EXPLAIN` output is not an aggregate. PostgreSQL embeds the literal values of
 * index conditions and filters in the plan, which for the Activity read path
 * means calendar UUIDs and — once Ticket 2 resolves tokens in SQL — calendar
 * tokens, verbatim, on the `Index Cond` line:
 *
 *   Index Cond: (("calendarId" = ANY ('{6f9619ff-...}'::uuid[])) AND ...)
 *
 * The harness only ever runs against synthetic fixtures, so in practice there is
 * nothing to protect. This exists anyway, for two reasons: it is what makes the
 * harness safe to point at a preproduction database later without re-litigating
 * the question, and it turns "do not paste identifiers into the gate document"
 * from a reviewer's habit into a tested code path.
 */

export const REDACTED = "‹redacted›"

// Canonical 8-4-4-4-12 UUID, case-insensitive. Matched before the string-literal
// pass so a bare (unquoted) UUID in a plan line is still covered.
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

// A single-quoted SQL string literal, allowing the doubled-quote escape ('').
// This is what catches tokens, event titles, locations, and cursor values —
// every free-text value a plan can carry.
const STRING_LITERAL_PATTERN = /'(?:[^']|'')*'/g

/**
 * Replaces every UUID and every single-quoted string literal with {@link REDACTED}.
 *
 * Deliberately blunt: a plan line that loses a harmless literal is a cosmetic
 * loss, whereas a plan line that keeps an identifying one is the failure this
 * whole ticket is built to avoid. Numeric costs, row estimates, buffer counts,
 * and node names are untouched, which is everything the plan evidence is
 * actually read for.
 */
export const redactPlan = (text: string): string =>
  text.replace(UUID_PATTERN, REDACTED).replace(STRING_LITERAL_PATTERN, REDACTED)
