export { CalendarScreen as default } from "@/features/calendar/ui"

// The Calendar tab — the day/week/agenda timeline (the heart of the app, Flutter
// parity). A thin entrypoint over the calendar feature's ui sub-barrel
// (route-structure rule; the screen's own test lives beside it). Moved into the
// (tabs) group from a bare Stack sibling so it has a front door: the path is
// still /calendar (groups don't affect the URL), so the
// timecalendar-dev://calendar deep link + Maestro flow keep working.
