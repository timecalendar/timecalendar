import type { SFSymbol } from "expo-symbols"
import type { TFunction } from "i18next"
import { StyleSheet, View } from "react-native"

import { Badge, Icon, type MaterialGlyph, ThemedText } from "@/design"
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

type Density = "compact" | "dense"

const GLYPH_SIZE: Record<Density, number> = {
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
  bounds: { width: number; height: number } | undefined,
): Density {
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

  const glyph = GLYPH[progress.isComplete ? "complete" : "pending"]
  const count = `${progress.completed}/${progress.total}`

  if (variant === "inline") {
    return (
      <Badge
        tone={progress.isComplete ? "positive" : "informational"}
        size="medium"
        icon={glyph}
        label={count}
        accessibilityLabel={null}
        testID="checklist-progress-inline"
      />
    )
  }

  const density = densityOf(bounds)
  const dense = density === "dense"
  const color = progress.isComplete ? theme.positive : theme.informational

  return (
    <View
      testID="checklist-progress-compact"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
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
        type="captionSmall"
        style={[styles.count, dense && styles.denseCount, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {count}
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
