import { Stack } from "expo-router"

// The nested onboarding stack (design D3): the school step (index) → the group
// step (groups), the real push/back nav the feature exists to validate. A thin
// route layout (no colocated test — route-structure rule).
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
