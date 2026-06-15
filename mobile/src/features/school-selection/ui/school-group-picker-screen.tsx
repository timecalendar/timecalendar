import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { ThemedView } from "@/components/themed-view"
import {
  type SchoolGroupNode,
  useSchoolGroups,
} from "@/features/school-selection/data"
import { selectGroup, selectSchool } from "@/features/school-selection/store"
import { MaxContentWidth, Radii, Spacing, useTheme } from "@/theme"

// The onboarding group step (C1 / TIM-134; multi-select GROW — Phase-3 ship 2,
// ADR 016) — PRESENTATIONAL (70% floor): reads the schoolId route param, renders
// the SchoolGroupItem tree over the feature's useSchoolGroups(schoolId). Leaves
// are TOGGLES that add/remove their value from a pending selection set (with an
// accessible selected state); branches expand/collapse (not selectable). A
// primary confirm control commits the whole set in one write (selectSchool +
// selectGroup) then dismisses the entire onboarding Stack (router.dismissTo) —
// not router.back(), which would strand the user on the school list (D3).
// Confirming an empty set is guarded (no commit). Loading/error/empty stay
// accessible with a retry.
export default function SchoolGroupPickerScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const params = useLocalSearchParams<{ schoolId?: string }>()
  const schoolId = params.schoolId ?? ""
  const { groups, isLoading, isError, refetch } = useSchoolGroups(schoolId)
  const [selected, setSelected] = useState<string[]>([])
  const [showGuard, setShowGuard] = useState(false)

  function onToggleLeaf(value: string) {
    setShowGuard(false)
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  function onConfirm() {
    if (selected.length === 0) {
      // Guard: an empty confirm would persist "school, no group" — we want an
      // explicit pick (D1), matching the Flutter assistant which never commits
      // an empty grade.
      setShowGuard(true)
      return
    }
    // Persist the selection identity in one commit (D1): the school, then the set.
    selectSchool(schoolId)
    selectGroup(selected)
    // Complete the flow — dismiss the whole onboarding Stack back to its entry (D3).
    router.dismissTo("/onboarding")
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t("onboarding.group.title")}</ThemedText>

        {isLoading && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("onboarding.group.loading")}
          </ThemedText>
        )}

        {isError && <ErrorRetry onRetry={refetch} />}

        {!isLoading && !isError && groups.length === 0 && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
          >
            {t("onboarding.group.empty")}
          </ThemedText>
        )}

        <ScrollView contentContainerStyle={styles.list}>
          {groups.map((node) => (
            <GroupNode
              key={node.value}
              node={node}
              selected={selected}
              onToggleLeaf={onToggleLeaf}
            />
          ))}
        </ScrollView>

        {showGuard && (
          <ThemedText
            themeColor="textSecondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {t("onboarding.group.empty.selectionGuard")}
          </ThemedText>
        )}

        <Pressable
          testID="onboarding-group-confirm"
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.group.confirmLabel")}
          hitSlop={Spacing.two}
          onPress={onConfirm}
          style={[
            styles.confirm,
            { backgroundColor: theme.backgroundSelected },
          ]}
        >
          <ThemedText type="smallBold">
            {t("onboarding.group.confirm")}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  )
}

function ErrorRetry({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View style={styles.errorBlock}>
      <ThemedText
        themeColor="textSecondary"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        {t("onboarding.group.error")}
      </ThemedText>
      <Pressable
        testID="onboarding-group-retry"
        accessibilityRole="button"
        accessibilityLabel={t("onboarding.group.retry")}
        hitSlop={Spacing.two}
        onPress={onRetry}
        style={[styles.retry, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText type="smallBold">{t("onboarding.group.retry")}</ThemedText>
      </Pressable>
    </View>
  )
}

function GroupNode({
  node,
  selected,
  onToggleLeaf,
}: {
  node: SchoolGroupNode
  selected: string[]
  onToggleLeaf: (value: string) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const isLeaf = node.children.length === 0

  if (isLeaf) {
    const isSelected = selected.includes(node.value)
    return (
      <Pressable
        testID={`onboarding-group-leaf-${node.value}`}
        accessibilityRole="button"
        accessibilityLabel={t("onboarding.group.nodeLabel", {
          name: node.text,
        })}
        accessibilityState={{ selected: isSelected }}
        onPress={() => onToggleLeaf(node.value)}
        style={[
          styles.node,
          {
            backgroundColor: isSelected
              ? theme.backgroundSelected
              : theme.backgroundElement,
          },
        ]}
      >
        <ThemedText type="smallBold">{node.text}</ThemedText>
      </Pressable>
    )
  }

  return (
    <View style={styles.branch}>
      <Pressable
        testID={`onboarding-group-branch-${node.value}`}
        accessibilityRole="button"
        accessibilityLabel={t("onboarding.group.expandLabel", {
          name: node.text,
        })}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((prev) => !prev)}
        style={[styles.node, { backgroundColor: theme.backgroundSelected }]}
      >
        <ThemedText type="smallBold">{node.text}</ThemedText>
      </Pressable>
      {expanded && (
        <View style={styles.children}>
          {node.children.map((child) => (
            <GroupNode
              key={child.value}
              node={child}
              selected={selected}
              onToggleLeaf={onToggleLeaf}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  errorBlock: {
    gap: Spacing.two,
  },
  retry: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: Radii.medium,
  },
  list: {
    gap: Spacing.two,
  },
  branch: {
    gap: Spacing.two,
  },
  children: {
    gap: Spacing.two,
    paddingLeft: Spacing.three,
  },
  node: {
    minHeight: 48,
    padding: Spacing.three,
    justifyContent: "center",
    borderRadius: Radii.medium,
  },
  confirm: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radii.medium,
  },
})
