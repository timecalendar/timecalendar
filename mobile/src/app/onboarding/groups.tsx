// Thin route entrypoint (route-screen rule): the group step screen lives in
// @/features/school-selection/ui so its colocated *.test.tsx stays out of the
// Metro route tree. Reachable via timecalendar-dev://onboarding/groups?schoolId=<id>.
export { SchoolGroupPickerScreen as default } from "@/features/school-selection/ui"
