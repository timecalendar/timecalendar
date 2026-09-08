import { Stack } from "expo-router"

import { buildCompactRootScreenOptions } from "@/components/chrome"
import { ImportDraftProvider } from "@/features/onboarding"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { buildNavTheme } from "@/theme"

// The nested onboarding stack: welcome (index) → school → institution-name →
// programme → connect → import, with qr-scan, ical-url and the off-path groups
// step as siblings. A thin route layout (no colocated test — route-structure
// rule).
//
// The import-draft provider is mounted HERE, once, so it wraps every route in
// the Stack — including the qr-scan and ical-url siblings, which is what lets a
// failed import switch between them without losing the institution/programme the
// student entered. Mounting it on the layout is also what gives the draft its
// lifetime for free (ADR 047): the provider unmounts with the Stack, so leaving
// the journey clears the draft and a restart cannot restore it.
export default function OnboardingLayout() {
  const colorScheme = useColorScheme()
  const navTheme = buildNavTheme(colorScheme === "dark" ? "dark" : "light")
  const screenOptions = buildCompactRootScreenOptions(navTheme.colors.card)

  return (
    <ImportDraftProvider>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="school" />
        <Stack.Screen name="institution-name" />
        <Stack.Screen name="programme" />
        <Stack.Screen name="connect" />
        <Stack.Screen name="export-guide/providers" />
        <Stack.Screen name="export-guide/[pageIndex]" />
        <Stack.Screen name="import" />
        <Stack.Screen name="qr-scan" />
        <Stack.Screen name="ical-url" />
        <Stack.Screen name="groups" />
      </Stack>
    </ImportDraftProvider>
  )
}
