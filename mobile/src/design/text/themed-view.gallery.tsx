import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import {
  RootPage,
  ThemedText,
  ThemedView,
  type ThemedViewProps,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Radii, Spacing, type ThemeColor } from "@/theme"

type Story = GalleryStory<ThemedViewProps>

const surfaces: readonly ThemeColor[] = [
  "background",
  "backgroundElement",
  "backgroundSelected",
]

function SurfacesFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      {surfaces.map((surface) => (
        <ThemedView
          key={surface}
          type={surface}
          style={styles.surface}
          testID={`gallery-themed-view-${surface}`}
        >
          <ThemedText>
            {t("gallery.themedView.caption", { surface })}
          </ThemedText>
        </ThemedView>
      ))}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: Radii.medium,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
})

const meta: GalleryMeta<ThemedViewProps> = {
  id: "themed-view",
  title: "gallery.themedView.title",
  component: ThemedView,
  stories: ["Surfaces"],
}

export default meta

export const Surfaces: Story = {
  name: "gallery.themedView.story.surfaces",
  render: () => <SurfacesFixture />,
}
