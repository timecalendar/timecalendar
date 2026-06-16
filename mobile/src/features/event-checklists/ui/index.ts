// The event-checklists feature's ui sub-barrel — the presentational checklist
// section. The calendar event-details screen imports it through the feature barrel
// (a legitimate cross-feature edge by full @/ path); the screen never imports the
// data seam directly (B-1) — the component owns the data hooks.
export { EventChecklist } from "./event-checklist"
