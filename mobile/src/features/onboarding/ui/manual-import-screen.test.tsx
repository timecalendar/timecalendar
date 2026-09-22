import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  act,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react-native"
import { router } from "expo-router"

import {
  type ImportJourneyAction,
  importJourneyReducer,
  type ImportJourneyState,
  useProtectedImportRoute,
} from "@/features/onboarding/draft"

import ManualImportScreen from "./manual-import-screen"

// Presentational (70% floor). This screen's contract is almost entirely about
// what it does NOT do (design D7): it orchestrates the two existing, tested
// routes and owns no permission, validation, create or retry logic. The source
// assertion below is the only way to state that as a test rather than a promise.
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react").useEffect(effect, [effect])
  },
  router: { push: jest.fn(), replace: jest.fn() },
  Stack: { Screen: () => null },
}))
const mockDispatch = jest.fn()
let mockJourneyState: ImportJourneyState
const mockImportDraftValue = () => ({
  state: mockJourneyState,
  draft: mockJourneyState.phase === "empty" ? null : mockJourneyState.draft,
  dispatch: mockDispatch,
  clearDraft: jest.fn(),
})
jest.mock("@/features/onboarding/draft/context", () => ({
  useImportDraft: () => mockImportDraftValue(),
}))

const mockPush = router.push as jest.Mock
const mockReplace = router.replace as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockJourneyState = {
    phase: "completed",
    draftRevision: 1,
    gateProgress: "programme",
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
      pages: [{ title: "Export", description: "Export instructions" }],
    },
    visitedThrough: 0,
    manualHandoff: "none",
  }
})

describe("ManualImportScreen", () => {
  it("fails closed through the real guard when restored with an empty journey", async () => {
    mockJourneyState = { phase: "empty", draftRevision: 0 }
    const view = await render(<ManualImportScreen />)

    expect(view.toJSON()).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/school")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("renders the localized copy and both entry points", async () => {
    const { getByText } = await render(<ManualImportScreen />)

    expect(getByText("Scan QR code")).toBeTruthy()
    expect(getByText("Paste an iCal link")).toBeTruthy()
  })

  it.each([
    ["onboarding-import-qr", "/onboarding/qr-scan"],
    ["onboarding-import-url", "/onboarding/ical-url"],
  ])("navigates from %s to %s", async (testID, route) => {
    const { getByTestId } = await render(<ManualImportScreen />)
    const control = getByTestId(testID)

    expect(control.props.accessibilityRole).toBe("button")
    expect(control.props.accessibilityLabel).toBeTruthy()

    await act(async () => fireEvent.press(control))
    expect(mockPush).toHaveBeenCalledWith(route)
  })

  it("opens iCal from the chooser after QR recovery without restarting the completed journey", async () => {
    if (mockJourneyState.phase !== "completed")
      throw new Error("expected completed journey")
    mockJourneyState = {
      ...mockJourneyState,
      manualHandoff: "qr",
      draft: {
        institution: { kind: "unlisted", schoolName: "My School" },
        calendarName: "L3 Informatique",
      },
    }
    const completedJourney = mockJourneyState
    mockDispatch.mockImplementationOnce((action: ImportJourneyAction) => {
      mockJourneyState = importJourneyReducer(mockJourneyState, action)
    })

    // QR recovery dismisses to this chooser with the existing handoff intact.
    const chooser = await render(<ManualImportScreen />)
    expect(chooser.getByTestId("onboarding-import-url")).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
    await fireEvent.press(chooser.getByTestId("onboarding-import-url"))
    await chooser.rerender(<ManualImportScreen />)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "set-manual-handoff",
      target: "ical",
    })
    expect(mockJourneyState).toEqual({
      ...completedJourney,
      manualHandoff: "ical",
    })
    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/onboarding/ical-url")
    expect(mockReplace).not.toHaveBeenCalled()
    await chooser.unmount()

    // The actual destination guard accepts the reducer's new state as well.
    const destination = await renderHook(() =>
      useProtectedImportRoute("ical", "/onboarding/ical-url"),
    )
    expect(destination.result.current).toBe(true)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("contains no permission, validation, create or retry logic", () => {
    const source = readFileSync(
      join(__dirname, "manual-import-screen.tsx"),
      "utf8",
    )

    for (const forbidden of [
      "useCameraPermissions",
      "validateIcalUrl",
      "useAddCalendar",
      "addCalendarFromUrl",
      "recordUnknownError",
      "useState",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
