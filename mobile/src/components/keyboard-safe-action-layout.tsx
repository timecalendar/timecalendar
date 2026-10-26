import { type ReactNode, useContext, useEffect, useRef, useState } from "react"
import {
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"

import { useAdaptiveLayout } from "@/components/adaptive-content"
import { headerScrollProps } from "@/components/header-scroll-props"
import { type ResponsiveLane, Spacing } from "@/theme"

type KeyboardSafeActionLayoutProps = {
  children: ReactNode
  actions: ReactNode
  lane?: ResponsiveLane
  testID?: string
  contentTestID?: string
  actionsTestID?: string
  contentContainerStyle?: StyleProp<ViewStyle>
  actionContainerStyle?: StyleProp<ViewStyle>
  // Pass false when the content fills the viewport (flexGrow): an automatic
  // header inset on top of a viewport-tall content makes it scroll by the
  // header height. The enclosing RootPage must then drop scrollsUnderHeader.
  scrollsUnderHeader?: boolean
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
  scrollsUnderHeader = true,
}: KeyboardSafeActionLayoutProps) {
  const { laneStyle, onLayout } = useAdaptiveLayout(lane)
  const ownerRef = useRef<View>(null)
  const keyboardTopRef = useRef<number | null>(null)
  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0)
  const [keyboardOverlap, setKeyboardOverlap] = useState<number | null>(null)
  // Android measureInWindow starts below the status bar (the visible frame's
  // top), while keyboardDidShow reports the keyboard top in screen coordinates;
  // under edge-to-edge the safe-area top is that status bar.
  const statusBar = useContext(SafeAreaInsetsContext)?.top ?? 0
  const keyboardInset =
    keyboardOverlap === null ? 0 : Math.max(0, keyboardOverlap + statusBar)

  const measureKeyboardInset = () => {
    ownerRef.current?.measureInWindow((_x, y, _width, height) => {
      const keyboardTop = keyboardTopRef.current
      if (keyboardTop === null || !Number.isFinite(y + height)) return
      setKeyboardOverlap(y + height - keyboardTop)
    })
  }

  useEffect(() => {
    if (Platform.OS !== "android") return
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTopRef.current = event.endCoordinates.screenY
      measureKeyboardInset()
    })
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopRef.current = null
      setKeyboardOverlap(null)
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout(event)
    if (Platform.OS === "android") {
      if (keyboardTopRef.current !== null) measureKeyboardInset()
      return
    }
    ownerRef.current?.measureInWindow((_x, y) => {
      if (Number.isFinite(y) && y >= 0) setKeyboardVerticalOffset(y)
    })
  }

  const body = (
    <>
      <ScrollView
        {...headerScrollProps(scrollsUnderHeader)}
        testID={
          contentTestID ??
          (testID === undefined ? undefined : `${testID}-content`)
        }
        style={styles.scroller}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          laneStyle,
          styles.content,
          contentContainerStyle,
        ]}
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
    </>
  )

  return (
    <View
      ref={ownerRef}
      testID={testID === undefined ? undefined : `${testID}-window-owner`}
      onLayout={handleLayout}
      style={styles.owner}
    >
      {/* Not KeyboardAvoidingView on Android: its keyboardDidHide screenY is the
          visible height, not a Y, so no static offset fits open and close. */}
      {Platform.OS === "android" ? (
        <View
          testID={testID}
          style={[styles.owner, { paddingBottom: keyboardInset }]}
        >
          {body}
        </View>
      ) : (
        <KeyboardAvoidingView
          testID={testID}
          behavior="height"
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={styles.owner}
        >
          {body}
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  owner: { flex: 1 },
  scroller: { flex: 1 },
  content: { paddingTop: Spacing.four },
})
