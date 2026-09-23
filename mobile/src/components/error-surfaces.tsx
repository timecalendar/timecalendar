import { SymbolView } from "expo-symbols"
import {
  ActivityIndicator,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"

import { PrimaryAction } from "@/components/primary-action"
import { ThemedText } from "@/components/themed-text"
import { useErrorAnnouncement } from "@/components/use-error-announcement"
import { Radii, Spacing, useTheme } from "@/theme"

export type ErrorAction = {
  label: string
  onPress: () => void
  accessibilityLabel?: string
  testID?: string
  disabled?: boolean
  busy?: boolean
}

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
        <ThemedText accessibilityRole="header" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}
      <ThemedText>{message}</ThemedText>
    </View>
  )
}

export function FieldError({
  message,
  nativeID,
  testID,
  style,
}: SurfaceProps & { nativeID?: string }) {
  useErrorAnnouncement(message)
  return (
    <View style={style}>
      <ThemedText
        nativeID={nativeID}
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

export function ErrorTextAction({
  label,
  onPress,
  accessibilityLabel = label,
  testID,
  disabled = false,
  busy = false,
  role = "button",
  style,
}: ErrorAction & { role?: "button" | "link"; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme()
  const blocked = disabled || busy
  return (
    <Pressable
      testID={testID}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={blocked ? undefined : onPress}
      android_ripple={{ color: theme.ripple }}
      style={({ pressed }) => [
        style,
        styles.textAction,
        {
          minHeight: Platform.OS === "ios" ? 44 : 48,
          opacity: blocked ? 0.55 : pressed && Platform.OS === "ios" ? 0.65 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={theme.actionText}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
      <ThemedText
        type="smallBold"
        themeColor="actionText"
        style={styles.actionLabel}
      >
        {label}
      </ThemedText>
    </Pressable>
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
  action?: ErrorAction & { role?: "button" | "link" }
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
      {action ? <ErrorTextAction {...action} /> : null}
    </View>
  )
}

/** Content only: the screen owns scrolling, safe areas and navigation. */
export function ErrorState({
  title,
  message,
  primaryAction,
  secondaryAction,
  testID,
  style,
}: SurfaceProps & {
  title: string
  primaryAction?: ErrorAction
  secondaryAction?: ErrorAction
}) {
  const theme = useTheme()
  return (
    <View testID={testID} style={[styles.state, style]}>
      <SymbolView
        name={{ ios: "exclamationmark.circle", android: "error_outline" }}
        size={40}
        tintColor={theme.error}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <ErrorMessage title={title} message={message} />
      {primaryAction || secondaryAction ? (
        <View style={styles.actions}>
          {primaryAction ? <PrimaryAction {...primaryAction} /> : null}
          {secondaryAction ? <ErrorTextAction {...secondaryAction} /> : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  notice: { borderRadius: Radii.medium, gap: Spacing.two },
  state: { gap: Spacing.three, width: "100%" },
  actions: { gap: Spacing.two, width: "100%" },
  textAction: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.two,
  },
  actionLabel: { flexShrink: 1, textAlign: "center" },
})
