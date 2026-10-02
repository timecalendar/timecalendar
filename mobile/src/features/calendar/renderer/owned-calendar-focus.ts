import {
  type RefObject,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
import {
  AccessibilityInfo,
  findNodeHandle,
  type ScrollView,
  type Text,
  type View,
} from "react-native"
import type { SharedValue } from "react-native-reanimated"

import type { PageColumnV1 } from "@/features/calendar/data"

type FocusTarget = { node: View; dateKey: string; minute: number }
type FocusMemory = { key: string; dateKey: string }
export type CalendarPageTitleTarget = {
  node: Text
  visibleTitle: string
  label: string
  contextHeading: string
  pageKey: string
}

function requestRestoredFocus({
  targets,
  headings,
  pageTitleTarget,
  heading,
  pageKey,
  currentColumns,
  lastFocused,
  lastRestore,
  restoreKey,
  pixelsPerHour,
  scrollTo,
  isCurrent,
  onFocused,
}: {
  targets: Map<string, FocusTarget>
  headings: Map<string, View>
  pageTitleTarget: CalendarPageTitleTarget | null | undefined
  heading: string
  pageKey: string
  currentColumns: readonly {
    key: string
    tiles: readonly { key: string }[]
  }[]
  lastFocused: { current: FocusMemory | null }
  lastRestore: { current: string | null }
  restoreKey: string
  pixelsPerHour: number
  scrollTo: (y: number) => void
  isCurrent: () => boolean
  onFocused: (titleFocused: boolean) => void
}): number | "waiting" | null {
  if (lastRestore.current === restoreKey || lastFocused.current === null)
    return null
  const last = lastFocused.current
  const target = targets.get(last.key)
  const identityPresent = currentColumns.some((column) =>
    column.tiles.some((tile) => tile.key === last.key),
  )
  const datePresent = currentColumns.some(
    (column) => column.key === last.dateKey,
  )
  if (identityPresent && target === undefined) return "waiting"
  const dateNode = datePresent ? headings.get(last.dateKey) : undefined
  if (datePresent && target === undefined && !dateNode) return "waiting"
  const title =
    pageTitleTarget?.pageKey === pageKey &&
    pageTitleTarget.contextHeading === heading &&
    pageTitleTarget.label.includes(pageTitleTarget.visibleTitle) &&
    pageTitleTarget.label.includes(heading)
      ? pageTitleTarget
      : null
  const node = target?.node ?? dateNode ?? title?.node
  if (node === null || node === undefined) return "waiting"
  const titleFocused = node === title?.node
  if (target !== undefined)
    scrollTo(Math.max(0, (target.minute / 60) * pixelsPerHour - 96))
  return requestAnimationFrame(() => {
    if (!isCurrent() || lastRestore.current === restoreKey) return
    const handle = findNodeHandle(node)
    if (handle !== null) {
      lastRestore.current = restoreKey
      AccessibilityInfo.setAccessibilityFocus(handle)
      onFocused(titleFocused)
    }
  })
}

/** Remembers the focused event and returns focus on a committed page or route visit. */
export function useCalendarFocusRestoration({
  committedKey,
  currentColumns,
  contextReady,
  routeFocused,
  pageTitleTarget,
  heading,
  onContextSettled,
  pixelsPerHour,
  scrollRef,
}: {
  committedKey: string
  currentColumns: readonly PageColumnV1[]
  contextReady: boolean
  routeFocused: boolean | undefined
  pageTitleTarget: CalendarPageTitleTarget | null | undefined
  heading: string
  onContextSettled:
    | ((pageKey: string, titleFocused: boolean) => void)
    | undefined
  pixelsPerHour: SharedValue<number>
  scrollRef: RefObject<{ scrollTo: ScrollView["scrollTo"] } | null>
}) {
  const [targets] = useState(() => new Map<string, FocusTarget>())
  const [headings] = useState(() => new Map<string, View>())
  const lastFocused = useRef<FocusMemory | null>(null)
  const lastRestore = useRef<string | null>(null)
  const lastAnnounced = useRef<string | null>(null)
  const visit = useRef(0)
  const wasFocused = useRef(false)

  const registerTarget = (
    key: string,
    dateKey: string,
    minute: number,
    node: View | null,
  ) => {
    if (node === null) targets.delete(key)
    else if (!targets.has(key)) targets.set(key, { node, dateKey, minute })
  }
  const rememberTarget = (key: string, dateKey: string, pageKey: string) => {
    if (
      pageKey !== committedKey ||
      !contextReady ||
      routeFocused === false ||
      targets.get(key)?.dateKey !== dateKey
    )
      return
    lastFocused.current = { key, dateKey }
  }
  const registerHeading = (dateKey: string, node: View | null) => {
    if (node === null) headings.delete(dateKey)
    else headings.set(dateKey, node)
  }

  const isRestorationCurrent = useEffectEvent(
    (restoreKey: string) =>
      routeFocused !== false &&
      contextReady &&
      `${committedKey}:${visit.current}` === restoreKey,
  )

  const restore = useEffectEvent(
    (
      restoreKey: string,
      isCurrent: () => boolean,
      onFocused: (titleFocused: boolean) => void,
    ) => {
      if (!isRestorationCurrent(restoreKey)) return "waiting"
      return requestRestoredFocus({
        targets,
        headings,
        pageTitleTarget,
        heading,
        pageKey: committedKey,
        currentColumns,
        lastFocused,
        lastRestore,
        restoreKey,
        pixelsPerHour: pixelsPerHour.get(),
        scrollTo: (y) => scrollRef.current?.scrollTo({ y, animated: false }),
        isCurrent,
        onFocused,
      })
    },
  )

  useEffect(() => {
    if (routeFocused === false) {
      wasFocused.current = false
      return
    }
    if (!wasFocused.current) {
      wasFocused.current = true
      visit.current += 1
    }
    if (!contextReady) return
    let active = true
    const restoreKey = `${committedKey}:${visit.current}`
    const onFocused = (titleFocused: boolean) => {
      if (lastAnnounced.current === committedKey) return
      lastAnnounced.current = committedKey
      onContextSettled?.(committedKey, titleFocused)
    }
    const frame = restore(
      restoreKey,
      () => active && isRestorationCurrent(restoreKey),
      onFocused,
    )
    if (frame === "waiting") return
    if (frame !== null) {
      return () => {
        active = false
        cancelAnimationFrame(frame)
      }
    }
    if (lastAnnounced.current === committedKey) return
    onFocused(false)
  }, [
    committedKey,
    contextReady,
    currentColumns,
    heading,
    onContextSettled,
    pageTitleTarget,
    routeFocused,
  ])

  return { registerTarget, rememberTarget, registerHeading }
}
