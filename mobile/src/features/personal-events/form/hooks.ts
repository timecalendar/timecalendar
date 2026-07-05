import { useCallback, useEffect, useState } from "react"

import {
  getById,
  type PersonalEvent,
  remove as removeEvent,
  upsert,
} from "@/features/personal-events/data"
import { useRecordedAction } from "@/hooks/use-recorded-action"

// The save/delete mutation hooks and the prefill loader (design D2/D6). Thin
// async wrappers over B1's repository: the screen only triggers them; all
// persistence is B1's. The error path is REAL here (unlike A1's infallible MMKV)
// — a device-local DB write can fail, so a rejection is recorded through the
// @/firebase observability seam (never swallowed) and surfaced to the screen as
// a failure flag.

interface SaveEvent {
  save: (event: PersonalEvent) => Promise<boolean>
  failed: boolean
}

// Persist an assembled event via the repository upsert (one write path for
// create + edit, keyed by uid). Returns true on success; on rejection records
// the error and returns false (the screen shows error.saveFailed).
export function useSaveEvent(): SaveEvent {
  const { run, failed } = useRecordedAction()

  const save = useCallback(
    (event: PersonalEvent): Promise<boolean> =>
      run("Failed to save personal event", () => upsert(event)),
    [run],
  )

  return { save, failed }
}

interface DeleteEvent {
  remove: (uid: string) => Promise<boolean>
  failed: boolean
}

// Remove an event via the repository remove. Same error-path contract as save.
export function useDeleteEvent(): DeleteEvent {
  const { run, failed } = useRecordedAction()

  const remove = useCallback(
    (uid: string): Promise<boolean> =>
      run("Failed to delete personal event", () => removeEvent(uid)),
    [run],
  )

  return { remove, failed }
}

// Load an existing event for prefill (edit mode). Returns undefined while
// loading and for create (no uid). The screen seeds its form state once the
// event resolves. setState happens only inside the async resolution callback
// (never synchronously in the effect body — react-hooks/set-state-in-effect),
// guarded by `active` so a stale fetch (uid changed mid-flight) is dropped.
export function useEventToEdit(uid?: string): PersonalEvent | undefined {
  const [event, setEvent] = useState<PersonalEvent | undefined>(undefined)

  useEffect(() => {
    if (uid === undefined) {
      return
    }
    let active = true
    void getById(uid).then((loaded) => {
      if (active) {
        setEvent(loaded)
      }
    })
    return () => {
      active = false
    }
  }, [uid])

  return event
}
