import type { SFSymbol } from "expo-symbols"
import type { TFunction } from "i18next"
import { StyleSheet, View } from "react-native"

import { Icon, type MaterialGlyph, ThemedText } from "@/design"
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

type Density = "inline" | "compact" | "dense"

const GLYPH_SIZE: Record<Density, number> = {
  inline: 16,
  compact: 11,
  dense: 7,
}

const GLYPH: Record<
  "complete" | "pending",
  { ios: SFSymbol; android: MaterialGlyph }
> = {
  complete: { ios: "checkmark.square.fill", android: "check_box" },
  pending: { ios: "square", android: "check_box_outline_blank" },
}

function densityOf(
  variant: ChecklistProgressVariant,
  bounds: { width: number; height: number } | undefined,
): Density {
  if (variant === "inline") return "inline"
  if (bounds !== undefined && (bounds.width < 48 || bounds.height < 24)) {
    return "dense"
  }
  return "compact"
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
  const density = densityOf(variant, bounds)
  const dense = density === "dense"
  const color = progress.isComplete ? theme.positive : theme.informational
  const glyph = GLYPH[progress.isComplete ? "complete" : "pending"]

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
      <Icon
        testID="checklist-progress-glyph"
        ios={glyph.ios}
        android={glyph.android}
        size={GLYPH_SIZE[density]}
        color={color}
        scaling="text"
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
  count: { flexShrink: 1, fontVariant: ["tabular-nums"] },
})
