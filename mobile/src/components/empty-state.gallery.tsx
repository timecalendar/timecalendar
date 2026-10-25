import type { ComponentProps } from "react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/empty-state"
import { noDataArtwork } from "@/components/empty-state-artwork"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"

type Story = GalleryStory<ComponentProps<typeof EmptyState>>

function ScreenFixture({ artwork }: { artwork: boolean }) {
  const { t } = useTranslation()
  return (
    <RootPage>
      <EmptyState
        variant="screen"
        title={t("gallery.emptyState.emptyTitle")}
        caption={t("gallery.emptyState.emptyCaption")}
        {...(artwork ? { artwork: noDataArtwork } : {})}
        testID="gallery-empty-state"
      />
    </RootPage>
  )
}

function SectionFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <ThemedText type="sectionTitle">
        {t("gallery.emptyState.sectionTitle")}
      </ThemedText>
      <EmptyState
        variant="section"
        title={t("gallery.emptyState.emptyTitle")}
        caption={t("gallery.emptyState.emptyCaption")}
        testID="gallery-empty-state"
      />
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <EmptyState
        variant="screen"
        title={t("gallery.stress.title")}
        caption={`${t("gallery.stress.body")} ${t("gallery.stress.word")}`}
        artwork={noDataArtwork}
        testID="gallery-empty-state"
      />
    </RootPage>
  )
}

const meta: GalleryMeta<ComponentProps<typeof EmptyState>> = {
  id: "empty-state",
  title: "gallery.emptyState.title",
  component: EmptyState,
  stories: ["Screen", "ScreenWithArtwork", "Section", "LongStrings"],
}

export default meta

export const Screen: Story = {
  name: "gallery.emptyState.story.screen",
  render: () => <ScreenFixture artwork={false} />,
}

export const ScreenWithArtwork: Story = {
  name: "gallery.emptyState.story.screenWithArtwork",
  render: () => <ScreenFixture artwork />,
}

export const Section: Story = {
  name: "gallery.emptyState.story.section",
  render: () => <SectionFixture />,
}

export const LongStrings: Story = {
  name: "gallery.emptyState.story.longStrings",
  render: () => <LongStringsFixture />,
}
