## REMOVED Requirements

### Requirement: Dev-only verification surface
**Reason**: The in-app panel is no longer rendered by any route or feature and retaining a
definition-only component creates a false shared ownership surface. Firebase remains available
through the `@/firebase` seam, with automated wrapper tests and manual console-arrival
verification defining the supported verification boundary.

**Migration**: Remove the orphaned panel and its unused translations. Keep `logEvent`,
`crashTest`, debug-build Crashlytics reporting, the wrapper proof test, and current manual
Firebase verification guidance; no application caller migrates because none exists.
