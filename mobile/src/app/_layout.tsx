// Side-effect import: initializes the single module-scoped i18next instance
// (synchronous, from bundled catalogs) before any screen renders text.
import "@/i18n"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Stack, ThemeProvider } from "expo-router"

import { SplashScreen } from "@/components/splash-screen"
import { runMigrations } from "@/db/migrate"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { buildNavTheme } from "@/theme"

const queryClient = new QueryClient()

// Apply the committed migration bundle at startup, before features read tables
// (fire-and-forget, mirroring the i18n side-effect wiring). Failures are
// recorded through @/firebase inside the runner.
void runMigrations()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const navTheme = buildNavTheme(colorScheme === "dark" ? "dark" : "light")
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
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
