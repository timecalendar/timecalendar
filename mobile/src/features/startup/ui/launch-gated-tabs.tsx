import AppTabs from "@/components/app-tabs"
import { ChangelogGate } from "@/features/changelog"
import { useLaunchCommitted } from "@/features/startup/data"

// The root Stack keeps `(tabs)` as its static anchor, including while an
// explicit deep link is being resolved. Do not mount the tab screens behind
// that route before startup commits: their SQLite/live-query readers must not
// race the blocking migration prerequisite.
export function LaunchGatedTabs() {
  const launchCommitted = useLaunchCommitted()
  if (!launchCommitted) return null

  return (
    <>
      <ChangelogGate />
      <AppTabs />
    </>
  )
}
