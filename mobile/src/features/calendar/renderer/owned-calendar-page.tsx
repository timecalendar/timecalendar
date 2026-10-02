import type { TFunction } from "i18next"
import { memo, useEffect } from "react"
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native"
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated"

import { ThemedText } from "@/components/themed-text"
import {
  FULL_DAY_START_MINUTE,
  minuteToPixel,
  type PagePresentationV1,
  type PageTileV1,
  planTargetConflicts,
} from "@/features/calendar/data"
import { ChecklistProgressIndicator } from "@/features/event-checklists"
import { useTheme } from "@/theme"

import CalendarFocusObserverView from "./calendar-focus-observer"
import { pagingLog } from "./owned-calendar-paging-log"
import type { OwnedCalendarProbeDiagnostic } from "./owned-calendar-shell"

/** Diameter of the indicator's leading cap — its non-color shape cue. */
const NOW_CAP_SIZE = 8
const POINT_MARKER_SIZE = 4

export type PageEventHandlers = {
  onEventPress: (uid: string) => void
  onEventFocused: (key: string, dateKey: string) => void
  onChooseConflict: (tiles: readonly PageTileV1[]) => void
  registerTarget: (
    key: string,
    dateKey: string,
    minute: number,
    node: View | null,
  ) => void
  isEventActivationBlocked: () => boolean
  onProbeDiagnostic?:
    | ((diagnostic: OwnedCalendarProbeDiagnostic) => void)
    | undefined
}

export function useMinutePositionStyle(
  minute: number,
  pixelsPerHour: SharedValue<number>,
) {
  return useAnimatedStyle(() => ({
    top: minuteToPixel(minute, {
      startMinute: FULL_DAY_START_MINUTE,
      pixelsPerHour: pixelsPerHour.get(),
    }),
  }))
}

function liveEventVisualGeometry(
  shape: "point" | "interval",
  startMinute: number,
  endMinute: number,
  pixelsPerHour: number,
) {
  "worklet"
  const top = (startMinute / 60) * pixelsPerHour
  return shape === "point"
    ? { top: top - POINT_MARKER_SIZE / 2, height: POINT_MARKER_SIZE }
    : { top, height: ((endMinute - startMinute) / 60) * pixelsPerHour }
}

function liveEventInteractionGeometry(
  visual: { top: number; height: number },
  dayHeight: number,
  minimum: number,
) {
  "worklet"
  const height = Math.min(dayHeight, Math.max(visual.height, minimum))
  const center = visual.top + visual.height / 2
  return {
    top: Math.max(0, Math.min(center - height / 2, dayHeight - height)),
    height,
  }
}

export function horizontalRectangleStyle(rectangle: {
  left: number
  right: number
}) {
  return {
    left: `${rectangle.left * 100}%` as const,
    right:
      rectangle.right === 1 ? 2 : (`${(1 - rectangle.right) * 100}%` as const),
  }
}

/**
 * One timeline page. Its presentation is frozen per page key and its props are
 * stable while it stays in the window, so a page crossing renders only the page
 * that enters the window.
 */
export const CalendarPage = memo(function CalendarPage({
  presentation,
  left,
  width,
  height,
  committed,
  nowDateKey,
  nowMinuteOfDay,
  nowLabel,
  pixelsPerHour,
  settledPixelsPerHour,
  handlers,
  t,
}: {
  presentation: PagePresentationV1
  left: number
  width: number
  height: number
  committed: boolean
  nowDateKey: string | null
  nowMinuteOfDay: number
  nowLabel: string | undefined
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  handlers: PageEventHandlers
  t: TFunction
}) {
  const theme = useTheme()
  const { pageKey } = presentation
  pagingLog.render("page")
  useEffect(() => {
    pagingLog.mount(pageKey)
  }, [pageKey])
  return (
    <View
      testID={`owned-calendar-page-${pageKey}`}
      collapsable={false}
      accessible={false}
      accessibilityElementsHidden={!committed}
      accessibilityState={{ busy: presentation.status === "loading" }}
      importantForAccessibility={committed ? "yes" : "no-hide-descendants"}
      style={[styles.page, { left, width, height }]}
    >
      <View style={styles.dayColumns} pointerEvents="none">
        {presentation.columns.map((column) => {
          const isToday = column.key === nowDateKey
          const exposesNow = isToday && committed
          return (
            <View
              key={column.key}
              testID={`owned-calendar-column-${column.key}`}
              accessible={false}
              importantForAccessibility={
                exposesNow ? "no" : "no-hide-descendants"
              }
              style={[styles.dayColumn, { borderColor: theme.separator }]}
            >
              {isToday && (
                <NowIndicator
                  testID={`owned-calendar-now-${column.key}`}
                  minuteOfDay={nowMinuteOfDay}
                  pixelsPerHour={pixelsPerHour}
                  color={theme.primary}
                  accessibilityLabel={exposesNow ? nowLabel : undefined}
                />
              )}
            </View>
          )
        })}
      </View>
      <View pointerEvents="box-none" style={styles.tileColumns}>
        {presentation.columns.map((column) => (
          <TileColumn
            key={column.key}
            dateKey={column.key}
            tiles={column.tiles}
            committed={committed}
            pixelsPerHour={pixelsPerHour}
            settledPixelsPerHour={settledPixelsPerHour}
            handlers={handlers}
            t={t}
          />
        ))}
      </View>
    </View>
  )
})

