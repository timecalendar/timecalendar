import { reloadAppAsync } from "expo"
import * as Updates from "expo-updates"

import { clearQueryRuntime, quiesceQueryRuntime } from "@/api/query-client"
import type { BackendEnvironment } from "@/config/backend-environment"
import { setBackendRuntimeReady } from "@/config/backend-runtime"
import { resetBackendDatabase } from "@/db"
import { logEvent } from "@/firebase"
import {
  type BackendResetJournal,
  clearBackendBoundStorage,
  clearBackendResetJournal,
  writeBackendResetJournal,
} from "@/storage"

import { createBackendEnvironmentSwitcher } from "./orchestrator"
import {
  resetCalendarRuntimeState,
  resetNotificationRuntimeState,
} from "./participants"
import { getBackendEnvironmentCapability } from "./runtime"
import { resetSessions } from "./session-reset"
import {
  commitSelectedBackendEnvironment,
  getEffectiveBackendEnvironment,
} from "./store"

const reload = (): Promise<void> =>
  Updates.isEnabled
    ? Updates.reloadAsync()
    : reloadAppAsync("environment-switch")

const switcher = createBackendEnvironmentSwitcher({
  getCapability: getBackendEnvironmentCapability,
  getEffectiveEnvironment: getEffectiveBackendEnvironment,
  writeJournal: writeBackendResetJournal,
  clearJournal: clearBackendResetJournal,
  setRuntimeReady: setBackendRuntimeReady,
  quiesceQueries: quiesceQueryRuntime,
  resetSessions,
  resetDatabase: resetBackendDatabase,
  clearBackendStorage: clearBackendBoundStorage,
  clearQueries: clearQueryRuntime,
  resetCalendar: resetCalendarRuntimeState,
  resetNotifications: resetNotificationRuntimeState,
  commitTarget: commitSelectedBackendEnvironment,
  recordSuccess: async (current, target) => {
    await logEvent("backend_environment_switched", {
      from_environment: current,
      to_environment: target,
    }).catch(() => {})
  },
  reload,
})

export function switchBackendEnvironment(target: unknown) {
  return switcher.switchTo(target)
}

export function recoverBackendEnvironmentSwitch(journal: BackendResetJournal) {
  return switcher.recover(journal)
}

export function isBackendEnvironmentSwitching(): boolean {
  return switcher.isSwitching()
}

export type { BackendEnvironment }
