import {
  type ChecklistItem,
  checklistItemToRow,
  rowToChecklistItem,
} from "./types"

// Pure mapper tests (90% data gate) — the irreplaceable-data correctness floor:
// round-trip identity, canonical-UTC normalization, null↔undefined dates, bool↔0/1,
// and importer-fidelity verbatim (a toMap()-shaped row maps with no value change).

// The stored-row shape rowToChecklistItem reads (the Drizzle $inferSelect: the
// nullable dates are `string | null`, not optional — what the DB returns).
type ChecklistRow = Parameters<typeof rowToChecklistItem>[0]

const item: ChecklistItem = {
  uuid: "11111111-1111-4111-8111-111111111111",
  eventUid: "ev-1",
  content: "Bring the lab coat",
  isChecked: true,
  order: 2,
  createdAt: new Date("2026-06-14T09:00:00.000Z"),
  updatedAt: new Date("2026-06-15T10:30:00.000Z"),
  deletedAt: undefined,
}

const row: ChecklistRow = {
  uuid: "11111111-1111-4111-8111-111111111111",
  eventUid: "ev-1",
  content: "Bring the lab coat",
  isChecked: true,
  order: 2,
  createdAt: "2026-06-14T09:00:00.000Z",
  updatedAt: "2026-06-15T10:30:00.000Z",
  deletedAt: null,
}

describe("checklist-item mappers", () => {
  it("rowToChecklistItem parses a row into the domain type", () => {
    const result = rowToChecklistItem(row)
    expect(result.uuid).toBe(item.uuid)
    expect(result.eventUid).toBe("ev-1")
    expect(result.content).toBe("Bring the lab coat")
    expect(result.isChecked).toBe(true)
    expect(result.order).toBe(2)
    expect(result.createdAt?.getTime()).toBe(item.createdAt?.getTime())
    expect(result.updatedAt?.getTime()).toBe(item.updatedAt?.getTime())
    expect(result.deletedAt).toBeUndefined()
  })

  it("checklistItemToRow serializes a domain item into a row", () => {
    expect(checklistItemToRow(item)).toEqual(row)
  })

  it("round-trips row→domain→row identically", () => {
    expect(checklistItemToRow(rowToChecklistItem(row))).toEqual(row)
  })

  it("normalizes a write to canonical UTC ISO-8601", () => {
    // A non-UTC Date stringifies to the canonical `…Z` form.
    const local = new Date("2026-06-14T11:00:00+02:00")
    const out = checklistItemToRow({ ...item, createdAt: local })
    expect(out.createdAt).toBe("2026-06-14T09:00:00.000Z")
  })

  it("maps null dates ↔ undefined", () => {
    const allNull: ChecklistRow = {
      ...row,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    }
    const domain = rowToChecklistItem(allNull)
    expect(domain.createdAt).toBeUndefined()
    expect(domain.updatedAt).toBeUndefined()
    expect(domain.deletedAt).toBeUndefined()
    expect(checklistItemToRow(domain)).toEqual(allNull)
  })

  it("maps isChecked false ↔ a row that round-trips", () => {
    const unchecked = rowToChecklistItem({ ...row, isChecked: false })
    expect(unchecked.isChecked).toBe(false)
    expect(checklistItemToRow(unchecked).isChecked).toBe(false)
  })

  it("preserves a non-null deletedAt verbatim (importer fidelity)", () => {
    // The importer may write a recovered sembast record carrying a non-null
    // deletedAt — the column exists ONLY to round-trip it (ADR 024 / decision 3).
    const deleted: ChecklistRow = {
      ...row,
      deletedAt: "2026-06-16T08:00:00.000Z",
    }
    const domain = rowToChecklistItem(deleted)
    expect(domain.deletedAt?.toISOString()).toBe("2026-06-16T08:00:00.000Z")
    expect(checklistItemToRow(domain)).toEqual(deleted)
  })

  it("maps a toMap()-shaped record with no value change (importer fidelity)", () => {
    // The Flutter toMap() emits exactly these keys; the mapper imports them with
    // no transformation that could corrupt or drop data.
    const toMapShaped: ChecklistRow = {
      uuid: "22222222-2222-4222-8222-222222222222",
      eventUid: "ev-2",
      content: "Revise chapter 4",
      isChecked: false,
      order: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      deletedAt: null,
    }
    expect(checklistItemToRow(rowToChecklistItem(toMapShaped))).toEqual(
      toMapShaped,
    )
  })
})
