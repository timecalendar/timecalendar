// The event-checklists feature's data sub-barrel — the public surface: the domain
// type + pure mappers, the repository functions, and the reactive read + write-
// controller hooks. The ui/ component consumes this sibling sub-barrel directly
// (never the feature barrel — the no-self-barrel-cycle rule, B-2). The uid
// generator now lives on the @/db seam (newId) — no per-feature re-export.
export {
  type ChecklistActions,
  useChecklist,
  useChecklistActions,
} from "./hooks"
export {
  aggregateChecklistProgress,
  type ChecklistProgress,
  type ChecklistProgressMap,
  useChecklistProgress,
} from "./progress"
export {
  add,
  findByEvent,
  remove,
  reorder,
  setChecked,
  setContent,
} from "./repository"
export {
  type ChecklistItem,
  checklistItemToRow,
  rowToChecklistItem,
} from "./types"
