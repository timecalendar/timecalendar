import { act, render } from "@testing-library/react-native"
import { usePathname, useRouter } from "expo-router"

import { runMigrations } from "@/db/migrate"
import { useSyncCalendars } from "@/features/calendar"
import { findAll } from "@/features/calendar-sources"
import { resolveInitialNotificationIntent } from "@/features/notifications"
import { getStartupTabPreference } from "@/features/settings"
import {
  getLaunchState,
  resetLaunchStateForTests,
} from "@/features/startup/data"

import { LaunchCoordinator } from "./launch-coordinator"

jest.mock("@/db/migrate")
jest.mock("@/features/calendar", () => ({ useSyncCalendars: jest.fn() }))
jest.mock("@/features/calendar-sources", () => ({ findAll: jest.fn() }))
jest.mock("@/features/notifications", () => ({
  resolveInitialNotificationIntent: jest.fn(),
}))
jest.mock("@/features/settings", () => ({ getStartupTabPreference: jest.fn() }))
jest.mock("expo-router", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}))

const mockRunMigrations = jest.mocked(runMigrations)
const mockUseSyncCalendars = jest.mocked(useSyncCalendars)
const mockFindAll = jest.mocked(findAll)
const mockResolveNotification = jest.mocked(resolveInitialNotificationIntent)
const mockGetPreference = jest.mocked(getStartupTabPreference)
const mockUsePathname = jest.mocked(usePathname)
const mockUseRouter = jest.mocked(useRouter)
const replace = jest.fn()
const sync = jest.fn().mockResolvedValue(undefined)
let path = "/"

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe("LaunchCoordinator", () => {
  beforeEach(() => {
    resetLaunchStateForTests()
    jest.clearAllMocks()
    path = "/"
    mockUsePathname.mockImplementation(() => path)
    mockUseRouter.mockReturnValue({ replace } as never)
    mockUseSyncCalendars.mockReturnValue({ sync } as never)
    mockRunMigrations.mockResolvedValue(undefined)
    mockResolveNotification.mockResolvedValue(null)
    mockFindAll.mockResolvedValue([{ id: "held" }] as never)
    mockGetPreference.mockReturnValue("home")
  })

  it("orders prerequisites and replaces Home with the Calendar fallback once", async () => {
    const order: string[] = []
    mockRunMigrations.mockImplementation(async () => {
      order.push("migration")
    })
    mockResolveNotification.mockImplementation(async () => {
      order.push("notification")
      return null
    })
    mockFindAll.mockImplementation(async () => {
      order.push("identity")
      return [{ id: "held" }] as never
    })
    mockGetPreference.mockImplementation(() => {
      order.push("preference")
      return "calendar"
    })

    const view = await render(<LaunchCoordinator />)
    await flush()
    expect(order).toEqual([
      "migration",
      "notification",
      "identity",
      "preference",
    ])
    expect(replace).toHaveBeenCalledWith("/calendar")

    path = "/calendar"
    await view.rerender(<LaunchCoordinator />)
    expect(getLaunchState()).toMatchObject({
      kind: "committed",
      target: "/calendar",
    })
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it("preserves explicit navigation that arrives while resolution is pending", async () => {
    let releaseMigration: (() => void) | undefined
    mockRunMigrations.mockImplementation(
      () => new Promise<void>((resolve) => (releaseMigration = resolve)),
    )
    mockGetPreference.mockReturnValue("calendar")
    const view = await render(<LaunchCoordinator />)

    path = "/onboarding/import"
    await view.rerender(<LaunchCoordinator />)
    await act(async () => releaseMigration?.())
    await flush()

    expect(replace).not.toHaveBeenCalled()
    expect(getLaunchState()).toMatchObject({
      kind: "committed",
      target: "/onboarding/import",
    })
  })
})
