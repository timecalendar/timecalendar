// Thin route entrypoint (route-screen rule): the tested screen lives in
// @/features/personal-events/ui/personal-event-form-screen so its colocated
// *.test.tsx stays out of the Metro route tree. Reachable as a Stack sibling of
// (tabs) (wired in _layout.tsx) and via the dev deep links
// timecalendar-dev://personal-event-form (create) and
// timecalendar-dev://personal-event-form?uid=<uid> (edit).
export { PersonalEventFormScreen as default } from "@/features/personal-events/ui"
