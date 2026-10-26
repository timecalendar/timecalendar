import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import {
  Button,
  ErrorNotice,
  headerScrollProps,
  ListRow,
  ListSection,
  noDataArtwork,
  RootPage,
  StatusView,
} from "@/design"
import {
  displayEventTitle,
  formatTimeRange,
  resolveLocale,
  useSyncedEvents,
} from "@/features/calendar/data"
import { useHiddenEvents, useHideActions } from "@/features/hidden-events/data"
import { useDisplayZone } from "@/features/settings/prefs"
import { Spacing } from "@/theme"

// Hide-by-name has no per-event surface, so un-hide must be reachable here.
// Hidden uids that no longer resolve to a synced event are not listed (Flutter
// parity); the stored set still keeps them for the importer round-trip.

interface UidEntry {
  uid: string
  title: string
  time: string
}

export function HiddenEventsScreen() {
  const { t, i18n } = useTranslation()
  const locale = resolveLocale(i18n.language)
  const displayZone = useDisplayZone()
  const { uidHiddenEvents, namedHiddenEvents } = useHiddenEvents()
  const { unhideUid, unhideName, failed } = useHideActions()
  const syncedEvents = useSyncedEvents()

  // Resolve each hidden uid to its current synced event (title + time). Only
  // still-resolving uids are listed (Flutter parity — a uid with no current event
  // is not shown, though the blob retains it for the importer round-trip).
  const uidEntries: UidEntry[] = uidHiddenEvents.flatMap((uid) => {
    const event = syncedEvents.find((candidate) => candidate.id === uid)
    if (event === undefined) return []
    return [
      {
        uid,
        title: displayEventTitle(event.title, t("calendar.event.noTitle")),
        time: formatTimeRange(
          event.startsAt,
          event.endsAt,
          locale,
          displayZone,
        ),
      },
    ]
  })

  const isEmpty = namedHiddenEvents.length === 0 && uidEntries.length === 0

  return (
    <>
      <Stack.Screen options={{ title: t("hiddenEvents.title") }} />
      <RootPage
        scrollsUnderHeader={!isEmpty}
        testID="hidden-events-layout-owner"
        lane="standard"
      >
        {({ laneStyle }) => (
          <ScrollView
            {...headerScrollProps(!isEmpty)}
            testID="hidden-events-responsive-content"
            contentContainerStyle={[laneStyle, styles.content]}
          >
            {failed && (
              <ErrorNotice
                message={t("hiddenEvents.error")}
                style={styles.error}
              />
            )}

            {isEmpty ? (
              <StatusView
                kind="empty"
                testID="hidden-events-empty"
                presentation="section"
                title={t("hiddenEvents.empty.title")}
                caption={t("hiddenEvents.empty.caption")}
                artwork={noDataArtwork}
              />
            ) : (
              <>
                {namedHiddenEvents.length > 0 && (
                  <ListSection
                    title={t("hiddenEvents.namedSection")}
                    testID="hidden-events-name-section"
                  >
                    {namedHiddenEvents.map((name) => (
                      <ListRow
                        key={`name-${name}`}
                        label={name}
                        testID={`hidden-events-name-${name}`}
                        trailing={
                          <UnhideButton
                            title={name}
                            onUnhide={() => unhideName(name)}
                          />
                        }
                      />
                    ))}
                  </ListSection>
                )}

                {uidEntries.length > 0 && (
                  <ListSection
                    title={t("hiddenEvents.uidSection")}
                    testID="hidden-events-uid-section"
                  >
                    {uidEntries.map((entry) => (
                      <ListRow
                        key={`uid-${entry.uid}`}
                        label={entry.title}
                        subtitle={entry.time}
                        testID={`hidden-events-uid-${entry.uid}`}
                        trailing={
                          <UnhideButton
                            title={entry.title}
                            onUnhide={() => unhideUid(entry.uid)}
                          />
                        }
                      />
                    ))}
                  </ListSection>
                )}
              </>
            )}
          </ScrollView>
        )}
      </RootPage>
    </>
  )
}

function UnhideButton({
  title,
  onUnhide,
}: {
  title: string
  onUnhide: () => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      variant="text"
      size="small"
      label={t("hiddenEvents.unhide")}
      accessibilityLabel={t("hiddenEvents.unhideLabel", { title })}
      onPress={onUnhide}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  error: {
    marginBottom: Spacing.three,
  },
})
