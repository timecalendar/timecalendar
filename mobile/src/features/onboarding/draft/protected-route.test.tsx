import { act, renderHook, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import { ImportDraftProvider, useImportDraft } from "./context"
import { useProtectedImportRoute } from "./protected-route"
import { type ImportJourneyState, initialImportJourneyState } from "./types"

let mockFocused = true
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useFocusEffect: (effect: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react").useEffect(() => {
      if (mockFocused) return effect()
    }, [effect, mockFocused])
  },
}))
jest.mock("./context", () => ({
  ...jest.requireActual("./context"),
  useImportDraft: jest.fn(),
}))

const mockUseImportDraft = useImportDraft as jest.Mock
const mockReplace = router.replace as jest.Mock

describe("useProtectedImportRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseImportDraft.mockReset()
    mockFocused = true
  })

  const listed: ImportJourneyState = {
    phase: "draft",
    draftRevision: 1,
    gateProgress: "programme",
    draft: {
      institution: {
        kind: "listed",
        school: {
          id: "listed-school",
          name: "Listed school",
          code: "LISTED",
          imageUrl: "https://assets.example.com/school.png",
          imageUrlDark: null,
          intranetUrl: null,
          exportGuide: {
            providerSlug: "provider-one",
            requireProgramme: false,
            requireConnect: false,
            catalogueVersion: "v1",
          },
        },
      },
      calendarName: "",
    },
  }
  const unlisted: ImportJourneyState = {
    phase: "draft",
    draftRevision: 1,
    gateProgress: "programme",
    draft: {
      institution: { kind: "unlisted", schoolName: "Unlisted school" },
      calendarName: "",
    },
  }

  it.each([
    [
      "manual",
      "/onboarding/import",
      initialImportJourneyState(),
      "/onboarding/school",
    ],
    [
      "qr",
      "/onboarding/qr-scan",
      initialImportJourneyState(),
      "/onboarding/school",
    ],
    [
      "ical",
      "/onboarding/ical-url",
      initialImportJourneyState(),
      "/onboarding/school",
    ],
    ["manual", "/onboarding/import", listed, "/onboarding/export-guide/0"],
    ["qr", "/onboarding/qr-scan", listed, "/onboarding/export-guide/0"],
    ["ical", "/onboarding/ical-url", listed, "/onboarding/export-guide/0"],
    [
      "manual",
      "/onboarding/import",
      unlisted,
      "/onboarding/export-guide/providers",
    ],
    [
      "qr",
      "/onboarding/qr-scan",
      unlisted,
      "/onboarding/export-guide/providers",
    ],
    [
      "ical",
      "/onboarding/ical-url",
      unlisted,
      "/onboarding/export-guide/providers",
    ],
  ] as const)(
    "rejects illegal %s entry from its journey state",
    async (kind, currentRoute, state, recovery) => {
      mockUseImportDraft.mockReturnValue({ state })
      const { result } = await renderHook(() =>
        useProtectedImportRoute(kind, currentRoute),
      )

      expect(result.current).toBe(false)
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(recovery))
    },
  )

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

  it("replaces QR with iCal using the real shared draft without restarting the guide", async () => {
    mockUseImportDraft.mockImplementation(
      jest.requireActual("./context").useImportDraft,
    )
    const { result, rerender } = await renderHook(
      ({ kind }: { kind: "qr" | "ical" }) => ({
        ...useImportDraft(),
        legal: useProtectedImportRoute(
          kind,
          kind === "qr" ? "/onboarding/qr-scan" : "/onboarding/ical-url",
        ),
      }),
      { wrapper: ImportDraftProvider, initialProps: { kind: "qr" } },
    )
    await act(() => {
      result.current.setUnlistedInstitution("QA School")
      result.current.setCalendarName("L3 Informatique")
      result.current.dispatch({
        type: "start-guide",
        draftRevision: 2,
        snapshot: {
          locale: "en",
          catalogueVersion: "v1",
          providerSlug: "generic",
          providerLabel: "Generic",
          reason: "generic",
          pages: [{ title: "Export", description: "Export instructions" }],
        },
      })
      result.current.dispatch({ type: "complete-guide", pageIndex: 0 })
      result.current.dispatch({ type: "set-manual-handoff", target: "qr" })
    })
    expect(result.current.legal).toBe(true)
    const draft = result.current.draft
    mockReplace.mockClear()

    // Keep the outgoing QR mounted while the real reducer changes its handoff.
    await act(() => {
      result.current.dispatch({ type: "set-manual-handoff", target: "ical" })
    })
    expect(result.current.legal).toBe(false)
    expect(mockReplace.mock.calls).toEqual([["/onboarding/ical-url"]])
    await rerender({ kind: "ical" })
    expect(result.current.legal).toBe(true)
    expect(result.current.draft).toEqual(draft)
    expect(mockReplace).toHaveBeenCalledTimes(1)

    // Losing completion still closes the route, including after a draft edit.
    await act(() => result.current.setCalendarName("M1 Informatique"))
    expect(result.current.legal).toBe(false)
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/onboarding/export-guide/providers",
    )
  })

  it("leaves recovery to the focused screen and guards again on focus", async () => {
    mockFocused = false
    mockUseImportDraft.mockReturnValue({ state: initialImportJourneyState() })
    const { result, rerender } = await renderHook(() =>
      useProtectedImportRoute("qr", "/onboarding/qr-scan"),
    )
    expect(result.current).toBe(false)
    expect(mockReplace).not.toHaveBeenCalled()
    mockFocused = true
    await rerender({})
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/school")
  })
})
