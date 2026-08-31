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
import { Platform, StyleSheet } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { queryClient } from "@/api/query-client"
import {
  useActivityForegroundRefresh,
  useActivityOwnershipPrune,
} from "@/features/activity"
import { useStartupSync } from "@/features/calendar"
import { EnvironmentRuntimeGate } from "@/features/environment"
import {
  useNotificationRegistration,
  useNotificationTapRouting,
} from "@/features/notifications"
import { persistOptions } from "@/features/school-selection"
import { SplashScreen } from "@/features/splash/ui"
import {
  LaunchCoordinator,
  LaunchFailureScreen,
  LaunchNavigationGate,
  useLaunchCommitted,
} from "@/features/startup"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { buildNavTheme } from "@/theme"
import { OtaUpdateRuntime } from "@/updates"

// Anchor the back stack at the tab group so a cold deep link into a non-tab
// route (e.g. timecalendar-dev://personal-event-form, or a notification target)
// can navigate back to the app instead of dead-ending: without this, the
// deep-linked screen is the only entry in the stack and router.back() is a
// no-op (the personal-event form's save/delete would leave the user stranded).
export const unstable_settings = {
  initialRouteName: "(tabs)",
}

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

// Fire the FCM-token-to-backend registration once at startup (Phase 06 Ship B /
// ADR 027), next to StartupSync and for the same reason: it wires the generated
// PUT mutation, which needs the QueryClient in context, so it is a mounted
// component rendering nothing rather than a top-level side effect. It requests
// notification permission, PUTs the assembled subscription DTO once a non-null
// token exists, and re-PUTs on token-refresh. Goes through the feature data/
// hook (@/features/notifications), never the generated client / @/db (B-3/B-4).
function NotificationRegistration() {
  useNotificationRegistration()
  return null
}

// Wire notification tap-through routing once (Phase 06 Ship C / ADR 028), beside
// NotificationRegistration and inside the rendered RootLayout tree so its effects
// fire after the <Stack> mounts — the cold-start tap navigates via the router,
// which needs the navigator mounted (design Decision 3). A foreground
// calendar_changed refetches (no nav); a background/cold-start tap refetches then
// routes to the affected event (NEW/EDIT) or the calendar (CANCEL). It reaches
// the calendar sync via @/features/calendar/data and @/firebase via the seam,
// never the generated client / @/db (B-1..B-4); it renders nothing.
function NotificationTapRouting() {
  useNotificationTapRouting()
  return null
}

// The two app-lifetime Activity triggers (TIM-399 / ADR 049), mounted once
// alongside StartupSync and for the same reason its siblings are components: a
// hook needs a mounted tree, and this one renders nothing.
//   - useActivityForegroundRefresh: a background → active return refreshes
//     Activity passively (the five-minute window lives in the coordinator).
//   - useActivityOwnershipPrune: watches the held-calendar set and deletes the
//     Activity history of a calendar that disappeared from it. The edge points
//     Activity → calendar-sources deliberately; the reverse would close a module
//     require cycle (ADR 049 / D7).
// Unlike its siblings it needs no QueryClient — the coordinator issues its
// request through the mutator with no TanStack Query in between (TIM-397 D8) —
// but it is mounted here anyway so the startup wiring stays in one place. It
// reaches Activity through the feature barrel only, never @/db or the generated
// client (B-3).
function ActivityRuntime() {
  useActivityForegroundRefresh()
  useActivityOwnershipPrune()
  return null
}

function PostLaunchRuntime() {
  const committed = useLaunchCommitted()
  if (!committed) return null
  return (
    <>
      <StartupSync />
      <ActivityRuntime />
      <NotificationRegistration />
    </>
  )
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
      <EnvironmentRuntimeGate>
        {/* The sync persister (ADR 013 / D8) restores the schools/groups query
          cache synchronously — no async restore gate / isRestoring handling; the
          existing splash already gates first paint and the cache is restored by
          the time queries run. */}
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
        >
          <OtaUpdateRuntime />
          <PostLaunchRuntime />
          <NotificationTapRouting />
          <LaunchCoordinator />
          <ThemeProvider value={navTheme}>
            <LaunchNavigationGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen
                  name="appearance-settings"
                  options={{ headerShown: true }}
                />
                <Stack.Screen
                  name="startup-settings"
                  options={{ headerShown: true }}
                />
                <Stack.Screen name="about" options={{ headerShown: true }} />
                <Stack.Screen
                  name="changelog"
                  options={{ headerShown: true }}
                />
                <Stack.Screen
                  name="changelog-sheet"
                  options={{
                    headerShown: true,
                    presentation:
                      Platform.OS === "ios" ? "formSheet" : "fullScreenModal",
                    sheetAllowedDetents: [1],
                    sheetGrabberVisible: true,
                  }}
                />
                {/* The display-timezone picker screen — a Stack sibling of (tabs),
                reached from Settings, mirroring appearance settings. Header
                shown for the accessible back affordance + the screen's own
                title. Deep-linkable: timecalendar-dev://timezone-settings. */}
                <Stack.Screen
                  name="timezone-settings"
                  options={{ headerShown: true }}
                />
                <Stack.Screen name="personal-event-form" />
                {/* The standalone personal-events list, relocated off the Home tab
                (ADR 022 — the Home tab is now the today view). A Stack sibling of
                (tabs), reached from Settings, mirroring calendar management.
                Deep-linkable: timecalendar-dev://personal-events. */}
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
                sibling of (tabs), reached from Settings, where
                hide-by-name (no per-event details surface) is un-hideable.
                Header shown for the accessible back affordance + the screen's
                own title. Deep-linkable: timecalendar-dev://hidden-events. */}
                <Stack.Screen
                  name="hidden-events"
                  options={{ headerShown: true }}
                />
                {/* The Activity timeline — a Stack sibling of (tabs), reached from
                Settings. Deep-linkable: timecalendar-dev://activity. */}
                <Stack.Screen name="activity" options={{ headerShown: true }} />
                {/* The notification subscription preferences screen (Phase 06 Ship
                B) — a Stack sibling of (tabs), reached from Settings,
                mirroring appearance settings / hidden-events. Header shown for the
                accessible back affordance + the screen's own title.
                Deep-linkable: timecalendar-dev://notification-settings. */}
                <Stack.Screen
                  name="notification-settings"
                  options={{ headerShown: true }}
                />
                <Stack.Screen name="feedback" options={{ headerShown: true }} />
                {/* The user-calendars management screen ("Mes calendriers") — a
                Stack sibling of (tabs), reached from the Settings summary, where
                a held calendar's visibility is toggled and a calendar deleted.
                Header shown for the accessible back affordance + the screen's own
                title. Deep-linkable: timecalendar-dev://user-calendars. */}
                <Stack.Screen
                  name="user-calendars"
                  options={{ headerShown: true }}
                />
                {/* The dev-only import deep-link target (ADR 030) — a Stack sibling
                of (tabs), the E2E seam that makes the app durably hold a seeded
                calendar token so real synced data renders. Headerless (it self-
                routes to /calendar on success). The import ACTION is runtime-gated
                on the app variant (inert in production); the route file still
                ships in the prod bundle. Deep-linkable:
                timecalendar-dev://dev-import?token=<token>. */}
                <Stack.Screen
                  name="dev-import"
                  options={{ headerShown: false }}
                />
              </Stack>
            </LaunchNavigationGate>
            {/* Above the Stack: covers the whole app during startup, fades out (or
              cuts under reduced motion) once useAppReady() resolves. */}
            <SplashScreen />
            <LaunchFailureScreen />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </EnvironmentRuntimeGate>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
