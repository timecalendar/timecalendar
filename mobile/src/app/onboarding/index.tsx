// Thin route entrypoint (route-screen rule): the tested screen lives in
// @/components/onboarding so its colocated *.test.tsx stays out of the Metro
// route tree. Reachable via timecalendar-dev://onboarding.
export { default } from "@/components/onboarding/school-picker-screen"
