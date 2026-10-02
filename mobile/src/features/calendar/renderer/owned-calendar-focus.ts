import {
  type RefObject,
  useEffect,
  useLayoutEffect,
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
type FocusContext = { pageKey: string; ready: boolean }

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
  onFocused?: (titleFocused: boolean) => void
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
      onFocused?.(titleFocused)
    }
  })
}

/**
 * Accessibility focus memory for the committed page: remembers the event a
 * screen reader last focused, and restores it (or its date, or the title) when
 * the page settles or the route regains focus.
 */
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
  const focusContext = useRef<FocusContext>({
    pageKey: committedKey,
    ready: false,
  })
  const titleContext = useRef(pageTitleTarget)
  const returnFrame = useRef<number | null>(null)
  useLayoutEffect(() => {
    titleContext.current = pageTitleTarget
    focusContext.current = {
      pageKey: committedKey,
      ready: contextReady && routeFocused !== false,
    }
    if (returnFrame.current !== null) {
      cancelAnimationFrame(returnFrame.current)
      returnFrame.current = null
    }
  }, [committedKey, contextReady, pageTitleTarget, routeFocused])
  const lastFocused = useRef<FocusMemory | null>(null)
  const lastRestore = useRef<string | null>(null)
  const lastAutoContext = useRef<string | null>(null)
  const returnEpoch = useRef(0)
  const pendingReturn = useRef(false)
  const isFocusContextCurrent = (key: string) =>
    focusContext.current.pageKey === key && focusContext.current.ready
  const registerTarget = (
    key: string,
    dateKey: string,
    minute: number,
    node: View | null,
  ) => {
    if (node === null) targets.delete(key)
    else if (!targets.has(key)) targets.set(key, { node, dateKey, minute })
  }
  const rememberTarget = (key: string, dateKey: string) => {
    if (
      !isFocusContextCurrent(focusContext.current.pageKey) ||
      targets.get(key)?.dateKey !== dateKey ||
      (lastFocused.current?.key === key &&
        lastFocused.current.dateKey === dateKey)
    )
      return
    lastFocused.current = { key, dateKey }
  }
  useEffect(() => {
    if (routeFocused === false || !contextReady) return
    if (lastAutoContext.current === committedKey) return
    const frame = requestRestoredFocus({
      targets,
      headings,
      pageTitleTarget,
      heading,
      pageKey: committedKey,
      currentColumns,
      lastFocused,
      lastRestore,
      restoreKey: `${committedKey}:${returnEpoch.current}`,
      pixelsPerHour: pixelsPerHour.get(),
      scrollTo: (y) => scrollRef.current?.scrollTo({ y, animated: false }),
      isCurrent: () =>
        focusContext.current.pageKey === committedKey &&
        focusContext.current.ready &&
        titleContext.current === pageTitleTarget,
      onFocused: (titleFocused) => {
        pendingReturn.current = false
        lastAutoContext.current = committedKey
        onContextSettled?.(committedKey, titleFocused)
      },
    })
    if (frame === "waiting") return
    if (frame !== null) return () => cancelAnimationFrame(frame)
    // Nothing to restore: the context still settles, a frame later like a
    // restored focus does, so the heading is announced from one place.
    lastAutoContext.current = committedKey
    requestAnimationFrame(() => {
      if (focusContext.current.pageKey === committedKey)
        onContextSettled?.(committedKey, false)
    })
  }, [
    committedKey,
    contextReady,
    pixelsPerHour,
    scrollRef,
    currentColumns,
    heading,
    headings,
    onContextSettled,
    pageTitleTarget,
    routeFocused,
    targets,
  ])
  const restoreFocus = () => {
    returnEpoch.current += 1
    if (routeFocused === false || !contextReady) return
    if (returnFrame.current !== null) cancelAnimationFrame(returnFrame.current)
    const frame = requestRestoredFocus({
      targets,
      headings,
      pageTitleTarget,
      heading,
      pageKey: committedKey,
      currentColumns,
      lastFocused,
      lastRestore,
      restoreKey: `${committedKey}:${returnEpoch.current}`,
      pixelsPerHour: pixelsPerHour.get(),
      scrollTo: (y) => scrollRef.current?.scrollTo({ y, animated: false }),
      isCurrent: () =>
        isFocusContextCurrent(committedKey) &&
        titleContext.current === pageTitleTarget,
      onFocused: () => {
        pendingReturn.current = false
      },
    })
    pendingReturn.current = frame !== null
    returnFrame.current = typeof frame === "number" ? frame : null
  }
  const restoreFocusRef = useRef(restoreFocus)
  useLayoutEffect(() => {
    restoreFocusRef.current = restoreFocus
  })
  useEffect(() => {
    if (
      pendingReturn.current &&
      routeFocused !== false &&
      contextReady &&
      pageTitleTarget !== null &&
      pageTitleTarget !== undefined
    )
      restoreFocusRef.current()
  }, [committedKey, contextReady, pageTitleTarget, routeFocused])
  useEffect(
    () => () => {
      if (returnFrame.current !== null)
        cancelAnimationFrame(returnFrame.current)
    },
    [],
  )
  const registerHeading = (dateKey: string, node: View | null) => {
    if (node === null) headings.delete(dateKey)
    else headings.set(dateKey, node)
  }
  return { registerTarget, rememberTarget, registerHeading, restoreFocus }
}
