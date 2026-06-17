// Thin route entrypoint (route-screen rule): the tested screen lives in
// @/features/notifications/ui so its colocated *.test.tsx stays out of the
// Metro route tree. Reachable as a Stack sibling of (tabs) (wired in
// _layout.tsx) and via the dev deep link timecalendar-dev://notification-settings.
export { NotificationSettingsScreen as default } from "@/features/notifications/ui"
