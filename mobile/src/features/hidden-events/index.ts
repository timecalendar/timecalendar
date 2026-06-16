// The Hidden-events feature barrel. The data layer (the MMKV hidden-set store +
// the reactive read + the observability-wrapped hide actions) and the ui layer
// (the management screen) each own a sub-barrel; this re-exports both for
// ergonomic feature imports. No cycle (B-2): the ui/ screen imports the data
// sub-barrel directly (@/features/hidden-events/data), never this file.
export * from "./data"
export * from "./ui"
