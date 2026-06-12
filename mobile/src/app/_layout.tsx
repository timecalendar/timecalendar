import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { useColorScheme } from "react-native"

import { AnimatedSplashOverlay } from "@/components/animated-icon"

const queryClient = new QueryClient()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="schools" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
