import { asc, checklistItems, db, eq } from "@/db"

import {
  type ChecklistItem,
  checklistItemToRow,
  rowToChecklistItem,
} from "./types"

// Async CRUD over the @/db seam — a module of functions, no class (R-2,
// mirroring user-calendars/repository.ts and calendar/data/sync/repository.ts).
// The ONLY @/db import site for checklist_items (B-1). Imports {db}, the table,
// and the operators `eq`/`asc` from @/db only; never drizzle-orm/expo-sqlite
// directly (lint-enforced). The pure mappers convert at the row↔domain boundary.
//
// CI proves the query shape + the mapping against the mocked seam (the
// query-builder spy) + a write/read-back restart-sim against a stateful fake;
// real table materialization + on-disk survival are on-device (the inbox manual
// pass — checklist_items is irreplaceable, no server backup).

// Read a single event's checklist — Flutter `findAllByEventUid`: filter by
// eventUid, order by `order` ascending. NO `deletedAt IS NULL` filter — Flutter
// has none, delete is hard (ADR 024 / decision 3).
export async function findByEvent(eventUid: string): Promise<ChecklistItem[]> {
  const rows = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.eventUid, eventUid))
    .orderBy(asc(checklistItems.order))
  return rows.map(rowToChecklistItem)
}

// Insert one item — Flutter `insert` (`_store.record(uuid).put`). Accepts a fully
// formed domain item so the Phase-09 importer can supply its own recovered uuid +
// dates (the newId() / now stamping is the actions hook's job, not the
// repository's — mirroring the importer-bypass posture of the other tables).
export async function add(item: ChecklistItem): Promise<void> {
  await db.insert(checklistItems).values(checklistItemToRow(item))
}

// Update the one content column + stamp updatedAt (Flutter `editItem` → `update`
// stamps updatedAt = now).
export async function setContent(uuid: string, content: string): Promise<void> {
  await db
    .update(checklistItems)
    .set({ content, updatedAt: new Date().toISOString() })
    .where(eq(checklistItems.uuid, uuid))
}

// Update the one isChecked column + stamp updatedAt.
export async function setChecked(
  uuid: string,
  isChecked: boolean,
): Promise<void> {
  await db
    .update(checklistItems)
    .set({ isChecked, updatedAt: new Date().toISOString() })
    .where(eq(checklistItems.uuid, uuid))
}

// Re-number every item's `order` 1-based in the given (new) order and write them
// in ONE db.transaction — the Flutter `updateItemOrders` → transactional
// `updateAll`. Atomic so a crash mid-reorder never leaves duplicate/gap orders.
// Stamps updatedAt on each touched row.
export async function reorder(items: ChecklistItem[]): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction(async (tx) => {
    for (const [index, item] of items.entries()) {
      await tx
        .update(checklistItems)
        .set({ order: index + 1, updatedAt: now })
        .where(eq(checklistItems.uuid, item.uuid))
    }
  })
}

// HARD delete (ADR 024 / decision 3 — Flutter `_store.delete(finder:
// Filter.byKey(uuid))`). The actions hook re-numbers the remainder after.
export async function remove(uuid: string): Promise<void> {
  await db.delete(checklistItems).where(eq(checklistItems.uuid, uuid))
}
