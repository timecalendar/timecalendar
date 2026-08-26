import AppTabs from "@/components/app-tabs"
import { ChangelogGate } from "@/features/changelog"

// The gate belongs to the eligible tabs hierarchy, so onboarding siblings can
// never be covered by the automatic what's-new presentation.
export default function TabsLayout() {
  return (
    <>
      <ChangelogGate />
      <AppTabs />
    </>
  )
}
