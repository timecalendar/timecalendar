import { runMigrations } from "@/db/migrate"
import { findAll } from "@/features/calendar-sources"
import { resolveInitialNotificationIntent } from "@/features/notifications"
import { getStartupTabPreference } from "@/features/settings"
import { recordUnknownError } from "@/firebase"

import {
  recordLaunchFailure,
  resolveLaunchPrerequisites,
} from "./prerequisites"

jest.mock("@/db/migrate")
jest.mock("@/features/calendar-sources", () => ({ findAll: jest.fn() }))
jest.mock("@/features/notifications", () => ({
  resolveInitialNotificationIntent: jest.fn(),
}))
jest.mock("@/features/settings", () => ({ getStartupTabPreference: jest.fn() }))
jest.mock("@/firebase")

describe("startup prerequisites", () => {
  it("reads each prerequisite in order and resolves the fallback", async () => {
    const order: string[] = []
    jest.mocked(runMigrations).mockImplementation(async () => {
      order.push("migration")
    })
    jest
      .mocked(resolveInitialNotificationIntent)
      .mockImplementation(async () => {
        order.push("intent")
        return null
      })
    jest.mocked(findAll).mockImplementation(async () => {
      order.push("identity")
      return [{ id: "held" }] as never
    })
    jest.mocked(getStartupTabPreference).mockImplementation(() => {
      order.push("preference")
      return "calendar"
    })

    await expect(resolveLaunchPrerequisites("/", jest.fn())).resolves.toBe(
      "/calendar",
    )
    expect(order).toEqual(["migration", "intent", "identity", "preference"])
  })

  it("records failures with the static startup context", () => {
    const failure = new Error("boom")
    recordLaunchFailure(failure)
    expect(recordUnknownError).toHaveBeenCalledWith(
      failure,
      "startup/launch-resolution",
    )
  })
})
