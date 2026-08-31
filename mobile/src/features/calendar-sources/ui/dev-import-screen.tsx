import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { isDevVariant } from "@/config/variant"
import { useSyncCalendars } from "@/features/calendar/data"
import { addCalendarFromToken } from "@/features/calendar-sources/data"
import { useLaunchCommitted } from "@/features/startup/data"
import { recordUnknownError } from "@/firebase"
import { Spacing } from "@/theme"

// The dev-only import deep-link screen (ADR 030) — PRESENTATIONAL (70% floor).
// Reached as `timecalendar-dev://dev-import?token=<token>`; the route
// (src/app/dev-import.tsx) is a thin re-export. It is the E2E seam that makes the
// app durably HOLD the seeded token so the startup sync's no-op-on-empty-table
// path is bypassed and real synced data renders.
//
// The whole IMPORT ACTION is runtime-gated on isDevVariant() (NOT the scheme): the
// route file ships in the prod bundle and is reachable as `timecalendar://dev-
// import?token=…`, so gating on the variant — not __DEV__ (false in the release-
// config dev-variant e2e build) — is the security boundary. In production the
// screen renders an inert "not available" state and performs NO import/network
// call. A colocated test proves the production branch never imports.
//
// Dev branch: addCalendarFromToken(token) (resolve → durable upsert) →
// useSyncCalendars().sync() (now sees the freshly-held token and fetches) →
// router.replace("/calendar"). It owns its own local { pending, error } and, on a
// reject, records through @/firebase + surfaces an accessible failure (a11y alert
// live-region), mirroring the persist seam's observability posture.
export function DevImportScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const { sync } = useSyncCalendars()
  const launchCommitted = useLaunchCommitted()
  const [error, setError] = useState(false)
  const isDev = isDevVariant()

  // Guard against the effect firing twice (React 18 double-invoke / a param
  // re-read): the import must run once per mount.
  const startedRef = useRef(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!launchCommitted || !isDev || token === undefined || startedRef.current)
      return
    startedRef.current = true

    const run = async () => {
      try {
        await addCalendarFromToken(token)
        await sync()
        if (mountedRef.current) router.replace("/calendar")
      } catch (caught) {
        recordUnknownError(caught, "dev-import")
        if (mountedRef.current) setError(true)
      }
    }
    void run()
  }, [launchCommitted, isDev, token, sync, router])

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {!isDev ? (
            <ThemedText
              themeColor="textSecondary"
              accessibilityRole="text"
              testID="dev-import-unavailable"
            >
              {t("devImport.unavailable")}
            </ThemedText>
          ) : error ? (
            <ThemedText
              themeColor="textSecondary"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              testID="dev-import-error"
            >
              {t("devImport.error")}
            </ThemedText>
          ) : (
            <View style={styles.loading} testID="dev-import-loading">
              <ActivityIndicator />
              <ThemedText
                themeColor="textSecondary"
                accessibilityLiveRegion="polite"
                accessibilityRole="text"
              >
                {t("devImport.importing")}
              </ThemedText>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  loading: {
    alignItems: "center",
    gap: Spacing.two,
  },
})
