import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList, Platform, StyleSheet } from "react-native"

import { FloatingAction, useHeaderActions } from "@/components/chrome"
import {
  ColorDot,
  headerScrollProps,
  ListRow,
  type ListRowPosition,
  listRowPosition,
  RootPage,
  StatusView,
} from "@/design"
import { formatShortDateTime, resolveLocale } from "@/features/calendar/data"
import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { useUses24HourClock } from "@/hooks/use-uses-24-hour-clock"
import { ColorDotSize, Layout, Spacing } from "@/theme"

const addIcon = { ios: "plus", android: "add" } as const

export function PersonalEventsList() {
  const { t } = useTranslation()
  const events = usePersonalEvents()
  const hasEvents = events.length > 0
  const uses24HourClock = useUses24HourClock()
  const openCreate = () => router.push("/personal-event-form")
  const headerActions = useHeaderActions({
    right: [
      {
        icon: addIcon,
        accessibilityLabel: t("personalEvents.list.add"),
        testID: "personal-events-add",
        platform: "ios",
        onPress: openCreate,
      },
    ],
  })

  return (
    <>
      <Stack.Screen
        options={{ title: t("personalEvents.list.title"), ...headerActions }}
      />
      <RootPage
        scrollsUnderHeader={hasEvents}
        testID="personal-events-responsive-owner"
        lane="standard"
      >
        {(layout) => (
          <>
            <FlatList
              {...headerScrollProps(hasEvents)}
              testID="personal-events-list"
              data={events}
              keyExtractor={(event) => event.uid}
              contentContainerStyle={[
                layout.laneStyle,
                styles.list,
                Platform.OS === "android" && styles.fabClearance,
              ]}
              ListEmptyComponent={
                <StatusView
                  kind="empty"
                  presentation="section"
                  title={t("personalEvents.list.empty")}
                  caption={t("personalEvents.list.emptyCaption")}
                  testID="personal-events-empty"
                />
              }
              renderItem={({ item, index }) => (
                <EventRow
                  event={item}
                  position={listRowPosition(index, events.length)}
                  uses24HourClock={uses24HourClock}
                />
              )}
            />
            <FloatingAction
              icon={addIcon}
              label={t("personalEvents.list.add")}
              testID="personal-events-add"
              onPress={openCreate}
            />
          </>
        )}
      </RootPage>
    </>
  )
}

function EventRow({
  event,
  position,
  uses24HourClock,
}: {
  event: PersonalEvent
  position: ListRowPosition
  uses24HourClock: boolean | null
}) {
  const { t, i18n } = useTranslation()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const range = `${formatShortDateTime(event.startsAt, locale, displayZone, uses24HourClock)} – ${formatShortDateTime(event.endsAt, locale, displayZone, uses24HourClock)}`

  return (
    <ListRow
      testID={`personal-event-row-${event.uid}`}
      label={event.title}
      subtitle={range}
      details={event.location !== undefined ? [event.location] : undefined}
      leading={{
        element: (
          <ColorDot
            color={event.color}
            size="large"
            testID={`personal-event-row-${event.uid}-color`}
          />
        ),
        width: ColorDotSize.large,
      }}
      position={position}
      trailing="chevron"
      href={`/personal-event-form?uid=${event.uid}`}
      // The label is exactly the title: the shared Maestro flow matches the
      // row by its title cross-platform, and the edit affordance is the hint.
      accessibilityLabel={event.title}
      hint={t("personalEvents.list.rowHint")}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingVertical: Spacing.four,
  },
  fabClearance: { paddingBottom: Layout.fabClearance },
})
