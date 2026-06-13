import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { useColorScheme } from "react-native"

import { SplashScreen } from "@/components/splash-screen"
import { runMigrations } from "@/db/migrate"
// Side-effect import: initializes the single module-scoped i18next instance
// (synchronous, from bundled catalogs) before any screen renders text.
import "@/i18n"

const queryClient = new QueryClient()

// Apply the committed migration bundle at startup, before features read tables
// (fire-and-forget, mirroring the i18n side-effect wiring). Failures are
// recorded through @/firebase inside the runner.
void runMigrations()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="schools" />
        </Stack>
        {/* Above the Stack: covers the whole app during startup, fades out (or
            cuts under reduced motion) once useAppReady() resolves. */}
        <SplashScreen />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
