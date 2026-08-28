import type { Href } from "expo-router"
import { router } from "expo-router"
import { type AndroidSymbol, type SFSymbol, SymbolView } from "expo-symbols"
import { Platform, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

interface SettingsRowBaseProps {
  icon: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }
  label: string
  accessibilityLabel?: string
  testID: string
  first?: boolean
}

interface SettingsRouterRowProps extends SettingsRowBaseProps {
  variant?: "router"
  href: Href
  hint: string
  secondary?: string
  onPress?: never
  value?: never
}

interface SettingsActionRowProps extends SettingsRowBaseProps {
  variant: "action"
  onPress: () => void
  hint: string
  accessibilityRole?: "button" | "link"
  secondary?: string
  href?: never
  value?: never
}

interface SettingsValueRowProps extends SettingsRowBaseProps {
  variant: "value"
  value: string
  href?: never
  hint?: never
  onPress?: never
  secondary?: never
}

export type SettingsRowProps =
  | SettingsRouterRowProps
  | SettingsActionRowProps
  | SettingsValueRowProps

export function SettingsRow(props: SettingsRowProps) {
  const theme = useTheme()
  const minimumHeight = Platform.OS === "ios" ? 44 : 48
  const isValue = props.variant === "value"
  const secondary = isValue ? props.value : props.secondary

  const content = (
    <>
      {!props.first ? (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.separator, { backgroundColor: theme.separator }]}
        />
      ) : null}
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.icon, { backgroundColor: theme.primarySoft }]}
      >
        <SymbolView
          name={props.icon}
          size={20}
          tintColor={theme.primary}
          style={styles.symbol}
        />
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.label}>{props.label}</ThemedText>
        {secondary ? (
          <ThemedText themeColor="textSecondary" type="small">
            {secondary}
          </ThemedText>
        ) : null}
      </View>
      {!isValue ? (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={styles.chevronContainer}
        >
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={16}
            tintColor={theme.textTertiary}
            style={styles.chevron}
          />
        </View>
      ) : null}
    </>
  )

  if (isValue) {
    return (
      <View
        accessible
        accessibilityLabel={props.accessibilityLabel ?? props.label}
        accessibilityValue={{ text: props.value }}
        testID={props.testID}
        style={[
          styles.row,
          {
            minHeight: minimumHeight,
            backgroundColor: theme.backgroundElement,
          },
        ]}
      >
        {content}
      </View>
    )
  }

  const onPress =
    props.variant === "action"
      ? props.onPress
      : () => {
          router.push(props.href)
        }

  return (
    <Pressable
      accessibilityRole={
        props.variant === "action"
          ? (props.accessibilityRole ?? "link")
          : "link"
      }
      accessibilityLabel={props.accessibilityLabel ?? props.label}
      accessibilityHint={props.hint}
      testID={props.testID}
      onPress={onPress}
      android_ripple={{ color: theme.ripple, foreground: true }}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: minimumHeight,
          backgroundColor:
            Platform.OS === "ios" && pressed
              ? theme.backgroundSelected
              : theme.backgroundElement,
        },
      ]}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radii.medium,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  symbol: { width: 20, height: 20 },
  chevron: { width: 16, height: 16 },
  text: { flex: 1, minWidth: 0, gap: Spacing.one },
  label: { flexShrink: 1 },
  chevronContainer: { flexShrink: 0 },
  separator: {
    position: "absolute",
    top: 0,
    right: 0,
    left: Spacing.three + 32 + Spacing.three,
    height: StyleSheet.hairlineWidth,
  },
})
