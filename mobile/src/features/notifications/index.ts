// The notifications feature barrel — re-exports the data and ui sublayers for
// ergonomic feature imports. No cycle (B-2): ui/* imports the data sub-barrel
// directly (@/features/notifications/data), never this file.
export * from "./data"
export * from "./ui"
