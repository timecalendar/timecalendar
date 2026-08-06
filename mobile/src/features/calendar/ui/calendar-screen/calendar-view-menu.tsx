import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import {
  Host,
  type MenuComponentRef,
  MenuView,
  Picker,
} from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { type CalendarView } from "@/features/calendar/ui/calendar-screen/use-calendar-screen-controller"
import { Radii, Spacing, useTheme } from "@/theme"

export function CalendarViewMenu({
  view,
  onChange,
}: {
  view: CalendarView
  onChange: (view: CalendarView) => void
}) {
  const { t } = useTranslation()
  return (
    <Host matchContents style={styles.viewMenu}>
      <Picker
        testID="calendar-view"
        appearance="menu"
        selectedValue={view}
        onValueChange={(value) => onChange(value as CalendarView)}
      >
        <Picker.Item label={t("calendar.view.day")} value="day" />
        <Picker.Item label={t("calendar.view.week")} value="week" />
        <Picker.Item label={t("calendar.view.agenda")} value="agenda" />
      </Picker>
    </Host>
  )
}

export function CalendarAndroidViewMenu({
  view,
  onChange,
}: {
  view: CalendarView
  onChange: (view: CalendarView) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const menuRef = useRef<MenuComponentRef>(null)
  const labels: Record<CalendarView, string> = {
    day: t("calendar.view.day"),
    week: t("calendar.view.week"),
    agenda: t("calendar.view.agenda"),
  }
  const actions = (Object.keys(labels) as CalendarView[]).map((value) => ({
    id: value,
    title: labels[value],
    state: value === view ? ("on" as const) : ("off" as const),
  }))
  return (
    <MenuView
      ref={menuRef}
      actions={actions}
      onPressAction={({ nativeEvent }) =>
        onChange(nativeEvent.event as CalendarView)
      }
    >
      <Pressable
        testID="calendar-view"
        accessibilityRole="button"
        accessibilityLabel={labels[view]}
        accessibilityActions={[{ name: "activate" }]}
        onPress={() => menuRef.current?.show()}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "activate") menuRef.current?.show()
        }}
        style={styles.androidTarget}
      >
        <View
          style={[
            styles.androidPill,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <ThemedText type="smallBold">{labels[view]}</ThemedText>
          <View style={[styles.chevron, { borderColor: theme.primary }]} />
        </View>
      </Pressable>
    </MenuView>
  )
}

const styles = StyleSheet.create({
  viewMenu: { minHeight: 44, justifyContent: "center" },
  androidTarget: { minHeight: 48, justifyContent: "center" },
  androidPill: {
    minHeight: 36,
    minWidth: 88,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.one,
  },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }, { translateY: -2 }],
  },
})
