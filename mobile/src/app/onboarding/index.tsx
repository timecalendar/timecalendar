// Thin route entrypoint (route-screen rule): the onboarding entry is now the
// welcome surface (ADR 015 — welcome-first), whose tested screen lives in
// @/features/onboarding/ui so its colocated *.test.tsx stays out of the Metro
// route tree. Reachable via timecalendar-dev://onboarding.
export { WelcomeScreen as default } from "@/features/onboarding/ui"
