import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  Button,
  headerScrollProps,
  ListRow,
  listRowPosition,
  type ListRowProps,
  ListRowSeparator,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Radii, Spacing, useIsAccessibilityTextSize, useTheme } from "@/theme"

type Story = GalleryStory<ListRowProps>

const SWATCH = 24

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
          <View>{children(onPress)}</View>
          <ThemedText tone="secondary" testID="gallery-list-row-count">
            {t("gallery.pressCount", { count })}
          </ThemedText>
        </ScrollView>
      )}
    </RootPage>
  )
}

function Swatch() {
  const theme = useTheme()
  return <View style={[styles.swatch, { backgroundColor: theme.primary }]} />
}

function PlainFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <>
          <ListRow
            label={t("gallery.listRow.label")}
            subtitle={t("gallery.listRow.subtitle")}
            hint={t("gallery.listRow.hint")}
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-row-plain-navigation"
          />
          <ListRowSeparator />
          <ListRow
            label={t("gallery.listRow.element")}
            leading={{ element: <Swatch />, width: SWATCH }}
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-row-plain-element"
          />
          <ListRowSeparator leadingWidth={SWATCH} />
          <ListRow
            label={t("gallery.listRow.disabled")}
            value={t("gallery.listRow.disabledValue")}
            disabled
            onPress={onPress}
            testID="gallery-list-row-plain-disabled"
          />
        </>
      )}
    </Page>
  )
}

function GroupedFixture() {
  const { t } = useTranslation()
  const rows = [
    { key: "first", label: t("gallery.listRow.label") },
    {
      key: "second",
      label: t("gallery.listRow.second"),
      value: t("gallery.listRow.secondValue"),
    },
    { key: "third", label: t("gallery.listRow.third") },
  ]
  return (
    <Page>
      {(onPress) =>
        rows.map((row, index) => (
          <ListRow
            key={row.key}
            label={row.label}
            value={row.value}
            position={listRowPosition(index, rows.length)}
            trailing="chevron"
            onPress={onPress}
            testID={`gallery-list-row-grouped-${row.key}`}
          />
        ))
      }
    </Page>
  )
}

function DisclosureRow({
  label,
  initiallyExpanded,
  testID,
}: {
  label: string
  initiallyExpanded: boolean
  testID: string
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  return (
    <ListRow
      label={label}
      expanded={expanded}
      onPress={() => setExpanded((value) => !value)}
      testID={testID}
    />
  )
}

function StatesFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <>
          <ListRow
            label={t("gallery.listRow.selected")}
            value={t("gallery.listRow.selectedValue")}
            selected
            onPress={onPress}
            testID="gallery-list-row-selected"
          />
          <ListRow
            label={t("gallery.listRow.disabled")}
            value={t("gallery.listRow.disabledValue")}
            disabled
            onPress={onPress}
            testID="gallery-list-row-disabled"
          />
          <ListRow
            label={t("gallery.listRow.destructive")}
            destructive
            onPress={onPress}
            testID="gallery-list-row-destructive"
          />
          <DisclosureRow
            label={t("gallery.listRow.collapsed")}
            initiallyExpanded={false}
            testID="gallery-list-row-collapsed"
          />
          <DisclosureRow
            label={t("gallery.listRow.expanded")}
            initiallyExpanded
            testID="gallery-list-row-expanded"
          />
        </>
      )}
    </Page>
  )
}

function LeadingFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <>
          <ListRow
            label={t("gallery.listRow.icon")}
            leading={{ icon: { ios: "graduationcap", android: "school" } }}
            position="first"
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-row-leading-icon"
          />
          <ListRow
            label={t("gallery.listRow.element")}
            subtitle={t("gallery.listRow.subtitle")}
            leading={{ element: <Swatch />, width: SWATCH }}
            position="last"
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-row-leading-element"
          />
        </>
      )}
    </Page>
  )
}

function StaticFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <ListRow
          label={t("gallery.listRow.static")}
          subtitle={t("gallery.listRow.staticDetail")}
          position="single"
          testID="gallery-list-row-static"
          trailing={
            <Button
              variant="text"
              size="small"
              label={t("gallery.listRow.accessory")}
              accessibilityLabel={t("gallery.listRow.accessoryA11y")}
              onPress={onPress}
              testID="gallery-list-row-static-accessory"
            />
          }
        />
      )}
    </Page>
  )
}

function OverlineFixture() {
  const { t } = useTranslation()
  const tones = ["positive", "informational", "destructive"] as const
  return (
    <Page>
      {(onPress) =>
        tones.map((tone, index) => {
          const row = {
            label: t("gallery.listRow.overline.title"),
            subtitle: t("gallery.listRow.overline.time"),
            details: [t("gallery.listRow.overline.change")],
            overline: { text: t(`gallery.listRow.overline.${tone}`), tone },
            position: listRowPosition(index, tones.length),
            testID: `gallery-list-row-overline-${tone}`,
          }
          return tone === "destructive" ? (
            <ListRow key={tone} {...row} />
          ) : (
            <ListRow key={tone} {...row} onPress={onPress} />
          )
        })
      }
    </Page>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const accessibilitySize = useIsAccessibilityTextSize()
  return (
    <Page>
      {(onPress) => (
        <>
          <ThemedText tone="secondary" testID="gallery-list-row-text-size">
            {t(
              accessibilitySize
                ? "gallery.listRow.textSize.accessibility"
                : "gallery.listRow.textSize.standard",
            )}
          </ThemedText>
          <ListRow
            label={t("gallery.stress.title")}
            subtitle={t("gallery.stress.body")}
            details={[t("gallery.stress.action")]}
            overline={{
              text: t("gallery.stress.action"),
              tone: "informational",
            }}
            value={t("gallery.stress.action")}
            leading={{ icon: { ios: "graduationcap", android: "school" } }}
            hint={t("gallery.listRow.hint")}
            position="first"
            trailing="chevron"
            onPress={onPress}
            testID="gallery-list-row-long"
          />
          <ListRow
            label={t("gallery.stress.word")}
            value={t("gallery.stress.word")}
            selected
            position="middle"
            onPress={onPress}
            testID="gallery-list-row-long-word"
          />
          <ListRow
            label={t("gallery.stress.title")}
            subtitle={t("gallery.stress.body")}
            position="last"
            testID="gallery-list-row-long-static"
            trailing={
              <Button
                variant="text"
                size="small"
                label={t("gallery.stress.action")}
                onPress={onPress}
                testID="gallery-list-row-long-accessory"
              />
            }
          />
        </>
      )}
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four, gap: Spacing.four },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: Radii.small },
})

const meta: GalleryMeta<ListRowProps> = {
  id: "list-row",
  title: "gallery.listRow.title",
  component: ListRow,
  stories: [
    "Plain",
    "Grouped",
    "States",
    "Leading",
    "Static",
    "Overline",
    "LongStrings",
  ],
}

export default meta

export const Plain: Story = {
  name: "gallery.listRow.story.plain",
  render: () => <PlainFixture />,
}

export const Grouped: Story = {
  name: "gallery.listRow.story.grouped",
  render: () => <GroupedFixture />,
}

export const States: Story = {
  name: "gallery.listRow.story.states",
  render: () => <StatesFixture />,
}

export const Leading: Story = {
  name: "gallery.listRow.story.leading",
  render: () => <LeadingFixture />,
}

export const Static: Story = {
  name: "gallery.listRow.story.static",
  render: () => <StaticFixture />,
}

export const Overline: Story = {
  name: "gallery.listRow.story.overline",
  render: () => <OverlineFixture />,
}

export const LongStrings: Story = {
  name: "gallery.listRow.story.longStrings",
  render: () => <LongStringsFixture />,
}
