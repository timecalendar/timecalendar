// Side-effect import: initializes the single module-scoped i18next instance
// (synchronous, from bundled catalogs) before any screen renders text.
import "@/i18n"
// Side-effect import: registers the FCM background-message handler at module
// init so it runs before the JS app finishes booting (RNFB drops quit-state
// messages otherwise — ADR 026). The inverse of Crashlytics, which needs no
// startup import because it auto-installs natively; the background handler is a
// JS registration that must run early. Import only — no init logic here.
import "@/firebase"

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { Stack, ThemeProvider } from "expo-router"
import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { queryClient } from "@/api/query-client"
import { runMigrations } from "@/db/migrate"
import { useStartupSync } from "@/features/calendar"
import { persistOptions } from "@/features/school-selection"
import { SplashScreen } from "@/features/splash/ui"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { buildNavTheme } from "@/theme"

// Anchor the back stack at the tab group so a cold deep link into a non-tab
// route (e.g. timecalendar-dev://personal-event-form, or a notification target)
// can navigate back to the app instead of dead-ending: without this, the
// deep-linked screen is the only entry in the stack and router.back() is a
// no-op (the personal-event form's save/delete would leave the user stranded).
export const unstable_settings = {
  initialRouteName: "(tabs)",
}

// Apply the committed migration bundle at startup, before features read tables
// (fire-and-forget, mirroring the i18n side-effect wiring). Failures are
// recorded through @/firebase inside the runner.
void runMigrations()

// Fire the startup calendar sync once (fire-and-forget, mirroring the i18n /
// runMigrations startup posture — D5). It is a component (not a top-level side
// effect) because the sync wires the generated mutation, which needs the
// QueryClient in context; it renders nothing. Mounted inside the query provider.
// It goes through the feature data/ hook (@/features/calendar), never @/db data
// directly (boundary B-3/B-4).
function StartupSync() {
  useStartupSync()
  return null
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const navTheme = buildNavTheme(colorScheme === "dark" ? "dark" : "light")
  return (
    // GestureHandlerRootView is the outermost wrapper because the calendar
    // (calendar-kit) requires a gesture-handler root ancestor (Phase-04 / ADR
    // 019 / D5); it is the standard RN gesture root and app infrastructure, not
    // a calendar-kit import (the screen/seam own the calendar-kit specifics).
    <GestureHandlerRootView style={styles.root}>
      {/* The sync persister (ADR 013 / D8) restores the schools/groups query
          cache synchronously — no async restore gate / isRestoring handling; the
          existing splash already gates first paint and the cache is restored by
          the time queries run. */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >
        <StartupSync />
        <ThemeProvider value={navTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="personal-event-form" />
            {/* The standalone personal-events list, relocated off the Home tab
                (ADR 022 — the Home tab is now the today view). A Stack sibling of
                (tabs), reached from a Profile entry link, mirroring calendar /
                settings. Deep-linkable: timecalendar-dev://personal-events. */}
            <Stack.Screen name="personal-events" />
            {/* Header shown so the read-only details screen has the default
                accessible back affordance (the screen sets its localized title
                via its own <Stack.Screen options>). Deep-linkable:
                timecalendar-dev://event-details/<uid>. */}
            <Stack.Screen
              name="event-details/[uid]"
              options={{ headerShown: true }}
            />
            {/* The hidden-events management screen (Phase 05 Ship A) — a Stack
                sibling of (tabs), reached from a Profile entry link, where
                hide-by-name (no per-event details surface) is un-hideable.
                Header shown for the accessible back affordance + the screen's
                own title. Deep-linkable: timecalendar-dev://hidden-events. */}
            <Stack.Screen
              name="hidden-events"
              options={{ headerShown: true }}
            />
          </Stack>
          {/* Above the Stack: covers the whole app during startup, fades out (or
              cuts under reduced motion) once useAppReady() resolves. */}
          <SplashScreen />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
