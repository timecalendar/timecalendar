import { useCallback } from "react"

import { removeCalendarSourceHealth } from "@/features/calendar-sources/store"
import { useRecordedAction } from "@/hooks/use-recorded-action"

import { remove, setVisible } from "./repository"

export interface UserCalendarActions {
  // Each resolves `true` when the write persisted, `false` when it rejected (and
  // was recorded). The screen gates its post-delete announce on the resolved
  // boolean so a failed write keeps the screen mounted and its accessible failure
  // banner visible (D5, mirroring HideActions).
  setVisible: (id: string, visible: boolean) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  // True after a write rejected — the screen surfaces an accessible failure state.
  failed: boolean
}

// The two user-calendar mutators wrapped with the shared write controller
// (useRecordedAction, D5) — the ONE place the UI calls these writes. A user-
// calendar write is a crash-worthy local-persistence failure (the visibility /
// delete intent did not persist and there is no server backup), so a rejected
// write records through @/firebase under "user-calendars/<action>" AND flips an
// accessible failure flag, mirroring useHideActions. The repository writes are
// async (Promise<void>), so this uses the async run overload (Promise<boolean>).
export function useUserCalendarActions(): UserCalendarActions {
  const { run, failed } = useRecordedAction("user-calendars")

  return {
    setVisible: useCallback(
      (id: string, visible: boolean) =>
        run("setVisible", () => setVisible(id, visible)),
      [run],
    ),
    remove: useCallback(
      (id: string) =>
        run("remove", async () => {
          await remove(id)
          removeCalendarSourceHealth(id)
        }),
      [run],
    ),
    failed,
  }
}
