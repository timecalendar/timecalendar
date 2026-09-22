import type { PropsWithChildren } from "react"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ErrorState } from "@/components/error-surfaces"
import { ThemedText } from "@/components/themed-text"
import {
  isBackendRuntimeReady,
  setBackendRuntimeReady,
  subscribeBackendRuntimeReady,
} from "@/config/backend-runtime"
import { useEffectiveBackendEnvironment } from "@/features/environment/data/store"
import { recoverBackendEnvironmentSwitch } from "@/features/environment/data/switch"
import { setCrashlyticsAttributes } from "@/firebase"
import { type BackendResetJournal, readBackendResetJournal } from "@/storage"
import { Spacing, useTheme } from "@/theme"

const productionRecoveryJournal: BackendResetJournal = {
  version: 1,
  current: "production",
  target: "production",
}

function getInitialRecoveryJournal(): BackendResetJournal | undefined {
  const result = readBackendResetJournal()
  if (result.state === "absent") {
    setBackendRuntimeReady(true)
    return undefined
  }
  setBackendRuntimeReady(false)
  return result.state === "valid" ? result.journal : productionRecoveryJournal
}

export function EnvironmentRuntimeGate({ children }: PropsWithChildren) {
  const { t } = useTranslation()
  const theme = useTheme()
  const environment = useEffectiveBackendEnvironment()
  const runtimeReady = useSyncExternalStore(
    subscribeBackendRuntimeReady,
    isBackendRuntimeReady,
  )
  const [initialJournal] = useState(getInitialRecoveryJournal)
  const [failedJournal, setFailedJournal] = useState<
    BackendResetJournal | undefined
  >()
  const [attempt, setAttempt] = useState(0)
  const runtimeJournalRead = !runtimeReady
    ? readBackendResetJournal()
    : { state: "absent" as const }
  const blockingJournal =
    initialJournal ??
    (runtimeJournalRead.state === "valid"
      ? runtimeJournalRead.journal
      : !runtimeReady
        ? productionRecoveryJournal
        : undefined)

  useEffect(() => {
    if (blockingJournal === undefined || failedJournal !== undefined) return
    void recoverBackendEnvironmentSwitch(blockingJournal).catch(() => {
      setFailedJournal(blockingJournal)
    })
  }, [attempt, blockingJournal, failedJournal])

  useEffect(() => {
    if (blockingJournal !== undefined || !runtimeReady) return
    void setCrashlyticsAttributes({ backendEnvironment: environment })
  }, [blockingJournal, environment, runtimeReady])

  if (blockingJournal !== undefined || !runtimeReady) {
    const isRecovering = failedJournal === undefined
    return (
      <SafeAreaView
        style={[styles.recoverySafeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.recovery}
          testID="backend-environment-recovery"
        >
          {isRecovering ? (
            <>
              <ActivityIndicator color={theme.textSecondary} />
              <ThemedText accessibilityLiveRegion="polite">
                {t("environment.recovery.progress")}
              </ThemedText>
            </>
          ) : (
            <ErrorState
              title={t("environment.recovery.title")}
              message={t("environment.recovery.body")}
              primaryAction={{
                label: t("environment.recovery.retry"),
                testID: "backend-environment-retry",
                onPress: () => {
                  setFailedJournal(undefined)
                  setAttempt((value) => value + 1)
                },
              }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  recoverySafeArea: {
    flex: 1,
    justifyContent: "center",
  },
  recovery: {
    flexGrow: 1,
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
  },
})
