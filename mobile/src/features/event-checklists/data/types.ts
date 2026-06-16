import { checklistItems } from "@/db"

// The domain ChecklistItem type and the pure row↔domain mappers that isolate the
// TEXT-ISO + integer-boolean storage format (ADR 024) from ergonomic domain
// types. Pure (no `db`, no React, no t()) so they unit-test exhaustively without
// any SQLite mock — and they carry the importer-fidelity guarantee:
// checklistItemToRow always writes a canonical UTC ISO-8601 string (toISOString())
// for any present date, the property the TEXT date columns rely on.
//
// The three dates are NULLABLE (the Flutter model's createdAt/updatedAt/deletedAt
// are DateTime?) — null in the row ↔ undefined in the domain. `deletedAt` is a
// vestigial wire-format field kept only for verbatim importer fidelity (ADR 024 /
// decision 3 — delete is hard, deletedAt is never set or read by the app).

type ChecklistItemRow = typeof checklistItems.$inferSelect
type ChecklistItemInsert = typeof checklistItems.$inferInsert

export interface ChecklistItem {
  uuid: string
  /** The owning event's uid — a personal_events.uid OR a calendar_events.uid. */
  eventUid: string
  content: string
  isChecked: boolean
  /** 1-based ordinal position (Flutter parity). */
  order: number
  createdAt: Date | undefined
  updatedAt: Date | undefined
  deletedAt: Date | undefined
}

// Parse a stored row into the domain type: TEXT ISO strings → Date, null dates →
// undefined; `isChecked` is already a boolean (Drizzle's `mode: "boolean"`
// surfaces 0/1 as boolean).
export function rowToChecklistItem(row: ChecklistItemRow): ChecklistItem {
  return {
    uuid: row.uuid,
    eventUid: row.eventUid,
    content: row.content,
    isChecked: row.isChecked,
    order: row.order,
    createdAt: row.createdAt === null ? undefined : new Date(row.createdAt),
    updatedAt: row.updatedAt === null ? undefined : new Date(row.updatedAt),
    deletedAt: row.deletedAt === null ? undefined : new Date(row.deletedAt),
  }
}

// Serialize a domain item into a row: Date → canonical UTC ISO-8601 string
// (toISOString() always emits the canonical `…Z` form), undefined dates → null.
// `isChecked` is handled by Drizzle's boolean mode.
export function checklistItemToRow(item: ChecklistItem): ChecklistItemInsert {
  return {
    uuid: item.uuid,
    eventUid: item.eventUid,
    content: item.content,
    isChecked: item.isChecked,
    order: item.order,
    createdAt:
      item.createdAt === undefined ? null : item.createdAt.toISOString(),
    updatedAt:
      item.updatedAt === undefined ? null : item.updatedAt.toISOString(),
    deletedAt:
      item.deletedAt === undefined ? null : item.deletedAt.toISOString(),
  }
}
