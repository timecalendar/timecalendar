import { act, render, waitFor } from "@testing-library/react-native"
import { usePathname, useRouter } from "expo-router"

import { runMigrations } from "@/db/migrate"
import { useSyncCalendars } from "@/features/calendar"
import { findAll } from "@/features/calendar-sources/data"
import { resolveInitialNotificationIntent } from "@/features/notifications/data"
import { getStartupTabPreference } from "@/features/settings/prefs"
import {
  getLaunchState,
  resetLaunchStateForTests,
} from "@/features/startup/data"

import { LaunchCoordinator } from "./launch-coordinator"

jest.mock("@/db/migrate")
jest.mock("@/features/calendar", () => ({ useSyncCalendars: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({ findAll: jest.fn() }))
jest.mock("@/features/notifications/data", () => ({
  resolveInitialNotificationIntent: jest.fn(),
}))
jest.mock("@/features/settings/prefs", () => ({
  getStartupTabPreference: jest.fn(),
}))
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

  it("preserves explicit navigation while initial notification stays pending", async () => {
    mockResolveNotification.mockImplementation(() => new Promise(() => {}))
    mockGetPreference.mockReturnValue("calendar")
    const view = await render(<LaunchCoordinator />)
    await flush()

    path = "/onboarding/import"
    await view.rerender(<LaunchCoordinator />)
    await flush()

    expect(replace).not.toHaveBeenCalled()
    expect(mockResolveNotification).toHaveBeenCalledTimes(1)
    expect(getLaunchState()).toMatchObject({
      kind: "committed",
      target: "/onboarding/import",
    })
  })

  it("keeps the launch attempt alive when runtime hook identities change", async () => {
    let finishMigration: () => void = () => undefined
    mockRunMigrations.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishMigration = resolve
        }),
    )
    mockGetPreference.mockReturnValue("calendar")
    const nextReplace = jest.fn()
    const nextSync = jest.fn().mockResolvedValue(undefined)

    const view = await render(<LaunchCoordinator />)
    await waitFor(() => expect(mockRunMigrations).toHaveBeenCalledTimes(1))

    mockUseRouter.mockReturnValue({ replace: nextReplace } as never)
    mockUseSyncCalendars.mockReturnValue({ sync: nextSync } as never)
    await view.rerender(<LaunchCoordinator />)
    await act(async () => finishMigration())

    await waitFor(() => expect(nextReplace).toHaveBeenCalledWith("/calendar"))
    expect(mockRunMigrations).toHaveBeenCalledTimes(1)
  })
})
