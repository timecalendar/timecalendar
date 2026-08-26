import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import { useUserCalendars } from "@/features/calendar-sources"
import { recordUnknownError } from "@/firebase"

import { buildFeedbackDto, useSendFeedback } from "./use-send-feedback"

jest.mock("@/api/mutator")
jest.mock("@/features/calendar-sources", () => ({
  useUserCalendars: jest.fn(),
}))
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.mock("./device-info", () => ({ getDeviceInfo: () => "device-info" }))

const mockFetch = customFetch as jest.Mock
const mockCalendars = useUserCalendars as jest.Mock

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.mockResolvedValue(undefined)
  mockCalendars.mockReturnValue([
    { id: "visible" },
    { id: "hidden", visible: false },
  ])
})

it("builds standard and optional-context DTOs without unsupported fields", () => {
  expect(
    buildFeedbackDto({ email: "a@b.fr", message: "hello" }, ["one"], "device"),
  ).toEqual({
    email: "a@b.fr",
    message: "hello",
    calendarIds: ["one"],
    deviceInfo: "device",
  })
  expect(
    buildFeedbackDto(
      {
        email: "a@b.fr",
        message: "hello",
        calendarUrl: " https://example.fr/a.ics ",
        schoolId: " school ",
        schoolName: " University ",
      },
      [],
      "device",
    ),
  ).toEqual({
    email: "a@b.fr",
    message: "hello",
    calendarIds: [],
    deviceInfo: "device",
    calendarUrl: "https://example.fr/a.ics",
    schoolId: "school",
    schoolName: "University",
  })
})

it("POSTs every held calendar id through the real generated mutation", async () => {
  const { result } = await renderHook(() => useSendFeedback(), { wrapper })
  await act(async () => {
    await result.current.sendFeedback({ email: "a@b.fr", message: "hello" })
  })
  expect(mockFetch).toHaveBeenCalledWith("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "a@b.fr",
      message: "hello",
      calendarIds: ["visible", "hidden"],
      deviceInfo: "device-info",
    }),
  })
  expect(result.current.isPending).toBe(false)
  await act(async () => result.current.reset())
  await waitFor(() => expect(result.current.isPending).toBe(false))
})

it("records a body-free failure through the shared write controller", async () => {
  const error = new Error("mail rejected")
  mockFetch.mockRejectedValue(error)
  const { result } = await renderHook(() => useSendFeedback(), { wrapper })
  let sent: boolean | undefined
  await act(async () => {
    sent = await result.current.sendFeedback({
      email: "private@example.fr",
      message: "private body",
    })
  })
  expect(sent).toBe(false)
  expect(recordUnknownError).toHaveBeenCalledWith(
    error,
    "feedback/contact-submit",
  )
  expect(result.current.failed).toBe(true)
  await waitFor(() => expect(result.current.isPending).toBe(false))
})
