import { Stack } from "expo-router"
import { Platform } from "react-native"

import { type CalendarView } from "@/features/calendar/ui/calendar-screen/use-calendar-screen-controller"
import { useTheme } from "@/theme"

import { CalendarHeaderActions } from "./calendar-screen-actions"
import { CalendarAndroidViewMenu, CalendarViewMenu } from "./calendar-view-menu"

export function CalendarScreenHeader({
  title,
  view,
  onViewChange,
  onToday,
  onAdd,
}: {
  title: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onToday: () => void
  onAdd: () => void
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
            <CalendarAndroidViewMenu view={view} onChange={onViewChange} />
          ) : (
            <CalendarViewMenu view={view} onChange={onViewChange} />
          ),
        headerRight: () => (
          <CalendarHeaderActions onToday={onToday} onAdd={onAdd} />
        ),
      }}
    />
  )
}
