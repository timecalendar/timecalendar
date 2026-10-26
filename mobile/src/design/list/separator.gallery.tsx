import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import {
  headerScrollProps,
  ListRow,
  RootPage,
  Separator,
  type SeparatorProps,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing } from "@/theme"

type Story = GalleryStory<SeparatorProps>

function InsetsFixture() {
  const { t } = useTranslation()
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          <ListRow
            label={t("gallery.separator.none")}
            testID="gallery-separator-row-none"
          />
          <Separator testID="gallery-separator-none" />
          <ListRow
            label={t("gallery.separator.leading")}
            testID="gallery-separator-row-leading"
          />
          <Separator inset="leading" testID="gallery-separator-leading" />
          <ListRow
            label={t("gallery.separator.element")}
            testID="gallery-separator-row-element"
          />
          <Separator
            inset={{ leadingWidth: 40 }}
            testID="gallery-separator-element"
          />
          <ListRow
            label={t("gallery.separator.none")}
            testID="gallery-separator-row-last"
          />
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four },
})

const meta: GalleryMeta<SeparatorProps> = {
  id: "separator",
  title: "gallery.separator.title",
  component: Separator,
  stories: ["Insets"],
}

export default meta

export const Insets: Story = {
  name: "gallery.separator.story.insets",
  render: () => <InsetsFixture />,
}
