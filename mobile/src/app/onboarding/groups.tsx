// Thin route entrypoint (route-screen rule): the group step screen lives in
// @/components/onboarding so its colocated *.test.tsx stays out of the Metro
// route tree. Reachable via timecalendar-dev://onboarding/groups?schoolId=<id>.
export { default } from "@/components/onboarding/school-group-picker-screen"
