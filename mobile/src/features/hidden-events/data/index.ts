// The hidden-events data sub-barrel: the persisted set (the @/storage seam, the
// total parser, the four-mutator write path) + the reactive read + the
// observability-wrapped hide actions. data/ is the only place touching @/storage
// (B-1, ADR 023).
export { type HideActions, useHiddenEvents, useHideActions } from "./hooks"
export {
  getHiddenEvents,
  hideByName,
  hideByUid,
  unhideName,
  unhideUid,
} from "./store"
export {
  emptyHiddenEvents,
  encodeHiddenEvents,
  HIDDEN_EVENTS_KEYS,
  type HiddenEventsSet,
  parseHiddenEvents,
} from "./types"
