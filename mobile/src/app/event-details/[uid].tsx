// Thin route entrypoint (route-screen rule): the tested screen lives in
// @/features/calendar/ui/event-details-screen so its colocated *.test.tsx stays
// out of the Metro route tree. Reachable as a Stack sibling of (tabs) (wired in
// _layout.tsx) and via the dev deep link
// timecalendar-dev://event-details/<uid>.
export { EventDetailsScreen as default } from "@/features/calendar/ui"
