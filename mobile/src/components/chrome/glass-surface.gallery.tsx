import { type ComponentProps, type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { GlassSurface } from "@/components/chrome"
import { Icon, RootPage, ThemedText } from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { IconSize, MinTouchTarget, Radii, Spacing, useTheme } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof GlassSurface>>

function Backdrop({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return (
    <RootPage>
      <View
        testID="gallery-glass-backdrop"
        style={[styles.backdrop, { backgroundColor: theme.homeHero }]}
      >
        <View style={[styles.stripe, { backgroundColor: theme.primarySoft }]} />
        {children}
      </View>
    </RootPage>
  )
}

function SurfaceFixture({
  style,
  long = false,
}: {
  style: "regular" | "clear"
  long?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Backdrop>
      <GlassSurface
        testID="gallery-glass-surface"
        glassEffectStyle={style}
        style={styles.surface}
      >
        <ThemedText type="headline">
          {t(
            long ? "gallery.stress.title" : "gallery.glassSurface.surfaceTitle",
          )}
        </ThemedText>
        <ThemedText>
          {t(long ? "gallery.stress.body" : "gallery.glassSurface.surfaceBody")}
        </ThemedText>
        {long ? <ThemedText>{t("gallery.stress.word")}</ThemedText> : null}
      </GlassSurface>
    </Backdrop>
  )
}

function InteractiveButtonFixture() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [count, setCount] = useState(0)
  return (
    <Backdrop>
      <GlassSurface isInteractive style={styles.button}>
        <Pressable
          testID="gallery-glass-button"
          accessibilityRole="button"
          accessibilityLabel={t("gallery.glassSurface.buttonLabel")}
          onPress={() => setCount((value) => value + 1)}
          style={styles.buttonTarget}
        >
          <Icon
            ios="plus"
            android="add"
            size={IconSize.large}
            color={theme.text}
            scaling="fixed"
          />
        </Pressable>
      </GlassSurface>
      <ThemedText testID="gallery-glass-count">
        {t("gallery.pressCount", { count })}
      </ThemedText>
    </Backdrop>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    borderRadius: Radii.large,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "40%",
    width: "30%",
  },
  surface: {
    borderRadius: Radii.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  button: { alignSelf: "flex-start", borderRadius: Radii.pill },
  buttonTarget: {
    minWidth: MinTouchTarget,
    minHeight: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
})

const meta: GalleryMeta<ComponentProps<typeof GlassSurface>> = {
  id: "glass-surface",
  title: "gallery.glassSurface.title",
  component: GlassSurface,
  stories: ["Regular", "Clear", "InteractiveButton", "LongStrings"],
}

export default meta

export const Regular: Story = {
  name: "gallery.glassSurface.story.regular",
  render: () => <SurfaceFixture style="regular" />,
}

export const Clear: Story = {
  name: "gallery.glassSurface.story.clear",
  render: () => <SurfaceFixture style="clear" />,
}

export const InteractiveButton: Story = {
  name: "gallery.glassSurface.story.interactiveButton",
  render: () => <InteractiveButtonFixture />,
}

export const LongStrings: Story = {
  name: "gallery.glassSurface.story.longStrings",
  render: () => <SurfaceFixture style="regular" long />,
}
