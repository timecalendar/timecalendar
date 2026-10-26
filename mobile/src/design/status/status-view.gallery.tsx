import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  noDataArtwork,
  RootPage,
  StatusView,
  type StatusViewProps,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing, useIsAccessibilityTextSize } from "@/theme"

type Story = GalleryStory<StatusViewProps>

const TEST_ID = "gallery-status-view"

function usePressCount() {
  const [count, setCount] = useState(0)
  return [count, () => setCount((value) => value + 1)] as const
}

function PressCount({ count }: { count: number }) {
  const { t } = useTranslation()
  return (
    <ThemedText tone="secondary" testID={`${TEST_ID}-count`}>
      {t("gallery.pressCount", { count })}
    </ThemedText>
  )
}

function ArtworkCaption() {
  const { t } = useTranslation()
  const hidden = useIsAccessibilityTextSize()
  return (
    <ThemedText tone="secondary" testID={`${TEST_ID}-artwork-state`}>
      {t(
        hidden
          ? "gallery.statusView.artworkHidden"
          : "gallery.statusView.artworkShown",
      )}
    </ThemedText>
  )
}

function LoadingScreenFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <StatusView
        kind="loading"
        presentation="screen"
        title={t("gallery.statusView.loadingTitle")}
        testID={TEST_ID}
      />
    </RootPage>
  )
}

function LoadingSectionFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <ThemedText type="sectionTitle">
        {t("gallery.statusView.sectionTitle")}
      </ThemedText>
      <StatusView
        kind="loading"
        presentation="section"
        title={t("gallery.statusView.loadingTitle")}
        testID={TEST_ID}
      />
    </RootPage>
  )
}

function LoadingInlineFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <View style={styles.stack}>
        <ThemedText type="sectionTitle">
          {t("gallery.statusView.sectionTitle")}
        </ThemedText>
        <StatusView
          kind="loading"
          presentation="inline"
          title={t("gallery.statusView.loadingTitle")}
          testID={TEST_ID}
        />
      </View>
    </RootPage>
  )
}

function EmptyScreenFixture({ artwork = false }: { artwork?: boolean }) {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage>
      <StatusView
        kind="empty"
        presentation="screen"
        title={t("gallery.statusView.emptyTitle")}
        caption={t("gallery.statusView.emptyCaption")}
        {...(artwork
          ? {
              artwork: noDataArtwork,
              action: {
                label: t("gallery.statusView.add"),
                onPress: press,
                testID: `${TEST_ID}-primary`,
              },
            }
          : {})}
        testID={TEST_ID}
      />
      {artwork ? <PressCount count={count} /> : null}
    </RootPage>
  )
}

function EmptySectionFixture() {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage>
      <StatusView
        kind="empty"
        presentation="section"
        title={t("gallery.statusView.noResultsTitle")}
        caption={t("gallery.statusView.noResultsCaption")}
        symbol={{ ios: "magnifyingglass", android: "search" }}
        secondaryAction={{
          label: t("gallery.statusView.missing"),
          onPress: press,
          testID: `${TEST_ID}-secondary`,
        }}
        testID={TEST_ID}
      />
      <PressCount count={count} />
    </RootPage>
  )
}

function EmptyInlineFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <View style={styles.stack}>
        <ThemedText type="sectionTitle">
          {t("gallery.statusView.sectionTitle")}
        </ThemedText>
        <StatusView
          kind="empty"
          presentation="inline"
          title={t("gallery.statusView.emptyTitle")}
          caption={t("gallery.statusView.emptyCaption")}
          testID={TEST_ID}
        />
      </View>
    </RootPage>
  )
}

function ErrorFixture({
  presentation,
  busy = false,
}: {
  presentation: "screen" | "section"
  busy?: boolean
}) {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage>
      <StatusView
        kind="error"
        presentation={presentation}
        title={t("gallery.statusView.errorTitle")}
        caption={t("gallery.statusView.errorCaption")}
        action={{
          label: t("gallery.statusView.retry"),
          onPress: press,
          busy,
          testID: `${TEST_ID}-primary`,
        }}
        {...(presentation === "screen"
          ? {
              secondaryAction: {
                label: t("gallery.statusView.secondary"),
                onPress: press,
                disabled: busy,
                testID: `${TEST_ID}-secondary`,
              },
            }
          : {})}
        testID={TEST_ID}
      />
      <PressCount count={count} />
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const [count, press] = usePressCount()
  return (
    <RootPage>
      <ArtworkCaption />
      <StatusView
        kind="empty"
        presentation="screen"
        title={t("gallery.stress.title")}
        caption={`${t("gallery.stress.body")} ${t("gallery.stress.word")}`}
        artwork={noDataArtwork}
        action={{
          label: t("gallery.stress.action"),
          onPress: press,
          testID: `${TEST_ID}-primary`,
        }}
        secondaryAction={{
          label: t("gallery.stress.word"),
          onPress: press,
          testID: `${TEST_ID}-secondary`,
        }}
        testID={TEST_ID}
      />
      <PressCount count={count} />
    </RootPage>
  )
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.three },
})

const meta: GalleryMeta<StatusViewProps> = {
  id: "status-view",
  title: "gallery.statusView.title",
  component: StatusView,
  stories: [
    "LoadingScreen",
    "LoadingSection",
    "LoadingInline",
    "EmptyScreen",
    "EmptyScreenArtwork",
    "EmptySection",
    "EmptyInline",
    "ErrorScreen",
    "ErrorRetryBusy",
    "ErrorSection",
    "LongStrings",
  ],
}

export default meta

export const LoadingScreen: Story = {
  name: "gallery.statusView.story.loadingScreen",
  render: () => <LoadingScreenFixture />,
}

export const LoadingSection: Story = {
  name: "gallery.statusView.story.loadingSection",
  render: () => <LoadingSectionFixture />,
}

export const LoadingInline: Story = {
  name: "gallery.statusView.story.loadingInline",
  render: () => <LoadingInlineFixture />,
}

export const EmptyScreen: Story = {
  name: "gallery.statusView.story.emptyScreen",
  render: () => <EmptyScreenFixture />,
}

export const EmptyScreenArtwork: Story = {
  name: "gallery.statusView.story.emptyScreenArtwork",
  render: () => <EmptyScreenFixture artwork />,
}

export const EmptySection: Story = {
  name: "gallery.statusView.story.emptySection",
  render: () => <EmptySectionFixture />,
}

export const EmptyInline: Story = {
  name: "gallery.statusView.story.emptyInline",
  render: () => <EmptyInlineFixture />,
}

export const ErrorScreen: Story = {
  name: "gallery.statusView.story.errorScreen",
  render: () => <ErrorFixture presentation="screen" />,
}

export const ErrorRetryBusy: Story = {
  name: "gallery.statusView.story.errorRetryBusy",
  render: () => <ErrorFixture presentation="screen" busy />,
}

export const ErrorSection: Story = {
  name: "gallery.statusView.story.errorSection",
  render: () => <ErrorFixture presentation="section" />,
}

export const LongStrings: Story = {
  name: "gallery.statusView.story.longStrings",
  render: () => <LongStringsFixture />,
}
