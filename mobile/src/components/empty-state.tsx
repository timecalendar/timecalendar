import {
  Image,
  type ImageSourcePropType,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Spacing } from "@/theme"

export type EmptyStateArtwork = {
  light: ImageSourcePropType
  dark: ImageSourcePropType
}

type EmptyStateProps = {
  variant: "screen" | "section"
  title: string
  caption?: string
  artwork?: EmptyStateArtwork
  testID?: string
  style?: StyleProp<ViewStyle>
}

export function EmptyState({
  variant,
  title,
  caption,
  artwork,
  testID,
  style,
}: EmptyStateProps) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light"

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={[
        styles.base,
        variant === "screen" ? styles.screen : styles.section,
        style,
      ]}
    >
      {artwork === undefined ? null : (
        <Image
          testID={testID === undefined ? undefined : `${testID}-artwork`}
          source={artwork[scheme]}
          resizeMode="contain"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.artwork}
        />
      )}
      <ThemedText
        type="subtitle"
        style={variant === "screen" ? styles.centeredText : undefined}
      >
        {title}
      </ThemedText>
      {caption === undefined ? null : (
        <ThemedText
          themeColor="textSecondary"
          style={variant === "screen" ? styles.centeredText : undefined}
        >
          {caption}
        </ThemedText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    gap: Spacing.two,
  },
  screen: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.five,
  },
  section: {
    alignItems: "flex-start",
  },
  artwork: {
    width: "100%",
    maxWidth: 280,
    height: 200,
    marginBottom: Spacing.two,
  },
  centeredText: {
    textAlign: "center",
  },
})
