import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { router } from "expo-router"

import type { ActivityLog, ActivityState } from "@/features/activity/data"
import i18n from "@/i18n"

import { buildActivitySections } from "./activity-items"
import { ActivityScreen } from "./activity-screen"

const mockUseActivityLogs = jest.fn()
const mockUseActivityState = jest.fn()
const mockRefreshNewestPage = jest.fn()
const mockLoadOlderPage = jest.fn()
const mockMarkActivityReadFromCache = jest.fn()
const mockMarkActivityRead = jest.fn()

jest.mock("@/features/activity/data", () => {
  const actual = jest.requireActual("@/features/activity/data")
  return {
    ...actual,
    useActivityLogs: () => mockUseActivityLogs(),
    useActivityState: () => mockUseActivityState(),
    refreshNewestPage: (...args: unknown[]) => mockRefreshNewestPage(...args),
    loadOlderPage: (...args: unknown[]) => mockLoadOlderPage(...args),
    markActivityReadFromCache: (...args: unknown[]) =>
      mockMarkActivityReadFromCache(...args),
    markActivityRead: (...args: unknown[]) => mockMarkActivityRead(...args),
  }
})

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}))

const event = (uid: string, overrides = {}) => ({
  uid,
  title: `Event ${uid}`,
  startsAt: "2026-08-30T10:00:00.000Z",
  endsAt: "2026-08-30T11:00:00.000Z",
  location: "Room A",
  ...overrides,
})

const populatedLog = (overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  id: "log-1",
  calendarId: "calendar-1",
  calendarName: "Computer Science",
  createdAt: new Date("2026-08-30T12:00:00.000Z"),
  updatedAt: new Date("2026-08-30T12:00:00.000Z"),
  change: {
    newItems: [event("new")],
    changedItems: [
      {
        previousItem: event("changed-old", { location: "Room A" }),
        newItem: event("changed-new", { location: "Room B" }),
      },
    ],
    oldItems: [event("cancelled")],
  },
  ...overrides,
})

const state = (overrides: Partial<ActivityState> = {}): ActivityState => ({
  lastReadAt: null,
  unreadCount: 0,
  lastSuccessfulRefreshAt: null,
  olderPageCursor: "cursor",
  olderPageComplete: false,
  ...overrides,
})

const mockPush = router.push as jest.Mock

async function triggerRefresh() {
  const list = screen.getByTestId("activity-section-list")
  await act(async () => {
    await list.props.refreshControl.props.onRefresh()
  })
}

beforeEach(async () => {
  await i18n.changeLanguage("en")
  mockUseActivityLogs.mockReturnValue({ logs: [], loaded: true })
  mockUseActivityState.mockReturnValue(state())
  mockRefreshNewestPage.mockResolvedValue({ status: "updated" })
  mockLoadOlderPage.mockResolvedValue({ status: "loaded" })
  mockMarkActivityReadFromCache.mockResolvedValue(undefined)
  mockPush.mockReset()
})

afterEach(() => {
  mockUseActivityLogs.mockReset()
  mockUseActivityState.mockReset()
  mockRefreshNewestPage.mockReset()
  mockLoadOlderPage.mockReset()
  mockMarkActivityReadFromCache.mockReset()
  mockMarkActivityRead.mockReset()
})

describe.each([
  ["en", "No recent changes. Timetable updates will appear here."],
  [
    "fr",
    "Aucune modification récente. Les changements d'emploi du temps apparaîtront ici.",
  ],
] as const)("ActivityScreen states in %s", (locale, emptyCopy) => {
  beforeEach(async () => {
    await i18n.changeLanguage(locale)
  })

  it("renders loading", async () => {
    mockUseActivityLogs.mockReturnValue({ logs: [], loaded: false })
    await render(<ActivityScreen />)
    expect(screen.getByTestId("activity-loading")).toBeTruthy()
  })

  it("renders the exact empty sentence", async () => {
    await render(<ActivityScreen />)
    expect(screen.getByText(emptyCopy)).toBeTruthy()
  })

  it("renders populated history", async () => {
    mockUseActivityLogs.mockReturnValue({
      logs: [populatedLog()],
      loaded: true,
    })
    await render(<ActivityScreen />)
    expect(screen.getByText("Computer Science")).toBeTruthy()
    expect(screen.getByText("Event new")).toBeTruthy()
  })

  it("keeps cached history when refresh fails", async () => {
    mockUseActivityLogs.mockReturnValue({
      logs: [populatedLog()],
      loaded: true,
    })
    mockRefreshNewestPage.mockResolvedValue({
      status: "failed",
      reason: "network",
    })
    await render(<ActivityScreen />)
    await triggerRefresh()
    await waitFor(() => {
      expect(screen.getByTestId("activity-cached-error")).toBeTruthy()
    })
    expect(screen.getByText("Event new")).toBeTruthy()
  })

  it("renders a full empty failure without the empty sentence", async () => {
    mockRefreshNewestPage.mockResolvedValue({
      status: "failed",
      reason: "network",
    })
    await render(<ActivityScreen />)
    await triggerRefresh()
    await waitFor(() => {
      expect(screen.getByTestId("activity-empty-error")).toBeTruthy()
    })
    expect(screen.queryByText(emptyCopy)).toBeNull()
  })
})

