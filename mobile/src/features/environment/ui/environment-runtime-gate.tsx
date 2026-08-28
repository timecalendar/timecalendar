import type { PropsWithChildren } from "react"
import { useEffect, useState, useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  isBackendRuntimeReady,
  setBackendRuntimeReady,
  subscribeBackendRuntimeReady,
} from "@/config/backend-runtime"
import { useEffectiveBackendEnvironment } from "@/features/environment/data/store"
import { recoverBackendEnvironmentSwitch } from "@/features/environment/data/switch"
import { setCrashlyticsAttributes } from "@/firebase"
import { type BackendResetJournal, readBackendResetJournal } from "@/storage"
import { Spacing } from "@/theme"

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

export function NonProductionEnvironmentMarker() {
  const { t } = useTranslation()
  const environment = useEffectiveBackendEnvironment()
  if (environment === "production") return null

  return (
    <SafeAreaView edges={["top"]} style={styles.markerSafeArea}>
      <Text
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={styles.markerText}
        testID="backend-environment-marker"
      >
        {t("environment.marker", {
          environment: t(`environment.choice.${environment}`),
        })}
      </Text>
    </SafeAreaView>
  )
}

export function EnvironmentRuntimeGate({ children }: PropsWithChildren) {
  const { t } = useTranslation()
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
      <SafeAreaView style={styles.recoverySafeArea}>
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={styles.recovery}
          testID="backend-environment-recovery"
        >
          <Text style={styles.recoveryTitle}>
            {t(
              isRecovering
                ? "environment.recovery.progress"
                : "environment.recovery.title",
            )}
          </Text>
          {!isRecovering ? (
            <>
              <Text style={styles.recoveryBody}>
                {t("environment.recovery.body")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("environment.recovery.retry")}
                onPress={() => {
                  setFailedJournal(undefined)
                  setAttempt((value) => value + 1)
                }}
                style={styles.retry}
                testID="backend-environment-retry"
              >
                <Text style={styles.retryText}>
                  {t("environment.recovery.retry")}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.root}>
      <NonProductionEnvironmentMarker />
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  markerSafeArea: { backgroundColor: "#7A2800" },
  markerText: {
    backgroundColor: "#7A2800",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    textAlign: "center",
  },
  recoverySafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  recovery: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  recoveryTitle: { color: "#000000", fontSize: 24, fontWeight: "700" },
  recoveryBody: { color: "#000000", fontSize: 17 },
  retry: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#7A2800",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  retryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
})
