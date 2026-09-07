import type { ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"

import { useAdaptiveLayout } from "@/components/adaptive-content"
import { resolveKeyboardAvoidingBehavior } from "@/components/keyboard-avoiding-behavior"
import type { ResponsiveLane } from "@/theme"

type KeyboardSafeActionLayoutProps = {
  children: ReactNode
  actions: ReactNode
  lane?: ResponsiveLane
  testID?: string
  contentContainerStyle?: StyleProp<ViewStyle>
  actionContainerStyle?: StyleProp<ViewStyle>
}

export function KeyboardSafeActionLayout({
  children,
  actions,
  lane = "readable",
  testID,
  contentContainerStyle,
  actionContainerStyle,
}: KeyboardSafeActionLayoutProps) {
  const layout = useAdaptiveLayout(lane)

  return (
    <KeyboardAvoidingView
      testID={testID}
      behavior={resolveKeyboardAvoidingBehavior(Platform.OS)}
      onLayout={layout.onLayout}
      style={styles.owner}
    >
      <ScrollView
        testID={testID === undefined ? undefined : `${testID}-content`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[layout.laneStyle, contentContainerStyle]}
      >
        {children}
      </ScrollView>
      <View
        testID={testID === undefined ? undefined : `${testID}-actions`}
        style={[layout.laneStyle, actionContainerStyle]}
      >
        {actions}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  owner: { flex: 1 },
})
