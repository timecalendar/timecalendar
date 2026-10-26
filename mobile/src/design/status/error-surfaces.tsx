import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"

import { Button } from "@/design/button/button"
import type { StatusAction } from "@/design/status/status-view"
import { ThemedText } from "@/design/text/themed-text"
import { useErrorAnnouncement } from "@/hooks/use-error-announcement"
import { Radii, Spacing, useTheme } from "@/theme"

type SurfaceProps = {
  message: string
  testID?: string
  style?: StyleProp<ViewStyle>
}

function ErrorMessage({
  title,
  message,
}: {
  title?: string | undefined
  message: string
}) {
  useErrorAnnouncement(title ? `${title}. ${message}` : message)
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
    >
      {title ? (
        <ThemedText
          type="sectionTitle"
          accessibilityRole="header"
          style={styles.title}
        >
          {title}
        </ThemedText>
      ) : null}
      <ThemedText>{message}</ThemedText>
    </View>
  )
}

export function FieldError({ message, testID, style }: SurfaceProps) {
  useErrorAnnouncement(message)
  return (
    <View style={style}>
      <ThemedText
        testID={testID}
        type="small"
        themeColor="error"
        accessibilityRole="alert"
        accessibilityLiveRegion={
          Platform.OS === "android" ? "polite" : undefined
        }
      >
        {message}
      </ThemedText>
    </View>
  )
}

export function ErrorNotice({
  title,
  message,
  action,
  compact = false,
  testID,
  style,
}: SurfaceProps & {
  title?: string
  action?: StatusAction
  compact?: boolean
}) {
  const theme = useTheme()
  return (
    <View
      testID={testID}
      style={[
        styles.notice,
        {
          backgroundColor: theme.backgroundElement,
          padding: compact ? Spacing.two : Spacing.three,
        },
        style,
      ]}
    >
      <ErrorMessage title={title} message={message} />
      {action ? <Button variant="text" {...action} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: Spacing.two },
  notice: { borderRadius: Radii.medium, gap: Spacing.two },
})
