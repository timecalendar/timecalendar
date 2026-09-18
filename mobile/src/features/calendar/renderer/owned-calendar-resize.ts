import type { CalendarTimelineMode } from "@/features/calendar/data"
import {
  clockHourAtFocalPoint,
  focalPreservingRawOffset,
  fullDayContentHeight,
  resolvePixelsPerHour,
  usableViewportCenterY,
} from "@/features/calendar/data"

export type TimedViewportGeometry = {
  width: number
  height: number
  topInset: number
  bottomInset: number
}

export type CalendarResizeSnapshot = {
  dateIdentity: string
  mode: CalendarTimelineMode
  rendererGeneration: number
  geometryRevision: number
  geometry: TimedViewportGeometry
  pixelsPerHour: number
  rawOffset: number
  clockAnchor: number
}

export type CalendarResizePresentation = Pick<
  CalendarResizeSnapshot,
  "dateIdentity" | "mode" | "rendererGeneration" | "pixelsPerHour" | "rawOffset"
>

const finiteNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(value, 0) : 0

export function normalizeTimedViewportGeometry(
  geometry: TimedViewportGeometry,
): TimedViewportGeometry {
  const width = finiteNonNegative(geometry.width)
  const height = finiteNonNegative(geometry.height)
  const topInset = Math.min(finiteNonNegative(geometry.topInset), height)
  const bottomInset = Math.min(
    finiteNonNegative(geometry.bottomInset),
    height - topInset,
  )
  return { width, height, topInset, bottomInset }
}

const sameGeometry = (
  left: TimedViewportGeometry,
  right: TimedViewportGeometry,
): boolean =>
  left.width === right.width &&
  left.height === right.height &&
  left.topInset === right.topInset &&
  left.bottomInset === right.bottomInset

export function replaceCalendarViewportGeometry(
  previous: CalendarResizeSnapshot | null,
  nextGeometryInput: TimedViewportGeometry,
  presentation: CalendarResizePresentation,
): CalendarResizeSnapshot {
  const geometry = normalizeTimedViewportGeometry(nextGeometryInput)
  if (previous && sameGeometry(previous.geometry, geometry)) return previous

  const pixelsPerHour = resolvePixelsPerHour(presentation.pixelsPerHour)
  const oldGeometry = previous?.geometry ?? geometry
  const oldCenter = usableViewportCenterY(
    oldGeometry.height,
    oldGeometry.topInset,
    oldGeometry.bottomInset,
  )
  const nextCenter = usableViewportCenterY(
    geometry.height,
    geometry.topInset,
    geometry.bottomInset,
  )
  const clockAnchor = clockHourAtFocalPoint(
    presentation.rawOffset,
    oldCenter,
    pixelsPerHour,
  )
  const rawOffset = focalPreservingRawOffset({
    rawOffset: presentation.rawOffset,
    focalY: oldCenter,
    nextFocalY: nextCenter,
    oldPixelsPerHour: pixelsPerHour,
    newPixelsPerHour: pixelsPerHour,
    geometry: {
      contentHeight: fullDayContentHeight(pixelsPerHour),
      viewportHeight: geometry.height,
      topInset: geometry.topInset,
      bottomInset: geometry.bottomInset,
    },
  })

  return {
    ...presentation,
    pixelsPerHour,
    rawOffset,
    clockAnchor,
    geometry,
    geometryRevision: (previous?.geometryRevision ?? 0) + 1,
  }
}
