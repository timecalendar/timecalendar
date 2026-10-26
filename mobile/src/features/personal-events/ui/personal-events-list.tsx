import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import {
  Button,
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
import { ColorDotSize, Spacing } from "@/theme"

// The Home-tab personal-events list (B2 / TIM-133) — PRESENTATIONAL (70% floor):
// it reads B1's reactive usePersonalEvents() (useLiveQuery, so it re-renders on
// any create/edit/delete) and renders rows + an empty state + an Add control. It
// owns no data logic. Each row navigates to the form prefilled for edit
// (/personal-event-form?uid=…); Add opens the blank create form. The route stays
// thin over this module (route-structure rule).
export function PersonalEventsList() {
  const { t } = useTranslation()
  const events = usePersonalEvents()
  const hasEvents = events.length > 0
  const uses24HourClock = useUses24HourClock()

  return (
    <>
      <Stack.Screen options={{ title: t("personalEvents.list.title") }} />
      <RootPage
        scrollsUnderHeader={hasEvents}
        testID="personal-events-responsive-owner"
        lane="standard"
      >
        {(layout) => (
          <FlatList
            {...headerScrollProps(hasEvents)}
            testID="personal-events-list"
            data={events}
            keyExtractor={(event) => event.uid}
            contentContainerStyle={[layout.laneStyle, styles.list]}
            ListHeaderComponent={
              <View style={styles.header}>
                <Button
                  variant="tonal"
                  size="small"
                  testID="personal-events-add"
                  label={t("personalEvents.list.add")}
                  onPress={() => router.push("/personal-event-form")}
                />
              </View>
            }
            ListEmptyComponent={
              <StatusView
                kind="empty"
                presentation="section"
                title={t("personalEvents.list.empty")}
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
  header: {
    marginBottom: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  list: {
    flexGrow: 1,
    paddingVertical: Spacing.four,
  },
})