describe("ActivityScreen behavior", () => {
  it("forces newest-page refresh exactly once", async () => {
    await render(<ActivityScreen />)
    await triggerRefresh()
    expect(mockRefreshNewestPage).toHaveBeenCalledTimes(1)
    expect(mockRefreshNewestPage).toHaveBeenCalledWith({ force: true })
  })

  it("loads older pages from end reached and the footer retry only", async () => {
    mockUseActivityLogs.mockReturnValue({
      logs: [populatedLog()],
      loaded: true,
    })
    mockLoadOlderPage
      .mockResolvedValueOnce({ status: "failed", reason: "network" })
      .mockResolvedValueOnce({ status: "loaded" })
    await render(<ActivityScreen />)
    const list = screen.getByTestId("activity-section-list")
    await fireEvent(list, "endReached")
    await waitFor(() =>
      expect(screen.getByTestId("activity-older-retry")).toBeTruthy(),
    )
    await fireEvent.press(screen.getByTestId("activity-older-retry"))
    expect(mockLoadOlderPage).toHaveBeenCalledTimes(2)
    expect(mockRefreshNewestPage).not.toHaveBeenCalled()
  })

  it("does not load beyond a completed older-page chain", async () => {
    mockUseActivityLogs.mockReturnValue({
      logs: [populatedLog()],
      loaded: true,
    })
    mockUseActivityState.mockReturnValue(state({ olderPageComplete: true }))
    await render(<ActivityScreen />)
    await fireEvent(screen.getByTestId("activity-section-list"), "endReached")
    expect(mockLoadOlderPage).not.toHaveBeenCalled()
  })

  it("routes new and changed items with their new UIDs, while cancelled stays inert", async () => {
    mockUseActivityLogs.mockReturnValue({
      logs: [populatedLog()],
      loaded: true,
    })
    await render(<ActivityScreen />)
    await fireEvent.press(screen.getByTestId("activity-new-new"))
    await fireEvent.press(screen.getByTestId("activity-changed-changed-new"))
    expect(mockPush).toHaveBeenNthCalledWith(1, "/event-details/new")
    expect(mockPush).toHaveBeenNthCalledWith(2, "/event-details/changed-new")
    const cancelled = screen.getByTestId("activity-cancelled-cancelled")
    expect(cancelled.props.onPress).toBeUndefined()
    expect(cancelled.props.accessibilityRole).toBeUndefined()
  })

  it.each(["no-calendars", "cursor-reset"] as const)(
    "%s does not surface an error",
    async (status) => {
      if (status === "no-calendars") {
        mockRefreshNewestPage.mockResolvedValue({ status })
        await render(<ActivityScreen />)
        await triggerRefresh()
      } else {
        mockUseActivityLogs.mockReturnValue({
          logs: [populatedLog()],
          loaded: true,
        })
        mockLoadOlderPage.mockResolvedValue({ status })
        await render(<ActivityScreen />)
        await fireEvent(
          screen.getByTestId("activity-section-list"),
          "endReached",
        )
      }
      await waitFor(() => {
        expect(screen.queryByRole("alert")).toBeNull()
      })
    },
  )

  it("marks cached Activity read on mount and when unread becomes non-zero", async () => {
    const { rerender } = await render(<ActivityScreen />)
    await waitFor(() =>
      expect(mockMarkActivityReadFromCache).toHaveBeenCalledTimes(1),
    )
    mockUseActivityState.mockReturnValue(state({ unreadCount: 4 }))
    await rerender(<ActivityScreen />)
    await waitFor(() =>
      expect(mockMarkActivityReadFromCache).toHaveBeenCalledTimes(2),
    )
    expect(mockMarkActivityRead).not.toHaveBeenCalled()
  })

  it("exposes group headers as headings and errors as live alerts", async () => {
    mockUseActivityLogs.mockReturnValue({
      logs: [populatedLog()],
      loaded: true,
    })
    mockRefreshNewestPage.mockResolvedValue({
      status: "failed",
      reason: "network",
    })
    await render(<ActivityScreen />)
    expect(
      screen.getByRole("header", { name: /Computer Science/ }),
    ).toBeTruthy()
    await triggerRefresh()
    await waitFor(() => {
      const alert = screen.getByRole("alert")
      expect(alert.props.accessibilityLiveRegion).toBe("polite")
    })
  })

  it("keeps long content and hundreds of changed children flattened and unclipped", async () => {
    const long = "Long value ".repeat(30)
    const changes = Array.from({ length: 300 }, (_, index) => ({
      previousItem: event(`old-${index}`, { title: long, location: long }),
      newItem: event(`new-${index}`, {
        title: long,
        location: `${long}${index}`,
      }),
    }))
    mockUseActivityLogs.mockReturnValue({
      loaded: true,
      logs: [
        populatedLog({
          calendarName: long,
          change: { newItems: [], oldItems: [], changedItems: changes },
        }),
      ],
    })
    await render(<ActivityScreen />)
    expect(
      buildActivitySections([
        populatedLog({
          calendarName: long,
          change: { newItems: [], oldItems: [], changedItems: changes },
        }),
      ])[0]?.data,
    ).toHaveLength(300)
    const calendarName = screen.getAllByText(long)[0]
    expect(calendarName?.props.numberOfLines).toBeUndefined()
  })
})
