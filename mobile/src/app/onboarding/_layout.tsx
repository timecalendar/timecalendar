import { Stack } from "expo-router"

import { ImportDraftProvider } from "@/features/onboarding"

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
  return (
    <ImportDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ImportDraftProvider>
  )
}
