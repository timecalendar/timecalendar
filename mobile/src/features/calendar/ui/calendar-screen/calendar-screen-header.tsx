import { Stack } from "expo-router"
import {
  type Dispatch,
  type SetStateAction,
  useLayoutEffect,
  useRef,
} from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, Text, useWindowDimensions } from "react-native"

import { type HeaderAction, useHeaderActions } from "@/components/chrome"
import type { CalendarPageTitleTarget } from "@/features/calendar/renderer"
import { type CalendarView } from "@/features/settings/prefs"
import { useTheme } from "@/theme"

import {
  CalendarAndroidViewMenu,
  CalendarViewMenu,
  type CalendarZoomMenuState,
} from "./calendar-view-menu"

export function CalendarScreenHeader({
  title,
  compactTitle,
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
  compactTitle: string
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
  const { t } = useTranslation()
  const theme = useTheme()
  const today: HeaderAction[] =
    onToday === undefined
      ? []
      : [
          {
            icon: { ios: "calendar", android: "today" },
            accessibilityLabel: t("calendar.todayLabel"),
            testID: "calendar-today",
            onPress: onToday,
          },
        ]
  const headerActions = useHeaderActions({
    right: [
      ...today,
      {
        icon: { ios: "plus", android: "add" },
        accessibilityLabel: t("calendar.addLabel"),
        testID: "calendar-add",
        platform: "ios",
        onPress: onAdd,
      },
    ],
  })
  return (
    <Stack.Screen
      options={{
        headerTitle:
          view === "agenda"
            ? title
            : () => (
                <CalendarHeaderTitle
                  title={title}
                  compactTitle={compactTitle}
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
        ...headerActions,
      }}
    />
  )
}

function CalendarHeaderTitle({
  title,
  compactTitle,
  contextHeading,
  pageKey,
  active,
  color,
  onTitleTargetChange,
}: {
  title: string
  compactTitle: string
  contextHeading: string
  pageKey: string
  active: boolean
  color: string
  onTitleTargetChange: Dispatch<SetStateAction<CalendarPageTitleTarget | null>>
}) {
  const titleRef = useRef<Text>(null)
  const { fontScale } = useWindowDimensions()
  const visibleTitle = fontScale >= 2.5 ? compactTitle : title
  const label = `${title}, ${contextHeading}`
  useLayoutEffect(() => {
    const node = titleRef.current
    if (!active || node === null) return
    const target: CalendarPageTitleTarget = {
      node,
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
  }, [active, contextHeading, label, onTitleTargetChange, pageKey])
  return (
    <Text
      ref={titleRef}
      testID="calendar-header-title"
      accessibilityRole="header"
      accessibilityLabel={active ? label : title}
      numberOfLines={1}
      maxFontSizeMultiplier={1.75}
      style={[styles.title, { color }]}
    >
      {visibleTitle}
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
