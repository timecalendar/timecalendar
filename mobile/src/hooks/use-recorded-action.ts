import { useCallback, useState } from "react"

import { recordUnknownError } from "@/firebase"

// The shared write controller behind every write-capable feature's action hook
// (docs review R-1). A local-persistence write is crash-worthy (the data is
// device-local, no server backup), so a throw is recorded through the @/firebase
// observability seam under a context tag AND flips an accessible `failed` flag
// the screen surfaces (ADR 024 / D6). Before this hook each feature hand-rolled
// the identical `[failed, setFailed]` + try/catch/record wrapper; now a feature
// adding a write gets the recording + failable flag for free instead of
// re-deriving it (and possibly forgetting the record).
//
// The context tag is `${scope}/${action}` for the house style (e.g.
// "hidden-events/hideByUid"); a feature whose sites carry a full literal context
// omits `scope` so the bare `action` string is recorded verbatim.

export interface RecordedAction {
  // Run a write, recording a throw (never swallowed) and flipping `failed`. An
  // async write resolves to a Promise<boolean>; a sync write returns a plain
  // boolean — so a feature whose action interface is synchronous (HideActions)
  // keeps it. `true` iff the write persisted.
  run(action: string, write: () => Promise<void>): Promise<boolean>
  run(action: string, write: () => void): boolean
  // True after the most recent run threw; the next successful run clears it.
  failed: boolean
}

export function useRecordedAction(scope = ""): RecordedAction {
  const [failed, setFailed] = useState(false)

  const run = useCallback(
    (
      action: string,
      write: () => void | Promise<void>,
    ): boolean | Promise<boolean> => {
      const context = scope ? `${scope}/${action}` : action
      const succeed = (): true => {
        setFailed(false)
        return true
      }
      const fail = (error: unknown): false => {
        recordUnknownError(error, context)
        setFailed(true)
        return false
      }
      try {
        const result = write()
        // A sync write already resolved; an async write records on rejection
        // (a sync try/catch cannot catch a Promise rejection, hence the split).
        return result instanceof Promise
          ? result.then(succeed, fail)
          : succeed()
      } catch (error) {
        return fail(error)
      }
    },
    [scope],
  )

  return { run: run as RecordedAction["run"], failed }
}
