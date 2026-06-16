// Side-effect import: initializes the single module-scoped i18next instance
// (synchronous, from bundled catalogs) before any screen renders text.
import "@/i18n"

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { Stack, ThemeProvider } from "expo-router"
import { StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { queryClient } from "@/api/query-client"
import { runMigrations } from "@/db/migrate"
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
        <ThemeProvider value={navTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="personal-event-form" />
            <Stack.Screen name="calendar" />
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
