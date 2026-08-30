import type { ActivityLog } from "@/features/activity/data"

import { buildActivitySections } from "./activity-items"

const event = (uid: string) => ({
  uid,
  title: uid,
  startsAt: "2026-08-30T10:00:00.000Z",
  endsAt: "2026-08-30T11:00:00.000Z",
  location: null,
})

const log = (
  id: string,
  createdAt: string,
  change: ActivityLog["change"],
): ActivityLog => ({
  id,
  calendarId: "cal",
  calendarName: "Calendar",
  change,
  createdAt: new Date(createdAt),
  updatedAt: new Date(createdAt),
})

describe("buildActivitySections", () => {
  it("orders groups newest first and children new, changed, cancelled", () => {
    const sections = buildActivitySections([
      log("older", "2026-08-29T10:00:00Z", {
        oldItems: [event("cancelled")],
        newItems: [event("new")],
        changedItems: [
          { previousItem: event("previous"), newItem: event("changed") },
        ],
      }),
      log("newer", "2026-08-30T10:00:00Z", {
        oldItems: [],
        newItems: [event("newest")],
        changedItems: [],
      }),
    ])
    expect(sections.map((section) => section.log.id)).toEqual([
      "newer",
      "older",
    ])
    expect(sections[1]?.data.map((item) => item.kind)).toEqual([
      "new",
      "changed",
      "cancelled",
    ])
  })

  it("maps newItems to new and oldItems to cancelled", () => {
    const [section] = buildActivitySections([
      log("log", "2026-08-30T10:00:00Z", {
        oldItems: [event("old")],
        newItems: [event("new")],
        changedItems: [],
      }),
    ])
    expect(section?.data[0]).toMatchObject({ kind: "new" })
    expect(section?.data[1]).toMatchObject({ kind: "cancelled" })
  })

  it("omits an all-empty change payload", () => {
    expect(
      buildActivitySections([
        log("empty", "2026-08-30T10:00:00Z", {
          oldItems: [],
          newItems: [],
          changedItems: [],
        }),
      ]),
    ).toEqual([])
  })

  it("keeps keys unique when two logs touch the same event", () => {
    const sections = buildActivitySections([
      log("one", "2026-08-30T10:00:00Z", {
        oldItems: [],
        newItems: [event("same")],
        changedItems: [],
      }),
      log("two", "2026-08-29T10:00:00Z", {
        oldItems: [],
        newItems: [event("same")],
        changedItems: [],
      }),
    ])
    const keys = sections.flatMap((section) =>
      section.data.map((item) => item.key),
    )
    expect(new Set(keys).size).toBe(keys.length)
  })
})
