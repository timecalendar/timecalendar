export { CalendarScreen as default } from "@/features/calendar/ui"

// The Calendar tab's screen — the day/week/agenda timeline (the heart of the app,
// Flutter parity). A thin entrypoint over the calendar feature's ui sub-barrel
// (route-structure rule; the screen's own test lives beside it). Wrapped by the
// sibling _layout's Stack so the screen owns the native nav bar (the month title +
// the view-menu / Today / Add header actions). The URL is still /calendar.
