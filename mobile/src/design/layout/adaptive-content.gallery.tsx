import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import {
  AdaptiveContent,
  type AdaptiveContentProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Radii, Spacing, useTheme } from "@/theme"

type Story = GalleryStory<AdaptiveContentProps>

function LaneFixture({
  lane,
  caption,
}: {
  lane: AdaptiveContentProps["lane"]
  caption: string
}) {
  const theme = useTheme()
  return (
    <RootPage lane="fullBleed">
      <AdaptiveContent
        lane={lane}
        testID="gallery-adaptive-content"
        contentContainerStyle={[
          styles.lane,
          { backgroundColor: theme.backgroundElement },
        ]}
      >
        <ThemedText>{caption}</ThemedText>
      </AdaptiveContent>
    </RootPage>
  )
}

function StandardLaneFixture() {
  const { t } = useTranslation()
  return (
    <LaneFixture
      lane="standard"
      caption={t("gallery.adaptiveContent.standard")}
    />
  )
}

function ReadableLaneFixture() {
  const { t } = useTranslation()
  return (
    <LaneFixture
      lane="readable"
      caption={t("gallery.adaptiveContent.readable")}
    />
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <LaneFixture
      lane="readable"
      caption={`${t("gallery.stress.title")} ${t("gallery.stress.word")} ${t("gallery.stress.body")}`}
    />
  )
}

const styles = StyleSheet.create({
  lane: {
    borderRadius: Radii.medium,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
})

const meta: GalleryMeta<AdaptiveContentProps> = {
  id: "adaptive-content",
  title: "gallery.adaptiveContent.title",
  component: AdaptiveContent,
  stories: ["StandardLane", "ReadableLane", "LongStrings"],
}

export default meta

export const StandardLane: Story = {
  name: "gallery.adaptiveContent.story.standardLane",
  render: () => <StandardLaneFixture />,
}

export const ReadableLane: Story = {
  name: "gallery.adaptiveContent.story.readableLane",
  render: () => <ReadableLaneFixture />,
}

export const LongStrings: Story = {
  name: "gallery.adaptiveContent.story.longStrings",
  render: () => <LongStringsFixture />,
}
