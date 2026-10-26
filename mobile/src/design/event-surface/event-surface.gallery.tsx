import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  Badge,
  EventSurface,
  type EventSurfaceDensity,
  type EventSurfaceProps,
  EventSurfaceText,
  headerScrollProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { useIncreasedContrast } from "@/hooks/use-increased-contrast"
import {
  EventFallbackColor,
  Spacing,
  useIsAccessibilityTextSize,
} from "@/theme"

type Story = GalleryStory<EventSurfaceProps>

const PALETTE = [
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
  "#03A9F4",
  "#009688",
  "#4CAF50",
  "#FF9800",
  "#795548",
  EventFallbackColor,
] as const

const CARD_WIDTH = 200
const TIMELINE_FRAME_HEIGHT = 140
const COMPLETE_GLYPH = {
  ios: "checkmark.square.fill",
  android: "check_box",
} as const
const PENDING_GLYPH = {
  ios: "square",
  android: "check_box_outline_blank",
} as const

const noop = () => undefined

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

function SampleTile({
  color,
  title,
  location,
  density = "regular",
  testID,
  extraLabel,
  children,
}: {
  color: string
  title: string
  location: string
  density?: EventSurfaceDensity
  testID: string
  extraLabel?: string
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const time = t("gallery.eventSurface.time")
  const label = t("gallery.eventSurface.label", { title, time, location })
  return (
    <EventSurface
      eventColor={color}
      accessibilityLabel={
        extraLabel === undefined ? label : `${label}, ${extraLabel}`
      }
      accessibilityHint={t("gallery.eventSurface.hint")}
      onPress={noop}
      density={density}
      testID={testID}
    >
      <EventSurfaceText type="label" numberOfLines={2}>
        {title}
      </EventSurfaceText>
      <EventSurfaceText type="callout" numberOfLines={2}>
        {time}
      </EventSurfaceText>
      <EventSurfaceText type="callout" numberOfLines={1}>
        {location}
      </EventSurfaceText>
      {children}
    </EventSurface>
  )
}

function PaletteTiles({ story }: { story: "palette" | "contrast" }) {
  const { t } = useTranslation()
  return PALETTE.map((color) => (
    <SampleTile
      key={color}
      color={color}
      title={t("gallery.eventSurface.paletteTitle", { color })}
      location={t("gallery.eventSurface.location")}
      testID={`gallery-event-surface-${story}-${color.slice(1)}`}
    />
  ))
}

function PaletteFixture() {
  return (
    <Page>
      <PaletteTiles story="palette" />
    </Page>
  )
}

function PlacementsFixture() {
  const { t } = useTranslation()
  const title = t("gallery.eventSurface.sample.lecture")
  const location = t("gallery.eventSurface.location")
  const time = t("gallery.eventSurface.time")
  return (
    <Page>
      <ThemedText type="sectionTitle">
        {t("gallery.eventSurface.placement.flowRegular")}
      </ThemedText>
      <SampleTile
        color={PALETTE[2]}
        title={title}
        location={location}
        testID="gallery-event-surface-flow-regular"
      />
      <ThemedText type="sectionTitle">
        {t("gallery.eventSurface.placement.flowCompact")}
      </ThemedText>
      <SampleTile
        color={PALETTE[2]}
        title={title}
        location={location}
        density="compact"
        testID="gallery-event-surface-flow-compact"
      />
      <ThemedText type="sectionTitle">
        {t("gallery.eventSurface.placement.absolute")}
      </ThemedText>
      <View style={styles.timelineFrame}>
        <EventSurface
          eventColor={PALETTE[4]}
          accessibilityLabel={t("gallery.eventSurface.label", {
            title,
            time,
            location,
          })}
          accessibilityHint={t("gallery.eventSurface.hint")}
          onPress={noop}
          placement="absolute"
          density="compact"
          testID="gallery-event-surface-absolute"
          style={styles.timelineTile}
        >
          <EventSurfaceText type="callout" numberOfLines={2}>
            {title}
          </EventSurfaceText>
          <EventSurfaceText type="callout" numberOfLines={1}>
            {location}
          </EventSurfaceText>
        </EventSurface>
      </View>
    </Page>
  )
}

function IncreasedContrastFixture() {
  const { t } = useTranslation()
  const increasedContrast = useIncreasedContrast()
  return (
    <Page>
      <ThemedText tone="secondary" testID="gallery-event-surface-contrast">
        {t(
          increasedContrast
            ? "gallery.eventSurface.contrast.on"
            : "gallery.eventSurface.contrast.off",
        )}
      </ThemedText>
      <PaletteTiles story="contrast" />
    </Page>
  )
}

function ChecklistFixture() {
  const { t } = useTranslation()
  const location = t("gallery.eventSurface.location")
  const partial = t("gallery.eventSurface.progress", {
    completed: 2,
    total: 5,
  })
  const complete = t("gallery.eventSurface.progress", {
    completed: 5,
    total: 5,
  })
  return (
    <Page>
      <SampleTile
        color={PALETTE[0]}
        title={t("gallery.eventSurface.sample.lab")}
        location={location}
        extraLabel={partial}
        testID="gallery-event-surface-checklist-partial"
      >
        <Badge
          label="2/5"
          tone="onEventSurface"
          icon={PENDING_GLYPH}
          accessibilityLabel={null}
          testID="gallery-event-surface-checklist-partial-pill"
        />
      </SampleTile>
      <SampleTile
        color={PALETTE[5]}
        title={t("gallery.eventSurface.sample.lab")}
        location={location}
        extraLabel={complete}
        testID="gallery-event-surface-checklist-complete"
      >
        <Badge
          label="5/5"
          tone="onEventSurface"
          icon={COMPLETE_GLYPH}
          accessibilityLabel={null}
          testID="gallery-event-surface-checklist-complete-pill"
        />
      </SampleTile>
      <SampleTile
        color={PALETTE[6]}
        title={t("gallery.eventSurface.sample.lab")}
        location={location}
        density="compact"
        extraLabel={partial}
        testID="gallery-event-surface-checklist-compact"
      >
        <Badge
          label="2/5"
          tone="onEventSurface"
          size="small"
          icon={PENDING_GLYPH}
          accessibilityLabel={null}
          testID="gallery-event-surface-checklist-compact-pill"
        />
      </SampleTile>
    </Page>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const accessibilitySize = useIsAccessibilityTextSize()
  return (
    <Page>
      <ThemedText tone="secondary" testID="gallery-event-surface-text-size">
        {t(
          accessibilitySize
            ? "gallery.eventSurface.textSize.accessibility"
            : "gallery.eventSurface.textSize.standard",
        )}
      </ThemedText>
      <View style={styles.card}>
        <SampleTile
          color={PALETTE[1]}
          title={t("gallery.eventSurface.sample.long")}
          location={t("gallery.eventSurface.longLocation")}
          testID="gallery-event-surface-long"
        />
      </View>
      <SampleTile
        color={PALETTE[3]}
        title={t("gallery.eventSurface.sample.long")}
        location={t("gallery.eventSurface.longLocation")}
        density="compact"
        testID="gallery-event-surface-long-compact"
      />
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: Spacing.four, gap: Spacing.three },
  card: { width: CARD_WIDTH },
  timelineFrame: { height: TIMELINE_FRAME_HEIGHT, position: "relative" },
  timelineTile: { top: Spacing.three, left: 0, width: "60%", height: 96 },
})

const meta: GalleryMeta<EventSurfaceProps> = {
  id: "event-surface",
  title: "gallery.eventSurface.title",
  component: EventSurface,
  stories: [
    "Palette",
    "Placements",
    "IncreasedContrast",
    "Checklist",
    "LongStrings",
  ],
}

export default meta

export const Palette: Story = {
  name: "gallery.eventSurface.story.palette",
  render: () => <PaletteFixture />,
}

export const Placements: Story = {
  name: "gallery.eventSurface.story.placements",
  render: () => <PlacementsFixture />,
}

export const IncreasedContrast: Story = {
  name: "gallery.eventSurface.story.increasedContrast",
  render: () => <IncreasedContrastFixture />,
}

export const Checklist: Story = {
  name: "gallery.eventSurface.story.checklist",
  render: () => <ChecklistFixture />,
}

export const LongStrings: Story = {
  name: "gallery.eventSurface.story.longStrings",
  render: () => <LongStringsFixture />,
}
