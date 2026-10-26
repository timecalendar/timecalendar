import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  Badge,
  type BadgeProps,
  type BadgeSize,
  type BadgeTone,
  headerScrollProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing, useIsAccessibilityTextSize } from "@/theme"

type Story = GalleryStory<BadgeProps>

const tones: readonly BadgeTone[] = [
  "brand",
  "neutral",
  "positive",
  "informational",
  "destructive",
]

const sizes: readonly BadgeSize[] = ["small", "medium"]

const NARROW_COLUMN = 160

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

function TonesFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {tones.map((tone) => {
        const label = t(`gallery.badge.tone.${tone}`)
        return (
          <Badge
            key={tone}
            label={label}
            tone={tone}
            accessibilityLabel={label}
            testID={`gallery-badge-tone-${tone}`}
          />
        )
      })}
    </Page>
  )
}

function SizesFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {tones.map((tone) => (
        <View key={tone} style={styles.line}>
          {sizes.map((size) => {
            const label = t(`gallery.badge.size.${size}`)
            return (
              <Badge
                key={size}
                label={label}
                tone={tone}
                size={size}
                accessibilityLabel={label}
                testID={`gallery-badge-${tone}-${size}`}
              />
            )
          })}
        </View>
      ))}
    </Page>
  )
}

function WithIconFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <Badge
        label="5/5"
        tone="positive"
        icon={{ ios: "checkmark.square.fill", android: "check_box" }}
        accessibilityLabel={t("gallery.badge.countName", {
          completed: 5,
          total: 5,
        })}
        testID="gallery-badge-icon-complete"
      />
      <Badge
        label="2/5"
        tone="informational"
        icon={{ ios: "square", android: "check_box_outline_blank" }}
        accessibilityLabel={t("gallery.badge.countName", {
          completed: 2,
          total: 5,
        })}
        testID="gallery-badge-icon-pending"
      />
    </Page>
  )
}

function AccessibilityFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      <Badge
        label="2/5"
        tone="informational"
        accessibilityLabel={t("gallery.badge.countName", {
          completed: 2,
          total: 5,
        })}
        testID="gallery-badge-named"
      />
      <View
        accessible
        accessibilityLabel={t("gallery.badge.owner")}
        testID="gallery-badge-owner"
        style={styles.owner}
      >
        <ThemedText>{t("gallery.badge.ownerTitle")}</ThemedText>
        <Badge
          label="2/5"
          tone="informational"
          accessibilityLabel={null}
          testID="gallery-badge-hidden"
        />
      </View>
    </Page>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const accessibilitySize = useIsAccessibilityTextSize()
  const label = t("gallery.badge.longLabel")
  return (
    <Page>
      <ThemedText tone="secondary" testID="gallery-badge-text-size">
        {t(
          accessibilitySize
            ? "gallery.badge.textSize.accessibility"
            : "gallery.badge.textSize.standard",
        )}
      </ThemedText>
      <View style={styles.narrow}>
        <Badge
          label={label}
          tone="brand"
          size="small"
          accessibilityLabel={label}
          testID="gallery-badge-long-small"
        />
        <Badge
          label={label}
          tone="positive"
          icon={{ ios: "checkmark.square.fill", android: "check_box" }}
          accessibilityLabel={label}
          testID="gallery-badge-long-medium"
        />
      </View>
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: Spacing.four, gap: Spacing.three },
  line: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  owner: { gap: Spacing.one },
  narrow: { width: NARROW_COLUMN, gap: Spacing.three },
})

const meta: GalleryMeta<BadgeProps> = {
  id: "badge",
  title: "gallery.badge.title",
  component: Badge,
  stories: ["Tones", "Sizes", "WithIcon", "Accessibility", "LongStrings"],
}

export default meta

export const Tones: Story = {
  name: "gallery.badge.story.tones",
  render: () => <TonesFixture />,
}

export const Sizes: Story = {
  name: "gallery.badge.story.sizes",
  render: () => <SizesFixture />,
}

export const WithIcon: Story = {
  name: "gallery.badge.story.withIcon",
  render: () => <WithIconFixture />,
}

export const Accessibility: Story = {
  name: "gallery.badge.story.accessibility",
  render: () => <AccessibilityFixture />,
}

export const LongStrings: Story = {
  name: "gallery.badge.story.longStrings",
  render: () => <LongStringsFixture />,
}
