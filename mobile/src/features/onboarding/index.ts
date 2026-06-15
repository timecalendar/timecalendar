// Feature barrel — the public surface of the onboarding flow's framing/brand UI
// (ADR 015). Presentation-only (splash-shaped): just a ui/ sublayer, no data/
// store/form. No cycle: the ui/ welcome screen consumes @/components / @/theme /
// expo-router / i18n and navigates by route path — never this barrel (B-2) and
// never the school-selection seams (B-1).
export { WelcomeScreen } from "./ui"