function TileColumn({
  dateKey,
  tiles,
  committed,
  pixelsPerHour,
  settledPixelsPerHour,
  handlers,
  t,
}: {
  dateKey: string
  tiles: readonly PageTileV1[]
  committed: boolean
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  handlers: PageEventHandlers
  t: TFunction
}) {
  if (!committed)
    return (
      <View pointerEvents="none" style={styles.tileColumn}>
        {tiles.map((tile) => (
          <StaticCalendarTile
            key={tile.key}
            tile={tile}
            settledPixelsPerHour={settledPixelsPerHour}
          />
        ))}
      </View>
    )
  const conflicts = planTargetConflicts({
    items: tiles,
    pixelsPerHour: settledPixelsPerHour,
    platform: Platform.OS === "ios" ? "ios" : "android",
  })
  return (
    <View pointerEvents="box-none" style={styles.tileColumn}>
      {tiles.map((tile) => (
        <TimedCalendarTile
          key={tile.key}
          tile={tile}
          dateKey={dateKey}
          pixelsPerHour={pixelsPerHour}
          settledPixelsPerHour={settledPixelsPerHour}
          handlers={handlers}
          t={t}
        />
      ))}
      {conflicts.map((component) =>
        component.items.length > 1 ? (
          <Pressable
            key={`conflict:${component.key}`}
            testID={`owned-calendar-conflict-${component.key}`}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => {
              if (!handlers.isEventActivationBlocked())
                handlers.onChooseConflict(component.items)
            }}
            style={[
              styles.conflictTarget,
              horizontalRectangleStyle(component.rectangle),
              {
                top: component.rectangle.top,
                height: component.rectangle.bottom - component.rectangle.top,
              },
            ]}
          />
        ) : null,
      )}
    </View>
  )
}

function probeTargetFrame(
  onProbeDiagnostic: PageEventHandlers["onProbeDiagnostic"],
  identity: string,
  order: number,
) {
  if (onProbeDiagnostic === undefined) return undefined
  return ({ nativeEvent }: LayoutChangeEvent) =>
    onProbeDiagnostic({
      kind: "target-frame",
      identity,
      order,
      frame: nativeEvent.layout,
    })
}

const MINIMUM_TARGET = Platform.OS === "ios" ? 44 : 48

function tileSurfaceStyle(tile: PageTileV1) {
  return {
    backgroundColor: tile.appearance.surface,
    borderLeftColor: tile.appearance.accent,
    borderColor: tile.appearance.outline,
    borderWidth: tile.appearance.increasedContrast ? 2 : 0,
    borderLeftWidth: 3,
  }
}

function TileContent({
  tile,
  settledPixelsPerHour,
}: {
  tile: PageTileV1
  settledPixelsPerHour: number
}) {
  if (tile.shape !== "interval") return null
  const settledHeight =
    ((tile.endMinute - tile.startMinute) / 60) * settledPixelsPerHour
  return (
    <>
      <ThemedText
        accessible={false}
        type="captionSmall"
        style={[styles.tileTitle, { color: tile.appearance.foreground }]}
      >
        {tile.title}
      </ThemedText>
      {tile.location !== undefined && settledHeight >= 40 && (
        <ThemedText
          accessible={false}
          type="captionSmall"
          style={{ color: tile.appearance.foreground }}
        >
          {tile.location}
        </ThemedText>
      )}
      {settledHeight >= 60 && (
        <ChecklistProgressIndicator
          progress={tile.checklist}
          variant="compact"
        />
      )}
    </>
  )
}

// A page other than the committed one never pinches and is never touched at
// rest, so a window shift mounts plain views: no animated styles, no targets.
function StaticCalendarTile({
  tile,
  settledPixelsPerHour,
}: {
  tile: PageTileV1
  settledPixelsPerHour: number
}) {
  const visual = liveEventVisualGeometry(
    tile.shape,
    tile.startMinute,
    tile.endMinute,
    settledPixelsPerHour,
  )
  const interaction = liveEventInteractionGeometry(
    visual,
    24 * settledPixelsPerHour,
    MINIMUM_TARGET,
  )
  return (
    <View
      testID={`owned-calendar-event-${tile.identity.uid}`}
      style={[
        styles.tileAnchor,
        horizontalRectangleStyle({ left: tile.startX, right: tile.endX }),
        interaction,
      ]}
    >
      <View
        style={[
          styles.tile,
          tileSurfaceStyle(tile),
          { top: visual.top - interaction.top, height: visual.height },
        ]}
      >
        <TileContent tile={tile} settledPixelsPerHour={settledPixelsPerHour} />
      </View>
    </View>
  )
}

