import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { ReactNode } from "react"
import { Text } from "react-native"

import { customFetch } from "@/api/mutator"
import { isDevVariant } from "@/config/variant"
import * as syncRepository from "@/features/calendar/data/sync/repository"
import { addCalendarFromToken } from "@/features/calendar-sources/data"
import { findAll as findAllUserCalendars } from "@/features/calendar-sources/data/user-calendars"
import {
  SOURCE_HEALTH_KEY,
  useSourceHealthSnapshot,
} from "@/features/calendar-sources/store"
import { recordUnknownError } from "@/firebase"
import { remove } from "@/storage"

import { DevImportScreen } from "./dev-import-screen"

jest.mock("@/api/mutator")
jest.mock("@/config/variant", () => ({ isDevVariant: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  ...jest.requireActual("@/features/calendar-sources/data"),
  addCalendarFromToken: jest.fn(),
}))
jest.mock("@/features/calendar-sources/data/user-calendars", () => ({
  findAll: jest.fn(),
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}))
jest.spyOn(syncRepository, "replaceAll").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockIsDevVariant = isDevVariant as jest.Mock
const mockFindAllUserCalendars = findAllUserCalendars as jest.Mock
const mockAddCalendarFromToken = addCalendarFromToken as jest.Mock
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockReplaceAll = syncRepository.replaceAll as jest.Mock
const mockReplace = jest.fn()

const syncResponse = [
  {
    calendar: {
      id: "cal-1",
      token: "e2e-smoke-calendar",
      name: "E2E Calendar",
    },
    events: [
      {
        type: "cm",
        color: "#1E88E5",
        groupColor: "#0D47A1",
        uid: "e2e-today-lecture",
        title: "E2E Today Lecture",
        startsAt: "2026-08-26T09:00:00.000Z",
        endsAt: "2026-08-26T10:00:00.000Z",
        location: "Room E2E Lecture",
        allDay: false,
        description: null,
        teachers: [],
        tags: [],
        fields: {},
        exportedAt: "2026-08-26T08:00:00.000Z",
      },
    ],
    sourceHealth: {
      status: "stale",
      reason: "expired_export_window",
      recoveryAction: "re_add",
      guide: null,
    },
  },
]

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function SourceHealthSubscriberHarness() {
  const sourceHealth = useSourceHealthSnapshot()
  return (
    <>
      <Text testID="source-health-status">
        {sourceHealth["cal-1"]?.status ?? "missing"}
      </Text>
      <DevImportScreen />
    </>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  remove(SOURCE_HEALTH_KEY)
  mockIsDevVariant.mockReturnValue(true)
  mockUseLocalSearchParams.mockReturnValue({ token: "e2e-smoke-calendar" })
  mockUseRouter.mockReturnValue({ replace: mockReplace })
  mockAddCalendarFromToken.mockResolvedValue(undefined)
  mockFindAllUserCalendars.mockResolvedValue([
    { id: "cal-1", token: "e2e-smoke-calendar" },
  ])
  mockFetch.mockResolvedValue(syncResponse)
  mockReplaceAll.mockResolvedValue(undefined)
})

afterEach(() => {
  queryClient.clear()
  remove(SOURCE_HEALTH_KEY)
})

it("navigates once after the real sync rerenders a source-health subscriber", async () => {
  await render(<SourceHealthSubscriberHarness />, { wrapper })

  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/calendar"))

  expect(mockAddCalendarFromToken).toHaveBeenCalledTimes(1)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  expect(mockReplaceAll).toHaveBeenCalledTimes(1)
  expect(screen.getByTestId("source-health-status").props.children).toBe(
    "stale",
  )
  expect(mockReplace).toHaveBeenCalledTimes(1)
  expect(mockRecordUnknownError).not.toHaveBeenCalled()
})
