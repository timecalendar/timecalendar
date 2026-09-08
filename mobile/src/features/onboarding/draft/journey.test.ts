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
  nextRouteAfterInstitution,
  nextRouteAfterProgramme,
  recoveryRoute,
} from "./routes"
import { initialImportJourneyState } from "./types"

jest.mock("@/config/variant", () => ({ isDevVariant: jest.fn(() => false) }))
const mockIsDevVariant = isDevVariant as jest.Mock

const school = (overrides: Partial<SchoolListItem> = {}): SchoolListItem => ({
  id: "school",
  name: "School",
  code: "SCH",
  imageUrl: "https://assets.example.com/school.png",
  imageUrlDark: null,
  intranetUrl: "https://example.com/connect",
  exportGuide: {
    providerSlug: "provider",
    requireProgramme: true,
    requireConnect: true,
    catalogueVersion: "v1",
  },
  ...overrides,
})

const snapshot: ExportGuidePinnedSnapshot = {
  locale: "en",
  catalogueVersion: "v1",
  providerSlug: "provider",
  providerLabel: "Provider",
  reason: "exact",
  pages: [
    { title: "One", description: "First" },
    { title: "Two", description: "Second" },
  ],
}

const listed = (value = school()) =>
  importJourneyReducer(initialImportJourneyState(), {
    type: "set-listed",
    school: value,
  })

describe("import journey reducer", () => {
  beforeEach(() => mockIsDevVariant.mockReturnValue(false))

  it("invalidates all snapshot and completion state when the institution changes", () => {
    const started = importJourneyReducer(listed(), {
      type: "start-guide",
      snapshot,
      draftRevision: 1,
    })
    const completed = importJourneyReducer(
      importJourneyReducer(started, { type: "visit-page", pageIndex: 1 }),
      { type: "complete-guide", pageIndex: 1 },
    )
    expect(completed.phase).toBe("completed")

    const changed = importJourneyReducer(completed, {
      type: "set-unlisted",
      schoolName: "Other school",
    })
    expect(changed).toMatchObject({
      phase: "draft",
      draftRevision: 2,
      draft: { calendarName: "" },
    })
    expect("snapshot" in changed).toBe(false)
  })

  it("only visits the next in-bounds page and only completes the visited final page", () => {
    const started = importJourneyReducer(listed(), {
      type: "start-guide",
      snapshot,
      draftRevision: 1,
    })
    expect(
      importJourneyReducer(started, { type: "visit-page", pageIndex: 2 }),
    ).toBe(started)
    expect(
      importJourneyReducer(started, { type: "complete-guide", pageIndex: 0 }),
    ).toBe(started)

    const final = importJourneyReducer(started, {
      type: "visit-page",
      pageIndex: 1,
    })
    expect(
      importJourneyReducer(final, { type: "complete-guide", pageIndex: 1 }),
    ).toMatchObject({ phase: "completed", manualHandoff: "none" })
  })

  it("rejects stale catalogue completions captured for an earlier draft", () => {
    const state = listed()
    const catalogue = {
      schemaVersion: 1,
      catalogueVersion: "v1",
      locale: "en",
      providers: [],
      rejectedProviders: {},
    } as const satisfies ExportGuideCatalogue
    expect(
      importJourneyReducer(state, {
        type: "show-provider-selection",
        locale: "en",
        catalogue,
        providers: [],
        draftRevision: 0,
      }),
    ).toBe(state)
  })

  it("retains live state across rerenders but a new provider starts empty", () => {
    const active = importJourneyReducer(listed(), {
      type: "start-guide",
      snapshot,
      draftRevision: 1,
    })
    expect(active).toBe(active)
    expect(initialImportJourneyState()).toEqual({
      phase: "empty",
      draftRevision: 0,
    })
  })

  it("accepts the explicit completion seed only in the runtime development variant", () => {
    const draft = listed()
    if (draft.phase === "empty") throw new Error("fixture")
    const action = {
      type: "seed-development-completion" as const,
      draft: draft.draft,
      snapshot,
    }
    expect(
      importJourneyReducer(initialImportJourneyState(), action).phase,
    ).toBe("empty")
    mockIsDevVariant.mockReturnValue(true)
    expect(
      importJourneyReducer(initialImportJourneyState(), action),
    ).toMatchObject({
      phase: "completed",
      developmentSeeded: true,
    })
  })
})

describe("journey gates and protected routes", () => {
  it.each([
    [true, true, "/onboarding/programme"],
    [true, false, "/onboarding/programme"],
    [false, true, "/onboarding/connect"],
    [false, false, "/onboarding/export-guide/0"],
  ] as const)(
    "resolves listed Programme=%s Connect=%s",
    (requireProgramme, requireConnect, route) => {
      const state = listed(
        school({
          exportGuide: {
            ...school().exportGuide,
            requireProgramme,
            requireConnect,
          },
        }),
      )
      expect(nextRouteAfterInstitution(state).route).toBe(route)
    },
  )

  it("always sends an unlisted draft through Programme then provider selection", () => {
    const state = importJourneyReducer(initialImportJourneyState(), {
      type: "set-unlisted",
      schoolName: "Unlisted",
    })
    expect(nextRouteAfterInstitution(state).route).toBe("/onboarding/programme")
    expect(nextRouteAfterProgramme(state).route).toBe(
      "/onboarding/export-guide/providers",
    )
  })

  it.each([
    [null, "missing_url"],
    ["javascript:alert(1)", "unsafe_url"],
  ] as const)(
    "skips an unusable Connect URL without exposing it",
    (url, reason) => {
      const decision = nextRouteAfterProgramme(
        listed(school({ intranetUrl: url })),
      )
      expect(decision).toEqual({
        route: "/onboarding/export-guide/0",
        selector: { kind: "exact", catalogueVersion: "v1" },
        connectSkipped: { reason, providerSlug: "provider" },
      })
    },
  )

  it("requires completion for manual and the matching guarded handoff for QR/iCal", () => {
    const guide = importJourneyReducer(listed(), {
      type: "start-guide",
      snapshot: { ...snapshot, pages: [snapshot.pages[0]!] },
      draftRevision: 1,
    })
    const completed = importJourneyReducer(guide, {
      type: "complete-guide",
      pageIndex: 0,
    })
    expect(canEnterProtectedRoute(completed, "manual")).toBe(true)
    expect(canEnterProtectedRoute(completed, "qr")).toBe(false)
    const qr = importJourneyReducer(completed, {
      type: "set-manual-handoff",
      target: "qr",
    })
    expect(canEnterProtectedRoute(qr, "qr")).toBe(true)
    expect(canEnterProtectedRoute(qr, "ical")).toBe(false)
  })

  it("recovers process-death state to School and never replaces a route with itself", () => {
    const state = initialImportJourneyState()
    expect(earliestLegalRoute(state)).toBe("/onboarding/school")
    expect(recoveryRoute(state, "/onboarding/school")).toBeNull()
    expect(recoveryRoute(state, "/onboarding/ical-url")).toBe(
      "/onboarding/school",
    )
  })
})
