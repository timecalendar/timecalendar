import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { useColorScheme } from "react-native"

// Side-effect import: initializes the single module-scoped i18next instance
// (synchronous, from bundled catalogs) before any screen renders text.
import "@/i18n"

const queryClient = new QueryClient()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="schools" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
