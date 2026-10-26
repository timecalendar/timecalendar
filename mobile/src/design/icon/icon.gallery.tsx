import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  headerScrollProps,
  Icon,
  type IconProps,
  type MaterialGlyph,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { IconSize, Spacing, useTheme } from "@/theme"

import { MATERIAL_GLYPHS } from "./icon-glyphs"

type Story = GalleryStory<IconProps>

const sizes = Object.values(IconSize)
const glyphs = Object.keys(MATERIAL_GLYPHS) as MaterialGlyph[]

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

function ScalingFixture() {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Page>
      {sizes.map((size) => (
        <View key={size} style={styles.group}>
          <View style={styles.line}>
            <Icon
              ios="calendar"
              android="today"
              size={size}
              color={theme.text}
              scaling="text"
              testID={`gallery-icon-text-${size}`}
            />
            <ThemedText style={styles.label}>
              {t("gallery.icon.text", { size })}
            </ThemedText>
          </View>
          <View style={styles.line}>
            <Icon
              ios="calendar"
              android="today"
              size={size}
              color={theme.text}
              scaling="fixed"
              testID={`gallery-icon-fixed-${size}`}
            />
            <ThemedText style={styles.label}>
              {t("gallery.icon.fixed", { size })}
            </ThemedText>
          </View>
        </View>
      ))}
    </Page>
  )
}

function GlyphsFixture() {
  const theme = useTheme()
  return (
    <Page>
      {glyphs.map((glyph) => (
        <View key={glyph} style={styles.line}>
          <Icon
            android={glyph}
            size={IconSize.large}
            color={theme.text}
            scaling="text"
            testID={`gallery-icon-glyph-${glyph}`}
          />
          <ThemedText style={styles.label}>{glyph}</ThemedText>
        </View>
      ))}
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: Spacing.four, gap: Spacing.three },
  group: { gap: Spacing.two },
  line: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  label: { flexShrink: 1 },
})

const meta: GalleryMeta<IconProps> = {
  id: "icon",
  title: "gallery.icon.title",
  component: Icon,
  stories: ["Scaling", "Glyphs"],
}

export default meta

export const Scaling: Story = {
  name: "gallery.icon.story.scaling",
  render: () => <ScalingFixture />,
}

export const Glyphs: Story = {
  name: "gallery.icon.story.glyphs",
  platforms: ["android"],
  render: () => <GlyphsFixture />,
}
