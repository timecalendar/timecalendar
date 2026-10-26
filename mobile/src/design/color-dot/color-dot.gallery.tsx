import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  ColorDot,
  type ColorDotProps,
  type ColorDotRing,
  headerScrollProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { ColorDotSize, Radii, Spacing, useTheme } from "@/theme"

type Story = GalleryStory<ColorDotProps>

const PRESETS = [
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#03A9F4",
  "#009688",
  "#4CAF50",
  "#FF9800",
  "#795548",
] as const

const rings: readonly ColorDotRing[] = [
  "background",
  "backgroundElement",
  "homeHero",
]

const STACK_LIMIT = 5

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

function SizesFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(Object.keys(ColorDotSize) as (keyof typeof ColorDotSize)[]).map(
        (size) => (
          <View key={size} style={styles.line}>
            <ColorDot
              color={PRESETS[0]}
              size={size}
              testID={`gallery-color-dot-size-${size}`}
            />
            <ThemedText style={styles.label}>
              {t(`gallery.colorDot.size.${size}`, {
                size: ColorDotSize[size],
              })}
            </ThemedText>
          </View>
        ),
      )}
    </Page>
  )
}

function PresetsFixture() {
  return (
    <Page>
      {PRESETS.map((color) => (
        <View key={color} style={styles.line}>
          <ColorDot
            color={color}
            size="large"
            testID={`gallery-color-dot-preset-${color}`}
          />
          <ThemedText style={styles.label}>{color}</ThemedText>
        </View>
      ))}
    </Page>
  )
}

function RingsFixture() {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Page>
      {rings.map((ring) => (
        <View
          key={ring}
          style={[styles.surface, { backgroundColor: theme[ring] }]}
        >
          <View style={styles.stack}>
            {PRESETS.slice(0, 3).map((color, index) => (
              <ColorDot
                key={color}
                color={color}
                ring={ring}
                testID={`gallery-color-dot-ring-${ring}-${index}`}
                style={index === 0 ? undefined : styles.overlap}
              />
            ))}
          </View>
          <ThemedText style={styles.label}>
            {t(`gallery.colorDot.ring.${ring}`)}
          </ThemedText>
        </View>
      ))}
    </Page>
  )
}

function StackFixture() {
  const { t } = useTranslation()
  const theme = useTheme()
  const colors = PRESETS.slice(0, 7)
  return (
    <Page>
      <View
        accessible
        accessibilityLabel={t("gallery.colorDot.stackLabel", {
          total: colors.length,
        })}
        testID="gallery-color-dot-stack"
        style={[styles.surface, { backgroundColor: theme.homeHero }]}
      >
        <View style={styles.stack}>
          {colors.slice(0, STACK_LIMIT).map((color, index) => (
            <ColorDot
              key={color}
              color={color}
              ring="homeHero"
              testID={`gallery-color-dot-stack-${index}`}
              style={index === 0 ? undefined : styles.overlap}
            />
          ))}
        </View>
        <ThemedText type="caption" testID="gallery-color-dot-overflow">
          {t("gallery.colorDot.overflow", {
            extra: colors.length - STACK_LIMIT,
          })}
        </ThemedText>
      </View>
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: Spacing.four, gap: Spacing.three },
  line: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  label: { flexShrink: 1 },
  surface: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.large,
  },
  stack: { flexDirection: "row", alignItems: "center" },
  overlap: { marginLeft: -Spacing.one },
})

const meta: GalleryMeta<ColorDotProps> = {
  id: "color-dot",
  title: "gallery.colorDot.title",
  component: ColorDot,
  stories: ["Sizes", "Presets", "Rings", "Stack"],
}

export default meta

export const Sizes: Story = {
  name: "gallery.colorDot.story.sizes",
  render: () => <SizesFixture />,
}

export const Presets: Story = {
  name: "gallery.colorDot.story.presets",
  render: () => <PresetsFixture />,
}

export const Rings: Story = {
  name: "gallery.colorDot.story.rings",
  render: () => <RingsFixture />,
}

export const Stack: Story = {
  name: "gallery.colorDot.story.stack",
  render: () => <StackFixture />,
}
