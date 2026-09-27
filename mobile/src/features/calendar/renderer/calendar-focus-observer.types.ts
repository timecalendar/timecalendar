import type { ReactNode } from "react"
import type { StyleProp, ViewStyle } from "react-native"

export type NativeAccessibilityFocus = {
  identity: string
  dateKey: string
  generation: number
}

export type CalendarFocusObserverViewProps = {
  identity: string
  dateKey: string
  generation: number
  onAccessibilityFocused: (event: {
    nativeEvent: NativeAccessibilityFocus
  }) => void
  style?: StyleProp<ViewStyle>
  testID?: string
  children: ReactNode
}
