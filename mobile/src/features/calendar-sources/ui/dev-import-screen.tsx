import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ErrorNotice } from "@/components/error-surfaces"
import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import { isDevVariant } from "@/config/variant"
import { useSyncCalendars } from "@/features/calendar/data"
import { addCalendarFromToken } from "@/features/calendar-sources/data"
import { useRecordedAction } from "@/hooks/use-recorded-action"
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
// Dev branch: once per mount, addCalendarFromToken(token) (resolve → durable
// upsert) → useSyncCalendars().sync() (now sees the freshly-held token and
// fetches) runs through the shared write controller, which records a reject
// through @/firebase and flips the `failed` flag behind the accessible failure
// (a11y alert live-region). Success leaves to the calendar unless the screen
// has unmounted meanwhile.
export function DevImportScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const { sync } = useSyncCalendars()
  const { run, failed } = useRecordedAction()
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
    if (!isDev || token === undefined || startedRef.current) return
    startedRef.current = true

    void run("dev-import", async () => {
      await addCalendarFromToken(token)
      await sync()
    }).then((imported) => {
      if (!imported || !mountedRef.current) return
      // The root Stack's initialRouteName puts (tabs) beneath this route,
      // in-app and on a cold deep link alike: REPLACE would stack a second
      // (tabs). replace is the fallback for when nothing is beneath.
      if (router.canDismiss()) router.dismissTo("/calendar")
      else router.replace("/calendar")
    })
  }, [isDev, token, run, sync, router])

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View testID="dev-import-content" style={styles.content}>
          {!isDev ? (
            <ThemedText
              themeColor="textSecondary"
              accessibilityRole="text"
              testID="dev-import-unavailable"
            >
              {t("devImport.unavailable")}
            </ThemedText>
          ) : failed ? (
            <ErrorNotice
              testID="dev-import-error"
              message={t("devImport.error")}
            />
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
