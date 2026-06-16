import { useCallback, useState } from "react"

import { recordError } from "@/firebase"
import { useStoredString } from "@/storage"

import { hideByName, hideByUid, unhideName, unhideUid } from "./store"
import {
  HIDDEN_EVENTS_KEYS,
  type HiddenEventsSet,
  parseHiddenEvents,
} from "./types"

// Reactive hidden-set read over the seam's useStoredString (so the calendar views
// and the management screen re-render when the set changes), mirroring
// useSelectedSchool. Reads through the reactive seam read + the total parser;
// writes stay on the imperative store (one write path — see store.ts).
export function useHiddenEvents(): HiddenEventsSet {
  return parseHiddenEvents(useStoredString(HIDDEN_EVENTS_KEYS.set))
}

export interface HideActions {
  // Each returns `true` when the write persisted, `false` when it threw (and was
  // recorded). The caller gates navigation on success so a failed write keeps the
  // screen mounted and its accessible failure banner visible (ADR 023 / D5).
  hideByUid: (uid: string) => boolean
  hideByName: (name: string) => boolean
  unhideUid: (uid: string) => boolean
  unhideName: (name: string) => boolean
  // True after a write threw — the screen surfaces an accessible failure state.
  failed: boolean
}

// The four mutators wrapped with the observability + failure-state handling (D5)
// — the ONE place the UI calls writes. A hidden-set write is a crash-worthy
// local-persistence failure (the user's hide/un-hide intent did not persist and
// there is no server backup), so a thrown write records through @/firebase
// recordError(error, "hidden-events/<action>") AND flips an accessible failure
// flag, mirroring the personal-events write / calendar-sync replaceAll posture.
export function useHideActions(): HideActions {
  const [failed, setFailed] = useState(false)

  const run = useCallback((action: string, write: () => void): boolean => {
    try {
      write()
      setFailed(false)
      return true
    } catch (error) {
      recordError(
        error instanceof Error ? error : new Error(String(error)),
        `hidden-events/${action}`,
      )
      setFailed(true)
      return false
    }
  }, [])

  return {
    hideByUid: useCallback(
      (uid: string) => run("hideByUid", () => hideByUid(uid)),
      [run],
    ),
    hideByName: useCallback(
      (name: string) => run("hideByName", () => hideByName(name)),
      [run],
    ),
    unhideUid: useCallback(
      (uid: string) => run("unhideUid", () => unhideUid(uid)),
      [run],
    ),
    unhideName: useCallback(
      (name: string) => run("unhideName", () => unhideName(name)),
      [run],
    ),
    failed,
  }
}
