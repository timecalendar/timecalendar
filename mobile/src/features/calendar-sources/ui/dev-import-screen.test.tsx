import { act, render, screen, waitFor } from "@testing-library/react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { isDevVariant } from "@/config/variant"
import { useSyncCalendars } from "@/features/calendar/data"
import { addCalendarFromToken } from "@/features/calendar-sources/data"
import { useLaunchCommitted } from "@/features/startup/data"
import { recordUnknownError } from "@/firebase"

import { DevImportScreen } from "./dev-import-screen"

// Presentational dev-import screen (70% floor) — the ADR 030 security-boundary
// proof. Renders through the real theme + i18n trees. The import seam, the sync
// seam, the variant gate, the router, and @/firebase are mocked so both branches
// are provable without a real DB/network:
//  - DEV branch: addCalendarFromToken(token) → sync() → router.replace("/calendar")
//  - PRODUCTION branch: NO import call, inert "not available" state (the boundary)
//  - failure: reject → recordUnknownError + accessible error state

jest.mock("@/config/variant", () => ({ isDevVariant: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  addCalendarFromToken: jest.fn(),
}))
jest.mock("@/features/calendar/data", () => ({
  useSyncCalendars: jest.fn(),
}))
jest.mock("@/features/startup/data", () => ({
  useLaunchCommitted: jest.fn(),
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}))

const mockIsDevVariant = isDevVariant as jest.Mock
const mockAddCalendarFromToken = addCalendarFromToken as jest.Mock
const mockUseSyncCalendars = useSyncCalendars as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockUseLaunchCommitted = useLaunchCommitted as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock

const mockSync = jest.fn<Promise<void>, []>(() => Promise.resolve())
const mockReplace = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  mockAddCalendarFromToken.mockResolvedValue(undefined)
  mockSync.mockResolvedValue(undefined)
  mockUseSyncCalendars.mockReturnValue({ sync: mockSync })
  mockUseRouter.mockReturnValue({ replace: mockReplace })
  mockUseLaunchCommitted.mockReturnValue(true)
  mockUseLocalSearchParams.mockReturnValue({ token: "e2e-smoke-calendar" })
})

describe("DevImportScreen", () => {
  it("dev variant: imports the token, syncs, and routes to the calendar", async () => {
    mockIsDevVariant.mockReturnValue(true)

    await render(<DevImportScreen />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/calendar"))
    expect(mockAddCalendarFromToken).toHaveBeenCalledWith("e2e-smoke-calendar")
    expect(mockSync).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("waits for launch commitment before touching migrated storage", async () => {
    mockIsDevVariant.mockReturnValue(true)
    mockUseLaunchCommitted.mockReturnValue(false)

    const view = await render(<DevImportScreen />)
    expect(mockAddCalendarFromToken).not.toHaveBeenCalled()

    mockUseLaunchCommitted.mockReturnValue(true)
    await view.rerender(<DevImportScreen />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/calendar"))
    expect(mockAddCalendarFromToken).toHaveBeenCalledWith("e2e-smoke-calendar")
  })

  it("finishes the mounted import when the sync callback changes during its rerender", async () => {
    mockIsDevVariant.mockReturnValue(true)
    let finishSync: () => void = () => undefined
    const firstSync = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishSync = resolve
        }),
    )
    const nextSync = jest.fn(() => Promise.resolve())
    mockUseSyncCalendars
      .mockReturnValueOnce({ sync: firstSync })
      .mockReturnValue({ sync: nextSync })

    const view = await render(<DevImportScreen />)
    await waitFor(() => expect(firstSync).toHaveBeenCalledTimes(1))

    await view.rerender(<DevImportScreen />)
    await act(async () => finishSync())

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/calendar"))
    expect(nextSync).not.toHaveBeenCalled()
  })

  it("production variant: performs NO import and shows the inert state (security boundary)", async () => {
    mockIsDevVariant.mockReturnValue(false)

    await render(<DevImportScreen />)

    expect(screen.getByText("This screen is not available.")).toBeTruthy()
    // The security boundary: the action is inert regardless of the token param.
    expect(mockAddCalendarFromToken).not.toHaveBeenCalled()
    expect(mockSync).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("dev variant: a failed import records the error and surfaces an accessible failure", async () => {
    mockIsDevVariant.mockReturnValue(true)
    mockAddCalendarFromToken.mockRejectedValueOnce(new Error("resolve boom"))

    await render(<DevImportScreen />)

    await waitFor(() =>
      expect(screen.getByTestId("dev-import-error")).toBeTruthy(),
    )
    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
