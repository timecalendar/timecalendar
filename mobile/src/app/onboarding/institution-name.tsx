// Thin route entrypoint (route-structure rule): the unlisted-institution step,
// reached from the school picker's "I can't find my school" action. The screen
// lives in @/features/onboarding/ui (no colocated test — Metro bundles every
// *.tsx under src/app/ as a route).
export { InstitutionNameScreen as default } from "@/features/onboarding/ui"
