import type { BackendEnvironment } from "@/config/backend-environment"
import { isAllowedBackendEnvironment } from "@/config/backend-environment"
import type { BackendResetJournal } from "@/storage"

export interface BackendSwitchDependencies {
  getCapability: () => "development" | "preview" | "production"
  getEffectiveEnvironment: () => BackendEnvironment
  writeJournal: (journal: BackendResetJournal) => void
  clearJournal: () => void
  setRuntimeReady: (ready: boolean) => void
  quiesceQueries: () => Promise<void>
  resetSessions: () => Promise<void>
  resetDatabase: () => void
  clearBackendStorage: () => void
  clearQueries: () => void
  resetCalendar: () => void
  resetNotifications: () => void
  commitTarget: (target: BackendEnvironment) => void
  recordSuccess: (
    current: BackendEnvironment,
    target: BackendEnvironment,
  ) => Promise<void>
  reload: () => Promise<void>
}

export interface BackendEnvironmentSwitcher {
  switchTo(target: unknown): Promise<"noop" | "switched">
  recover(journal: BackendResetJournal): Promise<"switched">
  isSwitching(): boolean
}

export function createBackendEnvironmentSwitcher(
  dependencies: BackendSwitchDependencies,
): BackendEnvironmentSwitcher {
  let activeSwitch: Promise<"noop" | "switched"> | undefined

  const run = async (
    current: BackendEnvironment,
    target: BackendEnvironment,
    journalAlreadyWritten: boolean,
  ): Promise<"switched"> => {
    if (!journalAlreadyWritten) {
      dependencies.writeJournal({ version: 1, current, target })
    }
    dependencies.setRuntimeReady(false)
    await dependencies.quiesceQueries()
    await dependencies.resetSessions()
    dependencies.resetDatabase()
    dependencies.clearBackendStorage()
    dependencies.clearQueries()
    dependencies.resetCalendar()
    dependencies.resetNotifications()
    dependencies.commitTarget(target)
    dependencies.clearJournal()
    await dependencies.recordSuccess(current, target)
    await dependencies.reload()
    return "switched"
  }

  const singleFlight = (
    operation: () => Promise<"noop" | "switched">,
  ): Promise<"noop" | "switched"> => {
    if (activeSwitch !== undefined) return activeSwitch
    activeSwitch = operation().finally(() => {
      activeSwitch = undefined
    })
    return activeSwitch
  }

  return {
    switchTo(target: unknown) {
      const capability = dependencies.getCapability()
      if (!isAllowedBackendEnvironment(target, capability)) {
        return Promise.reject(new Error("Backend environment is not allowed"))
      }
      const current = dependencies.getEffectiveEnvironment()
      if (current === target) return Promise.resolve("noop")
      return singleFlight(() => run(current, target, false))
    },
    recover(journal: BackendResetJournal) {
      const capability = dependencies.getCapability()
      if (!isAllowedBackendEnvironment(journal.target, capability)) {
        dependencies.setRuntimeReady(false)
        return Promise.reject(
          new Error("Reset journal target is not allowed by this build"),
        )
      }
      return singleFlight(() =>
        run(journal.current, journal.target, true),
      ) as Promise<"switched">
    },
    isSwitching() {
      return activeSwitch !== undefined
    },
  }
}
