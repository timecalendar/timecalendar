// The home feature barrel — the today / next-up landing surface composing the
// landed calendar + personal-events seams (ADR 022). The data sub-barrel owns the
// pure displayed-day/digest selectors; ui owns the screen. No cycle (B-2): the ui
// screen imports the data sub-barrel directly (@/features/home/data), never this file.
export * from "./data"
export { HomeScreen } from "./ui"