function TimedCalendarTile({
  tile,
  dateKey,
  pixelsPerHour,
  settledPixelsPerHour,
  handlers,
  t,
}: {
  tile: PageTileV1
  dateKey: string
  pixelsPerHour: SharedValue<number>
  settledPixelsPerHour: number
  handlers: PageEventHandlers
  t: TFunction
}) {
  const minimumTarget = MINIMUM_TARGET
  const interactionStyle = useAnimatedStyle(() => {
    const livePixelsPerHour = pixelsPerHour.get()
    const visual = liveEventVisualGeometry(
      tile.shape,
      tile.startMinute,
      tile.endMinute,
      livePixelsPerHour,
    )
    return liveEventInteractionGeometry(
      visual,
      24 * livePixelsPerHour,
      minimumTarget,
    )
  })
  const visualStyle = useAnimatedStyle(() => {
    const livePixelsPerHour = pixelsPerHour.get()
    const visual = liveEventVisualGeometry(
      tile.shape,
      tile.startMinute,
      tile.endMinute,
      livePixelsPerHour,
    )
    const interaction = liveEventInteractionGeometry(
      visual,
      24 * livePixelsPerHour,
      minimumTarget,
    )
    return { top: visual.top - interaction.top, height: visual.height }
  })
  const visual = (
    <Animated.View
      accessible={false}
      pointerEvents="none"
      style={[styles.tile, tileSurfaceStyle(tile), visualStyle]}
    >
      <TileContent tile={tile} settledPixelsPerHour={settledPixelsPerHour} />
    </Animated.View>
  )
  const button = (
    <Pressable
      ref={(node) =>
        handlers.registerTarget(tile.key, dateKey, tile.startMinute, node)
      }
      accessible
      importantForAccessibility="yes"
      accessibilityRole="button"
      accessibilityLabel={tile.accessibilityLabel}
      accessibilityHint={t("calendar.event.hint")}
      onPress={() => handlers.onEventPress(tile.identity.uid)}
      style={styles.tileTarget}
    >
      {visual}
    </Pressable>
  )
  return (
    <Animated.View
      testID={`owned-calendar-event-${tile.identity.uid}`}
      pointerEvents="box-none"
      onLayout={probeTargetFrame(
        handlers.onProbeDiagnostic,
        tile.key,
        tile.accessibilityOrder,
      )}
      style={[
        styles.tileAnchor,
        horizontalRectangleStyle({ left: tile.startX, right: tile.endX }),
        interactionStyle,
      ]}
    >
      <CalendarFocusObserverView
        testID={`owned-calendar-focus-observer-${tile.identity.uid}`}
        identity={tile.key}
        dateKey={dateKey}
        onAccessibilityFocused={({ nativeEvent }) =>
          handlers.onEventFocused(nativeEvent.identity, nativeEvent.dateKey)
        }
        style={styles.tileTarget}
      >
        {button}
      </CalendarFocusObserverView>
    </Animated.View>
  )
}

// The current-time indicator. Its non-color cue is SHAPE: a filled cap at the
// leading edge of the rule, legible in greyscale and without colour perception.
// Vertical placement runs on the UI thread off the live pinch scale, so it
// tracks a zoom without a per-frame React state write.
function NowIndicator({
  testID,
  minuteOfDay,
  pixelsPerHour,
  color,
  accessibilityLabel,
}: {
  testID: string
  minuteOfDay: number
  pixelsPerHour: SharedValue<number>
  color: string
  accessibilityLabel: string | undefined
}) {
  const positionStyle = useMinutePositionStyle(minuteOfDay, pixelsPerHour)
  return (
    <Animated.View
      testID={testID}
      accessible={accessibilityLabel !== undefined}
      accessibilityRole={accessibilityLabel === undefined ? undefined : "text"}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel === undefined ? "no-hide-descendants" : "yes"
      }
      style={[styles.nowIndicator, positionStyle]}
    >
      <View style={[styles.nowIndicatorCap, { backgroundColor: color }]} />
      <View style={[styles.nowIndicatorRule, { backgroundColor: color }]} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  page: { position: "absolute", top: 0 },
  dayColumns: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  dayColumn: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth },
  nowIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    transform: [{ translateY: -NOW_CAP_SIZE / 2 }],
  },
  nowIndicatorCap: {
    width: NOW_CAP_SIZE,
    height: NOW_CAP_SIZE,
    borderRadius: NOW_CAP_SIZE / 2,
  },
  nowIndicatorRule: { flex: 1, height: 2 },
  tileColumns: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  tileColumn: { flex: 1, position: "relative" },
  tileAnchor: { position: "absolute" },
  tileTarget: { flex: 1 },
  conflictTarget: { position: "absolute" },
  tile: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tileTitle: { fontWeight: 600 },
})
