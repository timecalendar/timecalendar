import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { type MenuComponentRef, MenuView } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { type CalendarView } from "@/features/settings/prefs"
import { Radii, Spacing, useTheme } from "@/theme"

export type CalendarZoomMenuState = {
  canZoomIn: boolean
  canZoomOut: boolean
  canResetZoom: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

type CalendarPlatformMenuProps = {
  view: CalendarView
  onChange: (view: CalendarView) => void
  zoom: CalendarZoomMenuState | null
  minimumTarget: 44 | 48
}

function CalendarPlatformMenu({
  view,
  onChange,
  zoom,
  minimumTarget,
}: CalendarPlatformMenuProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const menuRef = useRef<MenuComponentRef>(null)
  const labels: Record<CalendarView, string> = {
    day: t("calendar.view.day"),
    week: t("calendar.view.week"),
    agenda: t("calendar.view.agenda"),
  }
  const actions = [
    ...(Object.keys(labels) as CalendarView[]).map((value) => ({
      id: value,
      title: labels[value],
      state: value === view ? ("on" as const) : ("off" as const),
    })),
    ...(zoom
      ? [
          {
            id: "zoom-in",
            title: t(
              zoom.canZoomIn ? "calendar.zoom.in" : "calendar.zoom.inLimit",
            ),
            attributes: { disabled: !zoom.canZoomIn },
          },
          {
            id: "zoom-out",
            title: t(
              zoom.canZoomOut ? "calendar.zoom.out" : "calendar.zoom.outLimit",
            ),
            attributes: { disabled: !zoom.canZoomOut },
          },
          {
            id: "zoom-reset",
            title: t(
              zoom.canResetZoom
                ? "calendar.zoom.reset"
                : "calendar.zoom.resetDefault",
            ),
            attributes: { disabled: !zoom.canResetZoom },
          },
        ]
      : []),
  ]

  const onPressAction = (action: string) => {
    if (action === "zoom-in") zoom?.onZoomIn()
    else if (action === "zoom-out") zoom?.onZoomOut()
    else if (action === "zoom-reset") zoom?.onResetZoom()
    else onChange(action as CalendarView)
  }

  return (
    <MenuView
      ref={menuRef}
      actions={actions}
      onPressAction={({ nativeEvent }) => onPressAction(nativeEvent.event)}
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
        style={[styles.target, { minHeight: minimumTarget }]}
      >
        <View
          style={[styles.pill, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">{labels[view]}</ThemedText>
          <View style={[styles.chevron, { borderColor: theme.primary }]} />
        </View>
      </Pressable>
    </MenuView>
  )
}

export function CalendarViewMenu(
  props: Omit<CalendarPlatformMenuProps, "minimumTarget">,
) {
  return <CalendarPlatformMenu {...props} minimumTarget={44} />
}

export function CalendarAndroidViewMenu(
  props: Omit<CalendarPlatformMenuProps, "minimumTarget">,
) {
  return <CalendarPlatformMenu {...props} minimumTarget={48} />
}

const styles = StyleSheet.create({
  target: { justifyContent: "center" },
  pill: {
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
