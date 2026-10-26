import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  NativeList,
  NativeListRow,
  NativeListSection,
} from "@/components/chrome"
import {
  headerScrollProps,
  ListRow,
  ListSection,
  type ListSectionProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing } from "@/theme"

type Story = GalleryStory<ListSectionProps>

function Page({ children }: { children: (onPress: () => void) => ReactNode }) {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  const onPress = () => setCount((value) => value + 1)
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          {children(onPress)}
          <ThemedText tone="secondary" testID="gallery-list-section-count">
            {t("gallery.pressCount", { count })}
          </ThemedText>
        </ScrollView>
      )}
    </RootPage>
  )
}

function TitledRows({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <ListSection
      title={t("gallery.listSection.header")}
      footer={t("gallery.listSection.footer")}
      testID="gallery-list-section-titled"
    >
      <ListRow
        label={t("gallery.listRow.label")}
        subtitle={t("gallery.listRow.subtitle")}
        hint={t("gallery.listRow.hint")}
        trailing="chevron"
        onPress={onPress}
        testID="gallery-list-section-first"
      />
      <ListRow
        label={t("gallery.listRow.second")}
        value={t("gallery.listRow.secondValue")}
        hint={t("gallery.listRow.hint")}
        trailing="chevron"
        onPress={onPress}
        testID="gallery-list-section-second"
      />
      <ListRow
        label={t("gallery.listRow.destructive")}
        destructive
        onPress={onPress}
        testID="gallery-list-section-third"
      />
    </ListSection>
  )
}

function TitledFixture() {
  return <Page>{(onPress) => <TitledRows onPress={onPress} />}</Page>
}

function SingleFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <ListSection testID="gallery-list-section-single">
          <ListRow
            label={t("gallery.listRow.label")}
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-section-single-row"
          />
        </ListSection>
      )}
    </Page>
  )
}

function SeamComparisonFixture() {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  const onPress = () => setCount((value) => value + 1)
  return (
    <RootPage>
      {({ laneStyle }) => (
        <View style={styles.fill}>
          <View style={[laneStyle, styles.comparison]}>
            <TitledRows onPress={onPress} />
            <ThemedText tone="secondary" testID="gallery-list-section-count">
              {t("gallery.pressCount", { count })}
            </ThemedText>
            <ThemedText tone="secondary">
              {t("gallery.listSection.native")}
            </ThemedText>
          </View>
          <View style={styles.fill}>
            <NativeList>
              <NativeListSection
                title={t("gallery.listSection.header")}
                footer={t("gallery.listSection.footer")}
              >
                <NativeListRow
                  kind="action"
                  label={t("gallery.listRow.label")}
                  subtitle={t("gallery.listRow.subtitle")}
                  hint={t("gallery.listRow.hint")}
                  onPress={onPress}
                  testID="gallery-list-section-native-first"
                />
                <NativeListRow
                  kind="action"
                  label={t("gallery.listRow.second")}
                  value={t("gallery.listRow.secondValue")}
                  hint={t("gallery.listRow.hint")}
                  onPress={onPress}
                  testID="gallery-list-section-native-second"
                />
                <NativeListRow
                  kind="action"
                  label={t("gallery.listRow.destructive")}
                  destructive
                  onPress={onPress}
                  testID="gallery-list-section-native-third"
                />
              </NativeListSection>
            </NativeList>
          </View>
        </View>
      )}
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <ListSection
          title={t("gallery.stress.title")}
          footer={t("gallery.stress.body")}
          testID="gallery-list-section-long"
        >
          <ListRow
            label={t("gallery.stress.title")}
            subtitle={t("gallery.stress.body")}
            value={t("gallery.stress.action")}
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-section-long-row"
          />
          <ListRow
            label={t("gallery.stress.word")}
            onPress={onPress}
            testID="gallery-list-section-long-word"
          />
        </ListSection>
      )}
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four },
  fill: { flex: 1 },
  comparison: { paddingTop: Spacing.four, gap: Spacing.two },
})

const meta: GalleryMeta<ListSectionProps> = {
  id: "list-section",
  title: "gallery.listSection.title",
  component: ListSection,
  stories: ["Titled", "Single", "SeamComparison", "LongStrings"],
}

export default meta

export const Titled: Story = {
  name: "gallery.listSection.story.titled",
  render: () => <TitledFixture />,
}

export const Single: Story = {
  name: "gallery.listSection.story.single",
  render: () => <SingleFixture />,
}

export const SeamComparison: Story = {
  name: "gallery.listSection.story.seamComparison",
  render: () => <SeamComparisonFixture />,
}

export const LongStrings: Story = {
  name: "gallery.listSection.story.longStrings",
  render: () => <LongStringsFixture />,
}
