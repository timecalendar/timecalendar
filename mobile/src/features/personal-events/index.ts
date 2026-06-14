// The Personal-events feature barrel. The data layer (B1) and the form/UI logic
// layer (B2) each own a sub-barrel; this re-exports both for ergonomic feature
// imports. No cycle: form/* imports the data sub-barrel directly
// (@/features/personal-events/data), never this file.
export * from "./data"
export * from "./form"
