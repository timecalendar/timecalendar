import { SymbolView } from "expo-symbols"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  type AccessibilityActionEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native"

import { type MenuComponentRef, MenuView } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import {
  effectiveCalendarName,
  type UserCalendar,
} from "@/features/calendar-sources/data"
import { Radii, Spacing, useTheme } from "@/theme"

import { VisibilityControl } from "./visibility-control"

export function CalendarRow({
  calendar,
  visible,
  onToggle,
  onDelete,
  onRename,
}: {
  calendar: UserCalendar
  visible: boolean
  onToggle: (visible: boolean) => void
  onDelete: (id: string, name: string) => void
  onRename: (calendar: UserCalendar) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const menuRef = useRef<MenuComponentRef>(null)
  const name = effectiveCalendarName(
    calendar.name,
    t("userCalendars.namePlaceholder"),
  )
  const school = calendar.schoolName ?? t("userCalendars.personalSubtitle")
  const androidTrigger =
    Platform.OS === "android"
      ? {
          accessibilityActions: [{ name: "activate" }],
          onPress: () => menuRef.current?.show(),
          onAccessibilityAction: ({
            nativeEvent,
          }: AccessibilityActionEvent) => {
            if (nativeEvent.actionName === "activate") menuRef.current?.show()
          },
          android_ripple: {
            color: theme.ripple,
            borderless: true,
            radius: 24,
          },
        }
      : null

  return (
    <View
      testID={`user-calendar-row-${calendar.id}`}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}
    >
      <View style={styles.header}>
        <View style={styles.text}>
          <ThemedText style={styles.name}>{name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {school}
          </ThemedText>
        </View>
        <MenuView
          ref={menuRef}
          testID={`user-calendar-actions-${calendar.id}`}
          actions={[
            { id: "rename", title: t("userCalendars.rename.action") },
            {
              id: "delete",
              title: t("userCalendars.delete.action"),
              image: "trash",
              attributes: { destructive: true },
            },
          ]}
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === "rename") onRename(calendar)
            if (nativeEvent.event === "delete") onDelete(calendar.id, name)
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("userCalendars.actions", { name })}
            style={styles.menuButton}
            {...androidTrigger}
          >
            <SymbolView
              name={{ ios: "ellipsis", android: "more_vert" }}
              size={22}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </MenuView>
      </View>
      <View style={[styles.separator, { backgroundColor: theme.separator }]} />
      <VisibilityControl
        calendarId={calendar.id}
        name={name}
        visible={visible}
        onToggle={onToggle}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  header: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  text: { flex: 1, gap: Spacing.half },
  name: {
    ...Platform.select({
      ios: { fontSize: 17, lineHeight: 22, fontWeight: "400" as const },
      default: { fontWeight: "400" as const },
    }),
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two + Spacing.one,
  },
})
