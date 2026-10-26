import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, ScrollView, StyleSheet, View } from "react-native"

import {
  FloatingAction,
  type FloatingActionProps,
  NativeList,
  NativeListRow,
  NativeListSection,
} from "@/components/chrome"
import { RootPage, ThemedText } from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Layout, Spacing } from "@/theme"

type Story = GalleryStory<FloatingActionProps>

const addIcon = { ios: "plus", android: "add" } as const
const ROWS = Array.from({ length: 14 }, (_, index) => index + 1)
const SCROLL_LINES = Array.from({ length: 48 }, (_, index) => index + 1)

function usePressCount() {
  const [count, setCount] = useState(0)
  return { count, increment: () => setCount((value) => value + 1) }
}

function IosCaption() {
  const { t } = useTranslation()
  if (Platform.OS !== "ios") return null
  return (
    <ThemedText testID="gallery-floating-action-ios-caption">
      {t("gallery.floatingAction.iosCaption")}
    </ThemedText>
  )
}

function DefaultFixture({ long = false }: { long?: boolean }) {
  const { t } = useTranslation()
  const { count, increment } = usePressCount()
  return (
    <View style={styles.fill}>
      <RootPage testID="gallery-floating-action-page">
        <IosCaption />
        <ThemedText testID="gallery-floating-action-count">
          {t("gallery.pressCount", { count })}
        </ThemedText>
      </RootPage>
      <FloatingAction
        icon={addIcon}
        label={t(
          long
            ? "gallery.floatingAction.longLabel"
            : "gallery.floatingAction.label",
        )}
        testID="gallery-floating-action"
        onPress={increment}
      />
    </View>
  )
}

function OverListFixture() {
  const { t } = useTranslation()
  const { count, increment } = usePressCount()
  return (
    <View style={styles.fill}>
      <NativeList reservesFloatingAction>
        <NativeListSection
          footer={
            Platform.OS === "ios"
              ? t("gallery.floatingAction.iosCaption")
              : undefined
          }
        >
          <NativeListRow
            kind="value"
            label={t("gallery.floatingAction.label")}
            value={String(count)}
            testID="gallery-floating-action-count"
          />
          {ROWS.map((index) => (
            <NativeListRow
              key={index}
              kind="value"
              label={t("gallery.floatingAction.row", { index })}
              testID={`gallery-floating-action-row-${index}`}
            />
          ))}
          <NativeListRow
            kind="value"
            label={t("gallery.floatingAction.lastRow")}
            testID="gallery-floating-action-last-row"
          />
        </NativeListSection>
      </NativeList>
      <FloatingAction
        icon={addIcon}
        label={t("gallery.floatingAction.label")}
        testID="gallery-floating-action"
        onPress={increment}
      />
    </View>
  )
}

function OverScrollFixture() {
  const { t } = useTranslation()
  const { count, increment } = usePressCount()
  return (
    <View style={styles.fill}>
      <ScrollView
        testID="gallery-floating-action-scroll"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        <IosCaption />
        <ThemedText testID="gallery-floating-action-count">
          {t("gallery.pressCount", { count })}
        </ThemedText>
        <ThemedText>
          {SCROLL_LINES.map((index) =>
            t("gallery.floatingAction.row", { index }),
          ).join("\n")}
        </ThemedText>
        <ThemedText testID="gallery-floating-action-last-row">
          {t("gallery.floatingAction.lastRow")}
        </ThemedText>
      </ScrollView>
      <FloatingAction
        icon={addIcon}
        label={t("gallery.floatingAction.label")}
        testID="gallery-floating-action"
        onPress={increment}
      />
    </View>
  )
}

const meta: GalleryMeta<FloatingActionProps> = {
  id: "floating-action",
  title: "gallery.floatingAction.title",
  component: FloatingAction,
  stories: ["Default", "OverList", "OverScroll", "LongLabel"],
}

export default meta

export const Default: Story = {
  name: "gallery.floatingAction.story.default",
  render: () => <DefaultFixture />,
}

export const OverList: Story = {
  name: "gallery.floatingAction.story.overList",
  render: () => <OverListFixture />,
}

export const OverScroll: Story = {
  name: "gallery.floatingAction.story.overScroll",
  render: () => <OverScrollFixture />,
}

export const LongLabel: Story = {
  name: "gallery.floatingAction.story.longLabel",
  render: () => <DefaultFixture long />,
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Layout.fabClearance,
    gap: Spacing.three,
  },
})
