# Follow-up owner clarifications

Status: Owner clarifications recorded on 2026-09-12. The consolidated product contract remains
pending approval. This document supplements rather than rewrites the four historical answer rounds.

## Why this document exists

After reading the consolidated product draft, the owner clarified the intended boundary of the
Monday-first launch decision and questioned why imported all-day events were described as floating
dates. The discussion exposed one maintainability requirement and one terminology ambiguity. It did
not add Sunday-first launch behavior or change the accepted semantics of standard imported all-day
events.

## Week-start clarification

- Monday remains the first weekday for the initial delivery in French, English, and every display
  timezone.
- Sunday-first, locale-derived, and user-configurable week-start behavior remain outside launch
  scope.
- Monday is a launch product-policy value, not a permanent renderer invariant. Technical design
  must make the first weekday an explicit policy input so later Sunday-first support does not
  require rewriting week arithmetic, paging, or layout.
- Show weekends filters Saturday and Sunday by weekday identity. It must not be implemented by
  blindly taking or dropping positional columns in a way that would break a future week-start
  policy.

This clarification refines `S-009`, `S-012`, `N-002`, `N-006`, `N-007`, `N-012`, `N-013`, `T-001`,
`D-006`–`D-008`, `D-012`, `D-016`, and `Q-005` without changing their statuses.

## All-day terminology clarification

- In the supported iCalendar import semantics, a standard all-day event is a date-only range. Its
  dates do not carry an event timezone and therefore retain the same names when the selected
  display timezone changes.
- The end date remains exclusive.
- An imported event defined by date-time or instant boundaries remains timed even if it spans one
  or more whole wall-clock days. Display-timezone projection may split it across different or
  multiple local dates.
- A provider-specific representation that combines an all-day presentation flag with meaningful
  timezone-bearing boundaries is not part of the current launch contract. Supporting one later
  requires an explicit domain decision; duration or midnight boundaries are not enough to infer it.

This terminology matches iCalendar's distinction between `DATE` and `DATE-TIME`: `TZID` cannot be
applied to a `DATE`, and a `VEVENT` with a `DATE` start uses a `DATE` end. Google Calendar likewise
documents all-day events as date ranges for which the timezone field has no significance.

Sources:

- [RFC 5545, TZID parameter](https://datatracker.ietf.org/doc/html/rfc5545#section-3.2.19)
- [RFC 5545, event component](https://datatracker.ietf.org/doc/html/rfc5545#section-3.6.1)
- [Google Calendar event types](https://developers.google.com/workspace/calendar/api/concepts/events-calendars#events)

This clarification refines `E-005`, `E-008`, and `D-016` without changing their statuses.

## Readiness effect

The product remains a draft awaiting consolidated owner approval. The bounded research rows and six
architecture-stage unanswered rows are unchanged.
