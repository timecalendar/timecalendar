// The event-checklists feature's data sub-barrel — the public surface: the domain
// type + pure mappers, the uid wrapper, the repository functions, and the reactive
// read + write-controller hooks. The ui/ component consumes this sibling sub-barrel
// directly (never the feature barrel — the no-self-barrel-cycle rule, B-2).
export {
  type ChecklistActions,
  useChecklist,
  useChecklistActions,
} from "./hooks"
export { newId } from "./id"
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
