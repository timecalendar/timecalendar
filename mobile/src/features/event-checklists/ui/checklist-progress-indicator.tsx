import { SymbolView } from "expo-symbols"
import type { TFunction } from "i18next"
import { Platform, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import type { ChecklistProgress } from "@/features/event-checklists/data"
import { Radii, Spacing, useTheme } from "@/theme"

export type ChecklistProgressVariant = "inline" | "compact"

export function checklistProgressLabel(
  t: TFunction,
  progress: ChecklistProgress | undefined,
): string | undefined {
  if (progress === undefined || progress.total === 0) return undefined
  return t("eventChecklist.progress.completed", {
    completed: progress.completed,
    total: progress.total,
  })
}

export function ChecklistProgressIndicator({
  progress,
  variant = "inline",
  bounds,
}: {
  progress: ChecklistProgress | undefined
  variant?: ChecklistProgressVariant
  bounds?: { width: number; height: number }
}) {
  const theme = useTheme()
  if (progress === undefined || progress.total === 0) return null

  const compact = variant === "compact"
  const dense =
    compact && bounds !== undefined && (bounds.width < 48 || bounds.height < 24)
  const color = progress.isComplete ? theme.positive : theme.informational

  return (
    <View
      testID={`checklist-progress-${variant}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        compact ? styles.compact : styles.inline,
        dense && styles.dense,
        bounds && { maxWidth: bounds.width, maxHeight: bounds.height },
        { borderColor: color },
      ]}
    >
      <SymbolView
        testID="checklist-progress-glyph"
        name={
          Platform.OS === "ios"
            ? progress.isComplete
              ? "checkmark.square.fill"
              : "square"
            : {
                android: progress.isComplete
                  ? "check_box"
                  : "check_box_outline_blank",
              }
        }
        size={dense ? 7 : compact ? 11 : 16}
        tintColor={color}
        style={styles.glyph}
      />
      <ThemedText
        testID="checklist-progress-count"
        type={compact ? "captionSmall" : "small"}
        style={[styles.count, dense && styles.denseCount, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit={compact}
        minimumFontScale={compact ? 0.75 : undefined}
      >
        {`${progress.completed}/${progress.total}`}
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 1,
  },
  inline: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  compact: {
    gap: Spacing.half,
    maxWidth: 64,
    paddingHorizontal: Spacing.one,
  },
  dense: {
    gap: 1,
    paddingHorizontal: 0,
  },
  denseCount: {
    fontSize: 8,
    lineHeight: 9,
  },
  glyph: { flexShrink: 0 },
  count: { flexShrink: 1, fontVariant: ["tabular-nums"] },
})
