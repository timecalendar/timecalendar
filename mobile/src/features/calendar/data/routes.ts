// The origin-keyed event route — pure routing logic shared by every screen that
// taps through to an event (home today/upcoming, the calendar grid + agenda). A
// synced calendar event carries a userCalendarId → the read-only details screen;
// a personal event (no userCalendarId) → its editable form. The single source for
// "where does tapping an event go", so the home + calendar screens stay
// presentational and the routing contract is unit-tested.

import { type Href } from "expo-router"

export function eventRoute(uid: string, userCalendarId?: string | null): Href {
  return userCalendarId !== undefined && userCalendarId !== null
    ? `/event-details/${uid}`
    : `/personal-event-form?uid=${uid}`
}
