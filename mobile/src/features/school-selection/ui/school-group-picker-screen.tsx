import { router, Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"

import {
  ErrorNotice,
  ErrorState,
  FieldError,
} from "@/components/error-surfaces"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import {
  type SchoolGroupNode,
  useSchoolGroups,
} from "@/features/school-selection/data"
import { selectGroup, selectSchool } from "@/features/school-selection/store"
import { Radii, Spacing, useTheme } from "@/theme"

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
    <>
      <Stack.Screen options={{ title: t("onboarding.group.title") }} />
      <RootPage
        testID="onboarding-group-content"
        lane="standard"
        style={styles.fill}
      >
        {({ laneStyle }) => (
          <>
            <ScrollView
              testID="onboarding-group-scroll"
              style={styles.fill}
              contentContainerStyle={[laneStyle, styles.list]}
            >
              {isLoading && (
                <ThemedText
                  themeColor="textSecondary"
                  accessibilityLiveRegion="polite"
                  accessibilityRole="text"
                >
                  {t("onboarding.group.loading")}
                </ThemedText>
              )}

              {isError &&
                (groups.length > 0 ? (
                  <ErrorNotice
                    compact
                    testID="onboarding-group-cached-error"
                    message={t("onboarding.group.error")}
                    action={{
                      label: t("onboarding.group.retry"),
                      testID: "onboarding-group-retry",
                      onPress: refetch,
                    }}
                  />
                ) : (
                  <ErrorState
                    testID="onboarding-group-error"
                    title={t("errors.loadTitle")}
                    message={t("onboarding.group.error")}
                    primaryAction={{
                      label: t("onboarding.group.retry"),
                      testID: "onboarding-group-retry",
                      onPress: refetch,
                    }}
                  />
                ))}

              {!isLoading && !isError && groups.length === 0 && (
                <ThemedText
                  themeColor="textSecondary"
                  accessibilityLiveRegion="polite"
                  accessibilityRole="text"
                >
                  {t("onboarding.group.empty")}
                </ThemedText>
              )}

              {groups.map((node) => (
                <GroupNode
                  key={node.value}
                  node={node}
                  selected={selected}
                  onToggleLeaf={onToggleLeaf}
                />
              ))}
            </ScrollView>

            {groups.length > 0 && (
              <View style={[laneStyle, styles.actions]}>
                {showGuard && (
                  <FieldError
                    message={t("onboarding.group.empty.selectionGuard")}
                  />
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
              </View>
            )}
          </>
        )}
      </RootPage>
    </>
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
  fill: {
    flex: 1,
  },
  actions: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  list: {
    paddingVertical: Spacing.four,
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
