import { Stack } from "expo-router"
import { useCallback } from "react"
import { Platform, StyleSheet, Text } from "react-native"

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
  contextHeading,
  generation,
  acceptedRevision,
  titleTargetActive,
  onTitleTargetChange,
  view,
  onViewChange,
  onToday,
  onAdd,
  zoom,
}: {
  title: string
  contextHeading: string
  generation: number
  acceptedRevision: number
  titleTargetActive: boolean
  onTitleTargetChange: (
    target: {
      node: Text
      visibleTitle: string
      label: string
      contextHeading: string
      generation: number
      revision: number
    } | null,
  ) => void
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onToday: (() => void) | undefined
  onAdd: () => void
  zoom: CalendarZoomMenuState | null
}) {
  const theme = useTheme()
  const titleLabel = `${title}, ${contextHeading}`
  const registerTitle = useCallback(
    (node: Text | null) => {
      onTitleTargetChange(
        node !== null && titleTargetActive
          ? {
              node,
              visibleTitle: title,
              label: titleLabel,
              contextHeading,
              generation,
              revision: acceptedRevision,
            }
          : null,
      )
    },
    [
      acceptedRevision,
      contextHeading,
      generation,
      onTitleTargetChange,
      title,
      titleLabel,
      titleTargetActive,
    ],
  )
  return (
    <Stack.Screen
      options={{
        headerTitle:
          view === "agenda"
            ? title
            : () => (
                <Text
                  ref={registerTitle}
                  testID="calendar-header-title"
                  accessibilityRole="header"
                  accessibilityLabel={titleTargetActive ? titleLabel : title}
                  numberOfLines={1}
                  style={[styles.title, { color: theme.text }]}
                >
                  {title}
                </Text>
              ),
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

const styles = StyleSheet.create({
  title: {
    fontSize: Platform.OS === "ios" ? 17 : 20,
    fontWeight: "600",
    textAlign: "center",
  },
})
