import { router, Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  Button,
  ErrorNotice,
  FieldError,
  ListRow,
  ListSection,
  RootPage,
  StatusView,
} from "@/design"
import {
  type SchoolGroupNode,
  useSchoolGroups,
} from "@/features/school-selection/data"
import { selectGroup, selectSchool } from "@/features/school-selection/store"
import { Spacing } from "@/theme"

// Confirm dismisses the whole onboarding Stack, not router.back(), which would
// strand the user on the school list. An empty confirm is refused: it would
// persist "school, no group".
export default function SchoolGroupPickerScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ schoolId?: string }>()
  const schoolId = params.schoolId ?? ""
  const { groups, isLoading, isError, refetch } = useSchoolGroups(schoolId)
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [showGuard, setShowGuard] = useState(false)

  function onToggleLeaf(value: string) {
    setShowGuard(false)
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  function onToggleBranch(branch: SchoolGroupNode) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(branch.value)) {
        for (const value of subtreeValues(branch)) next.delete(value)
      } else {
        next.add(branch.value)
      }
      return next
    })
  }

  function onConfirm() {
    if (selected.length === 0) {
      setShowGuard(true)
      return
    }
    selectSchool(schoolId)
    selectGroup(selected)
    router.dismissTo("/onboarding")
  }

  return (
    <>
      <Stack.Screen options={{ title: t("onboarding.group.title") }} />
      <RootPage
        scrollsUnderHeader
        testID="onboarding-group-content"
        lane="standard"
        style={styles.fill}
      >
        {({ laneStyle }) => (
          <>
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              testID="onboarding-group-scroll"
              style={styles.fill}
              contentContainerStyle={[laneStyle, styles.list]}
            >
              {isLoading && (
                <StatusView
                  kind="loading"
                  presentation="section"
                  title={t("onboarding.group.loading")}
                />
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
                  <StatusView
                    kind="error"
                    presentation="section"
                    testID="onboarding-group-error"
                    title={t("errors.loadTitle")}
                    caption={t("onboarding.group.error")}
                    action={{
                      label: t("onboarding.group.retry"),
                      testID: "onboarding-group-retry",
                      onPress: refetch,
                    }}
                  />
                ))}

              {!isLoading && !isError && groups.length === 0 && (
                <StatusView
                  kind="empty"
                  presentation="section"
                  title={t("onboarding.group.empty")}
                />
              )}

              {groups.length > 0 && (
                <GroupLevel
                  nodes={groups}
                  testID="onboarding-group-section-root"
                  selected={new Set(selected)}
                  expanded={expanded}
                  onToggleLeaf={onToggleLeaf}
                  onToggleBranch={onToggleBranch}
                />
              )}
            </ScrollView>

            {groups.length > 0 && (
              <View style={[laneStyle, styles.actions]}>
                {showGuard && (
                  <FieldError
                    message={t("onboarding.group.empty.selectionGuard")}
                  />
                )}

                <Button
                  variant="filled"
                  testID="onboarding-group-confirm"
                  label={t("onboarding.group.confirm")}
                  accessibilityLabel={t("onboarding.group.confirmLabel")}
                  onPress={onConfirm}
                />
              </View>
            )}
          </>
        )}
      </RootPage>
    </>
  )
}

function subtreeValues(node: SchoolGroupNode): string[] {
  return [node.value, ...node.children.flatMap(subtreeValues)]
}

// ListSection positions only its direct rows, so each expanded branch opens a
// section of its own after its level instead of nesting inside it.
function GroupLevel({
  nodes,
  title,
  testID,
  selected,
  expanded,
  onToggleLeaf,
  onToggleBranch,
}: {
  nodes: readonly SchoolGroupNode[]
  title?: string
  testID: string
  selected: ReadonlySet<string>
  expanded: ReadonlySet<string>
  onToggleLeaf: (value: string) => void
  onToggleBranch: (branch: SchoolGroupNode) => void
}) {
  const { t } = useTranslation()
  const open = nodes.filter(
    (node) => node.children.length > 0 && expanded.has(node.value),
  )

  return (
    <>
      <ListSection title={title} testID={testID}>
        {nodes.map((node) =>
          node.children.length === 0 ? (
            <ListRow
              key={node.value}
              testID={`onboarding-group-leaf-${node.value}`}
              label={node.text}
              accessibilityLabel={t("onboarding.group.nodeLabel", {
                name: node.text,
              })}
              selected={selected.has(node.value)}
              onPress={() => onToggleLeaf(node.value)}
            />
          ) : (
            <ListRow
              key={node.value}
              testID={`onboarding-group-branch-${node.value}`}
              label={node.text}
              accessibilityLabel={t("onboarding.group.expandLabel", {
                name: node.text,
              })}
              expanded={expanded.has(node.value)}
              onPress={() => onToggleBranch(node)}
            />
          ),
        )}
      </ListSection>
      {open.map((branch) => (
        <GroupLevel
          key={branch.value}
          nodes={branch.children}
          title={branch.text}
          testID={`onboarding-group-section-${branch.value}`}
          selected={selected}
          expanded={expanded}
          onToggleLeaf={onToggleLeaf}
          onToggleBranch={onToggleBranch}
        />
      ))}
    </>
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
})
