// The event route — pure routing logic shared by every screen that taps through
// to an event (home today/upcoming, the calendar grid + agenda). BOTH kinds now
// open the UNIFIED event-details screen (ADR 024 / decision 4 — Flutter parity,
// both EventInterface open the same EventDetailsScreen with a checklist). The
// personal-event edit/delete flow is reached via an "Edit" header action on that
// details screen (relocate-don't-drop, superseding ADR 022's personal→form tap).
// The single source for "where does tapping an event go", so the home + calendar
// screens stay presentational and the routing contract is unit-tested.
//
// The userCalendarId parameter is retained (the call sites pass it) but no longer
// discriminates the destination — the details screen resolves the kind itself from
// the uid (calendar_events vs. personal_events). Kept so a future routing split
// (the ADR 024 revisit) is a one-helper change again.

import { type Href } from "expo-router"

export function eventRoute(uid: string, _userCalendarId?: string | null): Href {
  return `/event-details/${uid}`
}
