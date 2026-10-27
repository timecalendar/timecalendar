import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  headerScrollProps,
  RootPage,
  ThemedText,
  Thumbnail,
  type ThumbnailProps,
  type ThumbnailSizeName,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing, ThumbnailSize } from "@/theme"

type Story = GalleryStory<ThumbnailProps>

// First-party dev-bucket artwork: the image stories need a remote URL, and
// the light and dark pair differ so the scheme switch is visible.
const ASSETS =
  "https://timecalendar-dev-public.fra1.digitaloceanspaces.com/export-guides/2026-09-07.1/en"
const LOGO = `${ASSETS}/ade/groups.png`
const LIGHT_ART = `${ASSETS}/ade/export.png`
const DARK_ART = `${ASSETS}/hplanning/export.png`

const sizes = Object.keys(ThumbnailSize) as ThumbnailSizeName[]

function Page({ children }: { children: ReactNode }) {
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          {children}
        </ScrollView>
      )}
    </RootPage>
  )
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.line}>
      {children}
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  )
}

function ImageFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <Line label={t("gallery.thumbnail.image")}>
        <Thumbnail
          source={{ light: LOGO }}
          size="medium"
          monogram="T"
          testID="gallery-thumbnail-image"
        />
      </Line>
    </Page>
  )
}

function DarkImageFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <Line label={t("gallery.thumbnail.darkImage")}>
        <Thumbnail
          source={{ light: LIGHT_ART, dark: DARK_ART }}
          size="large"
          testID="gallery-thumbnail-dark-image"
        />
      </Line>
    </Page>
  )
}

function MonogramFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <Line label={t("gallery.thumbnail.monogram")}>
        <Thumbnail
          source={{ light: undefined }}
          size="medium"
          monogram="É"
          testID="gallery-thumbnail-monogram"
        />
      </Line>
    </Page>
  )
}

function SizesFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {sizes.map((size) => (
        <Line
          key={size}
          label={t(`gallery.thumbnail.size.${size}`, {
            size: ThumbnailSize[size],
          })}
        >
          <Thumbnail
            source={{ light: LOGO }}
            size={size}
            testID={`gallery-thumbnail-size-${size}`}
          />
        </Line>
      ))}
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: Spacing.four, gap: Spacing.three },
  line: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  label: { flexShrink: 1 },
})

const meta: GalleryMeta<ThumbnailProps> = {
  id: "thumbnail",
  title: "gallery.thumbnail.title",
  component: Thumbnail,
  stories: ["Image", "DarkImage", "Monogram", "Sizes"],
}

export default meta

export const Image: Story = {
  name: "gallery.thumbnail.story.image",
  render: () => <ImageFixture />,
}

export const DarkImage: Story = {
  name: "gallery.thumbnail.story.darkImage",
  render: () => <DarkImageFixture />,
}

export const Monogram: Story = {
  name: "gallery.thumbnail.story.monogram",
  render: () => <MonogramFixture />,
}

export const Sizes: Story = {
  name: "gallery.thumbnail.story.sizes",
  render: () => <SizesFixture />,
}
