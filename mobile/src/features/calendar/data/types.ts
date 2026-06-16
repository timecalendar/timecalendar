// The calendar's domain event shape. It exposes ergonomic domain types (`Date`
// timestamps, a `#RRGGBB` color) and is DESIGNED AGAINST the eventual sync model:
// the sync-model fields (allDay/teachers/tags/canceled/userCalendarId) mirror the
// Flutter `calendar_event.toDbMap()` wire format so the later calendar-sync ship's
// `calendar_events` table maps onto this shape with the ADR-011/018 importer-
// fidelity posture — WITHOUT a shape change to any consumer.
//
// NOT persisted in this ship: the events-source seam (events.ts) feeds this from
// a fixture + the personal-events read; the sync ship swaps the source behind the
// unchanged hook. The optional/empty sync fields stay empty until then.
export interface CalendarEvent {
  /** uid. */
  id: string
  title: string
  /** #RRGGBB. */
  color: string
  startsAt: Date
  endsAt: Date
  location: string | undefined
  allDay: boolean
  description: string | undefined
  // Designed-in for sync (the sync ship populates these from calendar_events;
  // empty/false until then):
  teachers: string[]
  tags: string[]
  canceled: boolean
  userCalendarId: string | undefined
}
