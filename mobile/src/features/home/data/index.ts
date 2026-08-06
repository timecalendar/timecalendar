// The home feature's data sub-barrel: the pure "what day to show + digest"
// selectors (the only new logic in this ship).
export {
  type DayCaption,
  dayCaption,
  dynamicHourRange,
  eventsForDay,
  type GreetingPeriod,
  type GreetingSelection,
  greetingSelection,
  type HourRange,
  type NextActiveDay,
  nextActiveDay,
  remainingEvents,
  splitDayEvents,
} from "./selectors"
