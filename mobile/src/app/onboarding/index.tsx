// Thin route entrypoint (route-screen rule): the tested screen lives in
// @/features/school-selection/ui so its colocated *.test.tsx stays out of the
// Metro route tree. Reachable via timecalendar-dev://onboarding.
export { SchoolPickerScreen as default } from "@/features/school-selection/ui"
