// Thin route entrypoint (route-screen rule): the school step, moved from index
// when the welcome surface became the onboarding entry (ADR 015 — welcome-first).
// The screen lives in @/features/school-selection/ui (unchanged — ship 2 grows
// the picker); the welcome CTA pushes here. Reachable via
// timecalendar-dev://onboarding/school.
export { SchoolPickerScreen as default } from "@/features/school-selection/ui"
