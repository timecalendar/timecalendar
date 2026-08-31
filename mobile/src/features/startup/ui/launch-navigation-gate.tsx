import type { PropsWithChildren } from "react"
import { StyleSheet, View } from "react-native"

import { useLaunchCommitted } from "@/features/startup/data"

// Expo Router must stay mounted while launch prerequisites resolve so it can
// report a cold deep link. Keep that unresolved Stack inert behind the splash:
// otherwise automation or assistive technology can activate a nested route
// before migrations finish and make that route race the database startup.
export function LaunchNavigationGate({ children }: PropsWithChildren) {
  const committed = useLaunchCommitted()

  return (
    <View
      accessibilityElementsHidden={!committed}
      importantForAccessibility={committed ? "auto" : "no-hide-descendants"}
      pointerEvents={committed ? "auto" : "none"}
      style={styles.container}
      testID="launch-navigation"
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
