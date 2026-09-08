import { isDevVariant } from "@/config/variant"
import type {
  ExportGuideCatalogue,
  ExportGuidePinnedSnapshot,
} from "@/features/export-guides/data"
import type { SchoolListItem } from "@/features/school-selection/data"

import { importJourneyReducer } from "./context"
import {
  canEnterProtectedRoute,
  earliestLegalRoute,
  nextRouteAfterConnect,
  nextRouteAfterInstitution,
  nextRouteAfterProgramme,
} from "./routes"
import { initialImportJourneyState } from "./types"

jest.mock("@/config/variant", () => ({ isDevVariant: jest.fn(() => false) }))

const school: SchoolListItem = {
  id: "school",
  name: "School",
  code: "SCH",
  imageUrl: "https://assets.example.com/school.png",
  imageUrlDark: null,
  intranetUrl: "https://example.com/connect",
  exportGuide: {
    providerSlug: "provider",
    requireProgramme: false,
    requireConnect: false,
    catalogueVersion: "v1",
  },
}
const snapshot: ExportGuidePinnedSnapshot = {
  locale: "en",
  catalogueVersion: "v1",
  providerSlug: "provider",
  providerLabel: "Provider",
  reason: "exact",
  pages: [{ title: "One", description: "One" }],
}
const catalogue: ExportGuideCatalogue = {
  schemaVersion: 1,
  catalogueVersion: "v1",
  locale: "en",
  providers: [],
  rejectedProviders: {},
}
const empty = initialImportJourneyState()
const listed = importJourneyReducer(empty, { type: "set-listed", school })
const unlisted = importJourneyReducer(empty, {
  type: "set-unlisted",
  schoolName: "School",
})

describe("journey defensive transitions", () => {
  it("models resolution, selection, blocking and their stale-result guards", () => {
    const start = {
      type: "start-resolution" as const,
      locale: "en" as const,
      selector: { kind: "active" as const },
      attempt: 1,
    }
    expect(importJourneyReducer(empty, start)).toBe(empty)
    const resolving = importJourneyReducer(listed, start)
    expect(resolving.phase).toBe("resolving")

    const selection = {
      type: "show-provider-selection" as const,
      locale: "en" as const,
      catalogue,
      providers: [],
      draftRevision: 1,
    }
    expect(
      importJourneyReducer(empty, { ...selection, draftRevision: 0 }),
    ).toBe(empty)
    expect(importJourneyReducer(listed, selection).phase).toBe(
      "selecting-provider",
    )

    const block = {
      type: "block" as const,
      locale: "en" as const,
      selector: { kind: "active" as const },
      failure: "network" as const,
      attempt: 1,
      draftRevision: 1,
    }
    expect(importJourneyReducer(empty, { ...block, draftRevision: 0 })).toBe(
      empty,
    )
    expect(importJourneyReducer(listed, { ...block, draftRevision: 9 })).toBe(
      listed,
    )
    const blocked = importJourneyReducer(listed, block)
    expect(blocked.phase).toBe("blocked")
    expect(
      importJourneyReducer(blocked, { type: "invalidate-guide" }),
    ).toMatchObject({
      phase: "draft",
      draftRevision: 2,
    })
  })

  it("rejects invalid starts and non-completed handoffs", () => {
    expect(
      importJourneyReducer(empty, {
        type: "start-guide",
        snapshot,
        draftRevision: 0,
      }),
    ).toBe(empty)
    expect(
      importJourneyReducer(listed, {
        type: "start-guide",
        snapshot,
        draftRevision: 9,
      }),
    ).toBe(listed)
    expect(
      importJourneyReducer(listed, {
        type: "start-guide",
        snapshot: { ...snapshot, pages: [] },
        draftRevision: 1,
      }),
    ).toBe(listed)
    expect(
      importJourneyReducer(listed, {
        type: "set-manual-handoff",
        target: "qr",
      }),
    ).toBe(listed)
    expect(importJourneyReducer(empty, { type: "invalidate-guide" })).toBe(
      empty,
    )
    expect(importJourneyReducer(listed, { type: "invalidate-guide" })).toBe(
      listed,
    )
  })

  it("fails the development seed closed for production and empty pages", () => {
    if (listed.phase === "empty") throw new Error("fixture")
    const action = {
      type: "seed-development-completion" as const,
      draft: listed.draft,
      snapshot,
    }
    expect(importJourneyReducer(empty, action)).toBe(empty)
    ;(isDevVariant as jest.Mock).mockReturnValue(true)
    expect(importJourneyReducer(empty, action).phase).toBe("completed")
    expect(
      importJourneyReducer(empty, {
        ...action,
        snapshot: { ...snapshot, pages: [] },
      }),
    ).toBe(empty)
  })
})

describe("journey defensive route decisions", () => {
  it("recovers empty and wrong-kind gate calls", () => {
    expect(nextRouteAfterInstitution(empty).route).toBe("/onboarding/school")
    expect(nextRouteAfterProgramme(empty).route).toBe("/onboarding/school")
    expect(nextRouteAfterConnect(empty).route).toBe("/onboarding/school")
    expect(nextRouteAfterConnect(unlisted).route).toBe("/onboarding/school")
    expect(canEnterProtectedRoute(unlisted, "manual")).toBe(false)
  })

  it("returns exact guide resolution after Connect", () => {
    expect(nextRouteAfterConnect(listed)).toEqual({
      route: "/onboarding/export-guide/0",
      selector: { kind: "exact", catalogueVersion: "v1" },
    })
  })

  it("locates the earliest route for selection and guide phases", () => {
    expect(earliestLegalRoute(listed)).toBe("/onboarding/export-guide/0")
    const selecting = importJourneyReducer(unlisted, {
      type: "show-provider-selection",
      locale: "en",
      catalogue,
      providers: [],
      draftRevision: 1,
    })
    expect(earliestLegalRoute(selecting)).toBe(
      "/onboarding/export-guide/providers",
    )
    const guide = importJourneyReducer(listed, {
      type: "start-guide",
      snapshot,
      draftRevision: 1,
    })
    expect(earliestLegalRoute(guide)).toBe("/onboarding/export-guide/0")
    const completed = importJourneyReducer(guide, {
      type: "complete-guide",
      pageIndex: 0,
    })
    expect(earliestLegalRoute(completed)).toBe("/onboarding/export-guide/0")
  })
})
