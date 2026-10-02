import { Stack } from "expo-router"
import {
  type Dispatch,
  type SetStateAction,
  useLayoutEffect,
  useRef,
} from "react"
import { Platform, StyleSheet, Text } from "react-native"

import type { CalendarPageTitleTarget } from "@/features/calendar/renderer"
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
  pageKey,
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
  pageKey: string
  titleTargetActive: boolean
  onTitleTargetChange: Dispatch<SetStateAction<CalendarPageTitleTarget | null>>
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
        headerTitle:
          view === "agenda"
            ? title
            : () => (
                <CalendarHeaderTitle
                  title={title}
                  contextHeading={contextHeading}
                  pageKey={pageKey}
                  active={titleTargetActive}
                  color={theme.text}
                  onTitleTargetChange={onTitleTargetChange}
                />
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

function CalendarHeaderTitle({
  title,
  contextHeading,
  pageKey,
  active,
  color,
  onTitleTargetChange,
}: {
  title: string
  contextHeading: string
  pageKey: string
  active: boolean
  color: string
  onTitleTargetChange: Dispatch<SetStateAction<CalendarPageTitleTarget | null>>
}) {
  const titleRef = useRef<Text>(null)
  const label = `${title}, ${contextHeading}`
  useLayoutEffect(() => {
    const node = titleRef.current
    if (!active || node === null) return
    const target: CalendarPageTitleTarget = {
      node,
      visibleTitle: title,
      label,
      contextHeading,
      pageKey,
    }
    onTitleTargetChange((current) =>
      current?.node === node &&
      current.label === label &&
      current.pageKey === pageKey
        ? current
        : target,
    )
    return () => {
      onTitleTargetChange((current) =>
        current?.node === node ? null : current,
      )
    }
  }, [active, contextHeading, label, onTitleTargetChange, pageKey, title])
  return (
    <Text
      ref={titleRef}
      testID="calendar-header-title"
      accessibilityRole="header"
      accessibilityLabel={active ? label : title}
      numberOfLines={1}
      style={[styles.title, { color }]}
    >
      {title}
    </Text>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: Platform.OS === "ios" ? 17 : 20,
    fontWeight: "600",
    textAlign: "center",
  },
})
