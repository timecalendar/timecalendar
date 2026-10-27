import type { ComponentProps } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import { headerScrollProps, PageIntro, RootPage, ThemedText } from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof RootPage>>

const SCROLL_PARAGRAPHS = 8

function DefaultFixture() {
  const { t } = useTranslation()
  return (
    <RootPage testID="gallery-root-page">
      <PageIntro caption={t("gallery.rootPage.introCaption")} />
      <ThemedText>{t("gallery.rootPage.body")}</ThemedText>
    </RootPage>
  )
}

function CaptionOnlyFixture() {
  const { t } = useTranslation()
  return (
    <RootPage testID="gallery-root-page">
      <PageIntro caption={t("gallery.rootPage.introCaption")} />
      <ThemedText>{t("gallery.rootPage.body")}</ThemedText>
    </RootPage>
  )
}

function ScrollsUnderHeaderFixture() {
  const { t } = useTranslation()
  return (
    <RootPage testID="gallery-root-page" scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          testID="gallery-root-page-scroll"
          contentContainerStyle={[laneStyle, styles.scrollContent]}
        >
          <PageIntro caption={t("gallery.rootPage.introCaption")} />
          {Array.from({ length: SCROLL_PARAGRAPHS }, (_, index) => (
            <ThemedText key={index}>
              {t("gallery.rootPage.paragraph", { number: index + 1 })}
            </ThemedText>
          ))}
        </ScrollView>
      )}
    </RootPage>
  )
}

function ReadableLaneFixture() {
  const { t } = useTranslation()
  return (
    <RootPage testID="gallery-root-page" lane="readable">
      <PageIntro caption={t("gallery.rootPage.readableCaption")} />
      <ThemedText>{t("gallery.rootPage.body")}</ThemedText>
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <RootPage testID="gallery-root-page" scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scrollContent]}
        >
          <PageIntro caption={t("gallery.stress.body")} />
          <ThemedText>{t("gallery.stress.word")}</ThemedText>
          <ThemedText>{t("gallery.stress.body")}</ThemedText>
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: Spacing.four, gap: Spacing.three },
})

const meta: GalleryMeta<ComponentProps<typeof RootPage>> = {
  id: "root-page",
  title: "gallery.rootPage.title",
  component: RootPage,
  stories: [
    "Default",
    "CaptionOnly",
    "ScrollsUnderHeader",
    "ReadableLane",
    "LongStrings",
  ],
}

export default meta

export const Default: Story = {
  name: "gallery.rootPage.story.default",
  render: () => <DefaultFixture />,
}

export const CaptionOnly: Story = {
  name: "gallery.rootPage.story.captionOnly",
  render: () => <CaptionOnlyFixture />,
}

export const ScrollsUnderHeader: Story = {
  name: "gallery.rootPage.story.scrollsUnderHeader",
  render: () => <ScrollsUnderHeaderFixture />,
}

export const ReadableLane: Story = {
  name: "gallery.rootPage.story.readableLane",
  render: () => <ReadableLaneFixture />,
}

export const LongStrings: Story = {
  name: "gallery.rootPage.story.longStrings",
  render: () => <LongStringsFixture />,
}
