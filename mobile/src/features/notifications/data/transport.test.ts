import { customFetch } from "@/api/mutator"

import { putNotificationSubscription } from "./transport"

jest.mock("@/api/mutator", () => ({ customFetch: jest.fn() }))

it("uses the generated PUT contract and forwards caller cancellation", async () => {
  jest.mocked(customFetch).mockResolvedValueOnce(undefined)
  const controller = new AbortController()
  const body = {
    frequency: "daily" as const,
    nbDaysAhead: 5,
    isActive: true,
    calendarIds: [],
    fcmToken: "current-token",
    locale: "fr",
    timezone: "Europe/Paris",
  }

  await putNotificationSubscription(body, controller.signal)

  expect(customFetch).toHaveBeenCalledWith("/notification-subscription", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
})
