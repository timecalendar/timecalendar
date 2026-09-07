import { type ReactNode, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  type LayoutChangeEvent,
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
  contentTestID?: string
  actionsTestID?: string
  contentContainerStyle?: StyleProp<ViewStyle>
  actionContainerStyle?: StyleProp<ViewStyle>
}

export function KeyboardSafeActionLayout({
  children,
  actions,
  lane = "readable",
  testID,
  contentTestID,
  actionsTestID,
  contentContainerStyle,
  actionContainerStyle,
}: KeyboardSafeActionLayoutProps) {
  const { laneStyle, onLayout } = useAdaptiveLayout(lane)
  const ownerRef = useRef<View>(null)
  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0)
  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout(event)
    ownerRef.current?.measureInWindow((_x, y) => {
      if (Number.isFinite(y) && y >= 0) {
        setKeyboardVerticalOffset(y)
      }
    })
  }

  return (
    <View
      ref={ownerRef}
      testID={testID === undefined ? undefined : `${testID}-window-owner`}
      onLayout={handleLayout}
      style={styles.owner}
    >
      <KeyboardAvoidingView
        testID={testID}
        behavior={resolveKeyboardAvoidingBehavior(Platform.OS)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.owner}
      >
        <ScrollView
          testID={
            contentTestID ??
            (testID === undefined ? undefined : `${testID}-content`)
          }
          style={styles.scroller}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[laneStyle, contentContainerStyle]}
        >
          {children}
        </ScrollView>
        <View
          testID={
            actionsTestID ??
            (testID === undefined ? undefined : `${testID}-actions`)
          }
          style={[laneStyle, actionContainerStyle]}
        >
          {actions}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  owner: { flex: 1 },
  scroller: { flex: 1 },
})
