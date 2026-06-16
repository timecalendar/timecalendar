import { getString, setString } from "@/storage"

import {
  encodeHiddenEvents,
  HIDDEN_EVENTS_KEYS,
  type HiddenEventsSet,
  parseHiddenEvents,
} from "./types"

// Imperative get/set for the hidden-events set over the @/storage seam (D2),
// mirroring school-selection/store/store.ts: pure, total reads + one write path.
// The reactive read lives in hooks.ts. This is the ONLY place touching @/storage
// for this feature (B-1).

// The current hidden set. Total: an unset/corrupt store reads as the empty set.
export function getHiddenEvents(): HiddenEventsSet {
  return parseHiddenEvents(getString(HIDDEN_EVENTS_KEYS.set))
}

// Read → produce the next set → write the whole encoded blob (drop+replace of the
// single record, Flutter parity). A setString failure throws — the failure surface
// the UI hook catches and records (D5).
function writeHiddenEvents(next: HiddenEventsSet): void {
  setString(HIDDEN_EVENTS_KEYS.set, encodeHiddenEvents(next))
}

// Append-if-absent (dedup — hiding an already-hidden value is a no-op; a Set is
// the correct RN model and the filter is membership, so dupes are invisible — we
// dedup on write to keep the blob clean).
function addUnique(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value]
}

// Hide a synced event by its uid (this instance). No-op if already hidden.
export function hideByUid(uid: string): void {
  const current = getHiddenEvents()
  writeHiddenEvents({
    ...current,
    uidHiddenEvents: addUnique(current.uidHiddenEvents, uid),
  })
}

// Hide all events sharing a title (a recurring class). No-op if already hidden.
export function hideByName(name: string): void {
  const current = getHiddenEvents()
  writeHiddenEvents({
    ...current,
    namedHiddenEvents: addUnique(current.namedHiddenEvents, name),
  })
}

// Un-hide a uid. No-op if absent.
export function unhideUid(uid: string): void {
  const current = getHiddenEvents()
  writeHiddenEvents({
    ...current,
    uidHiddenEvents: current.uidHiddenEvents.filter((v) => v !== uid),
  })
}

// Un-hide a name. No-op if absent.
export function unhideName(name: string): void {
  const current = getHiddenEvents()
  writeHiddenEvents({
    ...current,
    namedHiddenEvents: current.namedHiddenEvents.filter((v) => v !== name),
  })
}
