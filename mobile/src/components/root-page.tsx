import type { ReactNode } from "react"
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import {
  type AdaptiveLayout,
  useAdaptiveLayout,
} from "@/components/adaptive-content"
import { ThemedText } from "@/components/themed-text"
import { type ResponsiveLane, Spacing, useTheme } from "@/theme"

type RootPageProps = {
  children: ReactNode | ((layout: AdaptiveLayout) => ReactNode)
  lane?: ResponsiveLane
  testID?: string
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function RootPage({
  children,
  lane = "standard",
  testID,
  style,
  contentContainerStyle,
}: RootPageProps) {
  const theme = useTheme()
  const layout = useAdaptiveLayout(lane)
  const content =
    typeof children === "function" ? (
      children(layout)
    ) : (
      <View
        testID={testID === undefined ? undefined : `${testID}-lane`}
        style={[styles.lane, layout.laneStyle, contentContainerStyle]}
      >
        {children}
      </View>
    )

  return (
    <SafeAreaView
      testID={testID}
      edges={["bottom", "left", "right"]}
      onLayout={layout.onLayout}
      style={[styles.page, { backgroundColor: theme.background }, style]}
    >
      {content}
    </SafeAreaView>
  )
}

type PageIntroProps = {
  title?: string
  caption?: string
  testID?: string
  style?: StyleProp<ViewStyle>
}

export function PageIntro({ title, caption, testID, style }: PageIntroProps) {
  if (title === undefined && caption === undefined) return null

  return (
    <View testID={testID} style={[styles.intro, style]}>
      {title === undefined ? null : (
        <ThemedText type="subtitle">{title}</ThemedText>
      )}
      {caption === undefined ? null : (
        <ThemedText themeColor="textSecondary">{caption}</ThemedText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: Spacing.four,
  },
  lane: {
    flex: 1,
  },
  intro: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
})
