import { useTranslation } from "react-i18next"
import {
  Platform,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Spacing, useTheme } from "@/theme"

export function VisibilityControl({
  calendarId,
  name,
  visible,
  onToggle,
}: {
  calendarId: string
  name: string
  visible: boolean
  onToggle: (visible: boolean) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { fontScale } = useWindowDimensions()
  const largeText = fontScale >= 1.3

  return (
    <View
      testID={`user-calendar-visibility-layout-${calendarId}`}
      style={[styles.row, largeText && styles.rowLargeText]}
    >
      <View
        style={styles.label}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <ThemedText type="small">
          {t("userCalendars.visibilityShort")}
        </ThemedText>
      </View>
      <View style={[styles.target, largeText && styles.targetLargeText]}>
        <Switch
          testID={`user-calendar-visibility-${calendarId}`}
          accessibilityLabel={t("userCalendars.visibilityLabel", { name })}
          accessibilityHint={t("userCalendars.visibilityHint")}
          value={visible}
          onValueChange={onToggle}
          trackColor={
            Platform.OS === "android"
              ? { false: theme.backgroundSelected, true: theme.primarySoft }
              : { true: theme.primary }
          }
          thumbColor={
            Platform.OS === "android"
              ? visible
                ? theme.primary
                : theme.textSecondary
              : undefined
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  rowLargeText: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  label: { flex: 1, flexShrink: 1 },
  target: {
    minWidth: 51,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  targetLargeText: { alignSelf: "flex-end" },
})
