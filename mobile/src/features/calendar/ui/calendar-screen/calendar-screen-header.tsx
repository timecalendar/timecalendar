import { Stack } from "expo-router"
import { Platform } from "react-native"

import { type CalendarView } from "@/features/settings/prefs"
import { useTheme } from "@/theme"

import { CalendarHeaderActions } from "./calendar-screen-actions"
import {
  CalendarAndroidViewMenu,
  CalendarViewMenu,
  type CalendarZoomMenuState,
} from "./calendar-view-menu"

export function CalendarScreenHeader({
  title,
  view,
  onViewChange,
  onToday,
  onAdd,
  zoom,
}: {
  title: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onToday: (() => void) | undefined
  onAdd: () => void
  zoom: CalendarZoomMenuState | null
}) {
  const theme = useTheme()
  return (
    <Stack.Screen
      options={{
        headerTitle: title,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerLeft: () =>
          Platform.OS === "android" ? (
            <CalendarAndroidViewMenu
              view={view}
              onChange={onViewChange}
              zoom={zoom}
            />
          ) : (
            <CalendarViewMenu view={view} onChange={onViewChange} zoom={zoom} />
          ),
        headerRight: () => (
          <CalendarHeaderActions onToday={onToday} onAdd={onAdd} />
        ),
      }}
    />
  )
}
