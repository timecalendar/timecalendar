import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"

export interface CalendarChange<
  T extends EventForChangeDetection = EventForChangeDetection,
> {
  oldItems: T[]
  newItems: T[]
  changedItems: [T, T][]
}
