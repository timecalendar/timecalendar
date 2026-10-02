import { useTranslation } from "react-i18next"
import { Modal, Pressable, StyleSheet, View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import type { PageTileV1 } from "@/features/calendar/data"
import { useTheme } from "@/theme"

/** One chooser for every page: the events behind a crowded conflict target. */
export function EventChooser({
  tiles,
  onChoose,
  onClose,
}: {
  tiles: readonly PageTileV1[] | null
  onChoose: (uid: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <Modal
      testID="owned-calendar-event-chooser-modal"
      visible={tiles !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.chooserBackdrop}>
        <View
          testID="owned-calendar-event-chooser"
          accessibilityViewIsModal
          accessibilityLabel={t("calendar.event.chooser.title")}
          style={[styles.chooser, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="subtitle">
            {t("calendar.event.chooser.title")}
          </ThemedText>
          {tiles?.map((tile) => (
            <Pressable
              key={tile.key}
              accessibilityRole="button"
              accessibilityLabel={tile.accessibilityLabel}
              onPress={() => onChoose(tile.identity.uid)}
              style={styles.chooserOption}
            >
              <ThemedText>{tile.accessibilityLabel}</ThemedText>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("calendar.event.chooser.cancel")}
            onPress={onClose}
            style={styles.chooserOption}
          >
            <ThemedText>{t("calendar.event.chooser.cancel")}</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  chooserBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  chooser: { borderRadius: 12, padding: 16, gap: 8 },
  chooserOption: { minHeight: 48, justifyContent: "center", padding: 8 },
})
