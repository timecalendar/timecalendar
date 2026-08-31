import AppTabs from "@/components/app-tabs"
import { ChangelogGate } from "@/features/changelog"
import { useLaunchCommitted } from "@/features/startup"

// The gate belongs to the eligible tabs hierarchy, so onboarding siblings can
// never be covered by the automatic what's-new presentation.
export default function TabsLayout() {
  const launchCommitted = useLaunchCommitted()
  return (
    <>
      {launchCommitted ? <ChangelogGate /> : null}
      <AppTabs />
    </>
  )
}
