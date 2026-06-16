// Feature barrel — the public surface of the event-checklists cluster (ADR 024,
// Phase 05 Ship B). The interactive checklist component (consumed by the calendar
// event-details screen by full @/ path — a legitimate cross-feature ui→ui edge),
// plus the data surface the Phase-09 importer will use. No import cycle: the data/
// and ui/ sub-barrels import their seams directly, never each other or this barrel
// (the no-self-barrel-cycle rule, B-2).
export {
  add,
  type ChecklistItem,
  checklistItemToRow,
  findByEvent,
  newId,
  remove,
  reorder,
  rowToChecklistItem,
  setChecked,
  setContent,
} from "./data"
export { EventChecklist } from "./ui"
