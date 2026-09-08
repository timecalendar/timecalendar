import { renderHook, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import { useImportDraft } from "./context"
import { useProtectedImportRoute } from "./protected-route"
import { initialImportJourneyState } from "./types"

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }))
jest.mock("./context", () => ({ useImportDraft: jest.fn() }))

const mockUseImportDraft = useImportDraft as jest.Mock
const mockReplace = router.replace as jest.Mock

describe("useProtectedImportRoute", () => {
  beforeEach(() => jest.clearAllMocks())

  it("replaces an illegal route with the earliest legal route", async () => {
    mockUseImportDraft.mockReturnValue({ state: initialImportJourneyState() })
    const { result } = await renderHook(() =>
      useProtectedImportRoute("ical", "/onboarding/ical-url"),
    )
    expect(result.current).toBe(false)
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/onboarding/school"),
    )
  })

  it("does not replace a route with itself", async () => {
    mockUseImportDraft.mockReturnValue({ state: initialImportJourneyState() })
    await renderHook(() =>
      useProtectedImportRoute("manual", "/onboarding/school"),
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("admits a completed manual route", async () => {
    mockUseImportDraft.mockReturnValue({
      state: {
        phase: "completed",
        draftRevision: 1,
        draft: {
          institution: { kind: "unlisted", schoolName: "School" },
          calendarName: "",
        },
        snapshot: {
          locale: "en",
          catalogueVersion: "v1",
          providerSlug: "generic",
          providerLabel: "Generic",
          reason: "generic",
          pages: [{ title: "One", description: "One" }],
        },
        visitedThrough: 0,
        manualHandoff: "none",
      },
    })
    const { result } = await renderHook(() =>
      useProtectedImportRoute("manual", "/onboarding/import"),
    )
    expect(result.current).toBe(true)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
