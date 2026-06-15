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

// The onboarding group step (C1 / TIM-134) — PRESENTATIONAL (70% floor): reads
// the schoolId route param, renders the SchoolGroupItem tree over the feature's
// useSchoolGroups(schoolId). A leaf (no children) is selectable — selecting it
// persists the school + group selection through the store and completes the flow
// (navigate back); a branch is expandable (proportionate, design D7 — not a
// bespoke deep-tree widget). Loading/error/empty are accessible with a retry.
export default function SchoolGroupPickerScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ schoolId?: string }>()
  const schoolId = params.schoolId ?? ""
  const { groups, isLoading, isError, refetch } = useSchoolGroups(schoolId)

  function onSelectLeaf(value: string) {
    // Persist the selection identity (D4): the school, then the chosen group.
    selectSchool(schoolId)
    selectGroup([value])
    // Complete the flow — return to the entry point.
    router.back()
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
              onSelectLeaf={onSelectLeaf}
            />
          ))}
        </ScrollView>
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
  onSelectLeaf,
}: {
  node: SchoolGroupNode
  onSelectLeaf: (value: string) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const isLeaf = node.children.length === 0

  if (isLeaf) {
    return (
      <Pressable
        testID={`onboarding-group-leaf-${node.value}`}
        accessibilityRole="button"
        accessibilityLabel={t("onboarding.group.nodeLabel", {
          name: node.text,
        })}
        onPress={() => onSelectLeaf(node.value)}
        style={[styles.node, { backgroundColor: theme.backgroundElement }]}
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
              onSelectLeaf={onSelectLeaf}
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
})
