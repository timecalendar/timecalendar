import { useCallback, useMemo, useState } from "react"

import { asc, checklistItems, db, eq, useLiveQuery } from "@/db"
import { recordError } from "@/firebase"

import { newId } from "./id"
import {
  add as addItem,
  remove as removeItem,
  reorder as reorderItems,
  setChecked as setCheckedItem,
  setContent as setContentItem,
} from "./repository"
import { type ChecklistItem, rowToChecklistItem } from "./types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import): re-renders the checklist section when an
// add/toggle/edit/reorder/delete mutates checklist_items for this event. Filters
// by eventUid + orders by `order` ascending (Flutter `findAllByEventUid`), maps
// row→domain. Total/infallible — an event with no items reads as the empty list.
export function useChecklist(eventUid: string): ChecklistItem[] {
  const { data } = useLiveQuery(
    db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.eventUid, eventUid))
      .orderBy(asc(checklistItems.order)),
    [eventUid],
  )
  return useMemo(() => data.map(rowToChecklistItem), [data])
}

export interface ChecklistActions {
  /** Append a blank item (1-based order = current count + 1); returns its uuid. */
  add: () => Promise<string | undefined>
  setContent: (uuid: string, content: string) => void
  setChecked: (uuid: string, isChecked: boolean) => void
  /** Swap with the previous item and persist the re-numbered order. */
  moveUp: (uuid: string) => void
  /** Swap with the next item and persist the re-numbered order. */
  moveDown: (uuid: string) => void
  remove: (uuid: string) => void
  /** True after a write threw — the UI surfaces an accessible failure state. */
  failed: boolean
}

// The write controller — the ONE place the UI calls checklist writes. A checklist
// write is a crash-worthy local-persistence failure (the data is irreplaceable,
// no server backup), so a thrown write records through @/firebase
// recordError(error, "event-checklists/<action>") AND flips an accessible failure
// flag (ADR 024 / decision 6, the calendar-sync replaceAll / hidden-events write
// posture). The reactive read feeds the order computation, so each action reads
// the live `items` it was given (the caller passes the current ordered list).
export function useChecklistActions(
  eventUid: string,
  items: ChecklistItem[],
): ChecklistActions {
  const [failed, setFailed] = useState(false)

  const run = useCallback(
    async (action: string, write: () => Promise<void>): Promise<void> => {
      try {
        await write()
        setFailed(false)
      } catch (error) {
        recordError(
          error instanceof Error ? error : new Error(String(error)),
          `event-checklists/${action}`,
        )
        setFailed(true)
      }
    },
    [],
  )

  const add = useCallback(async (): Promise<string | undefined> => {
    const uuid = newId()
    const now = new Date()
    // 1-based order = current count + 1 (Flutter `state.length + 1` on add).
    const item: ChecklistItem = {
      uuid,
      eventUid,
      content: "",
      isChecked: false,
      order: items.length + 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: undefined,
    }
    await run("add", () => addItem(item))
    return uuid
  }, [eventUid, items.length, run])

  const setContent = useCallback(
    (uuid: string, content: string) => {
      void run("setContent", () => setContentItem(uuid, content))
    },
    [run],
  )

  const setChecked = useCallback(
    (uuid: string, isChecked: boolean) => {
      void run("setChecked", () => setCheckedItem(uuid, isChecked))
    },
    [run],
  )

  // Swap `uuid` with its neighbor at `delta` (-1 up, +1 down), then persist the
  // whole re-numbered order in one transaction (Flutter `reorderItems` →
  // `updateItemOrders`). A no-op at the ends (the UI disables the control, but
  // guard anyway).
  const move = useCallback(
    (uuid: string, delta: number) => {
      const from = items.findIndex((i) => i.uuid === uuid)
      const to = from + delta
      if (from === -1 || to < 0 || to >= items.length) return
      const next = [...items]
      const moved = next[from]
      const target = next[to]
      if (moved === undefined || target === undefined) return
      next[from] = target
      next[to] = moved
      void run("reorder", () => reorderItems(next))
    },
    [items, run],
  )

  const moveUp = useCallback((uuid: string) => move(uuid, -1), [move])
  const moveDown = useCallback((uuid: string) => move(uuid, 1), [move])

  // Hard-delete (ADR 024 / decision 3) then re-number the remainder (Flutter
  // `removeItem` → `delete` → `updateItemOrders`) so orders stay contiguous 1-based.
  const remove = useCallback(
    (uuid: string) => {
      const remaining = items.filter((i) => i.uuid !== uuid)
      void run("remove", async () => {
        await removeItem(uuid)
        await reorderItems(remaining)
      })
    },
    [items, run],
  )

  return { add, setContent, setChecked, moveUp, moveDown, remove, failed }
}
