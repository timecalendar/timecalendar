import type { BackendEnvironment } from "@/config/backend-environment"

import {
  type BackendSwitchDependencies,
  createBackendEnvironmentSwitcher,
} from "./orchestrator"

const createDependencies = () => {
  const events: string[] = []
  let current: BackendEnvironment = "preprod"
  let releaseQuiesce: (() => void) | undefined
  const quiesceGate = new Promise<void>((resolve) => {
    releaseQuiesce = resolve
  })
  const dependencies: BackendSwitchDependencies = {
    getCapability: () => "preview",
    getEffectiveEnvironment: () => current,
    writeJournal: jest.fn(() => events.push("journal")),
    clearJournal: jest.fn(() => events.push("clear-journal")),
    setRuntimeReady: jest.fn((ready) => events.push(`ready:${ready}`)),
    quiesceQueries: jest.fn(async () => {
      events.push("quiesce")
    }),
    resetSessions: jest.fn(async () => {
      events.push("sessions")
    }),
    resetDatabase: jest.fn(() => events.push("database")),
    clearBackendStorage: jest.fn(() => events.push("storage")),
    clearQueries: jest.fn(() => events.push("queries")),
    resetCalendar: jest.fn(() => events.push("calendar")),
    resetNotifications: jest.fn(() => events.push("notifications")),
    commitTarget: jest.fn((target) => {
      current = target
      events.push(`commit:${target}`)
    }),
    recordSuccess: jest.fn(async () => {
      events.push("telemetry")
    }),
    reload: jest.fn(async () => {
      events.push("reload")
    }),
  }
  return {
    dependencies,
    events,
    setQuiesceGate() {
      dependencies.quiesceQueries = jest.fn(async () => {
        events.push("quiesce")
        await quiesceGate
      })
    },
    releaseQuiesce: () => releaseQuiesce?.(),
  }
}

it("runs the complete destructive invariant in journal-first order", async () => {
  const { dependencies, events } = createDependencies()
  const switcher = createBackendEnvironmentSwitcher(dependencies)

  await expect(switcher.switchTo("production")).resolves.toBe("switched")

  expect(events).toEqual([
    "journal",
    "ready:false",
    "quiesce",
    "sessions",
    "database",
    "storage",
    "queries",
    "calendar",
    "notifications",
    "commit:production",
    "clear-journal",
    "telemetry",
    "reload",
  ])
  expect(dependencies.writeJournal).toHaveBeenCalledWith({
    version: 1,
    current: "preprod",
    target: "production",
  })
  expect(dependencies.recordSuccess).toHaveBeenCalledWith(
    "preprod",
    "production",
  )
})

it("rejects invalid targets and no-ops the current target without writes", async () => {
  const { dependencies, events } = createDependencies()
  const switcher = createBackendEnvironmentSwitcher(dependencies)

  await expect(switcher.switchTo("local")).rejects.toThrow("not allowed")
  await expect(switcher.switchTo("preprod")).resolves.toBe("noop")
  expect(events).toEqual([])
})

it("deduplicates concurrent requests into one single-flight reset", async () => {
  const setup = createDependencies()
  setup.setQuiesceGate()
  const switcher = createBackendEnvironmentSwitcher(setup.dependencies)

  const first = switcher.switchTo("production")
  const duplicate = switcher.switchTo("production")
  expect(switcher.isSwitching()).toBe(true)
  expect(setup.dependencies.writeJournal).toHaveBeenCalledTimes(1)

  setup.releaseQuiesce()
  await expect(Promise.all([first, duplicate])).resolves.toEqual([
    "switched",
    "switched",
  ])
  expect(setup.dependencies.resetDatabase).toHaveBeenCalledTimes(1)
})

it("retains the journal and prior target and never reloads after failure", async () => {
  const { dependencies, events } = createDependencies()
  dependencies.resetDatabase = jest.fn(() => {
    events.push("database")
    throw new Error("db failed")
  })
  const switcher = createBackendEnvironmentSwitcher(dependencies)

  await expect(switcher.switchTo("production")).rejects.toThrow("db failed")

  expect(dependencies.commitTarget).not.toHaveBeenCalled()
  expect(dependencies.clearJournal).not.toHaveBeenCalled()
  expect(dependencies.recordSuccess).not.toHaveBeenCalled()
  expect(dependencies.reload).not.toHaveBeenCalled()
  expect(dependencies.setRuntimeReady).toHaveBeenLastCalledWith(false)
})

it("recovers a retained journal idempotently without rewriting it", async () => {
  const { dependencies } = createDependencies()
  const switcher = createBackendEnvironmentSwitcher(dependencies)

  await expect(
    switcher.recover({
      version: 1,
      current: "preprod",
      target: "production",
    }),
  ).resolves.toBe("switched")

  expect(dependencies.writeJournal).not.toHaveBeenCalled()
  expect(dependencies.commitTarget).toHaveBeenCalledWith("production")
  expect(dependencies.reload).toHaveBeenCalledTimes(1)
})

it("fails closed when a stale recovery target is no longer allowed", async () => {
  const { dependencies } = createDependencies()
  dependencies.getCapability = () => "production"
  const switcher = createBackendEnvironmentSwitcher(dependencies)

  await expect(
    switcher.recover({ version: 1, current: "production", target: "preprod" }),
  ).rejects.toThrow("not allowed")
  expect(dependencies.setRuntimeReady).toHaveBeenCalledWith(false)
  expect(dependencies.resetDatabase).not.toHaveBeenCalled()
})
