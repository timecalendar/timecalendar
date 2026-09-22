export const POINT_MARKER_SIZE = 4
export const IOS_MINIMUM_EVENT_TARGET = 44
export const ANDROID_MINIMUM_EVENT_TARGET = 48

export interface VerticalGeometry {
  top: number
  height: number
}

export function eventVisualGeometry(input: {
  shape: "point" | "interval"
  startMinute: number
  endMinute: number
  pixelsPerHour: number
}): VerticalGeometry {
  "worklet"
  const top = (input.startMinute / 60) * input.pixelsPerHour
  return input.shape === "point"
    ? { top: top - POINT_MARKER_SIZE / 2, height: POINT_MARKER_SIZE }
    : {
        top,
        height:
          ((input.endMinute - input.startMinute) / 60) * input.pixelsPerHour,
      }
}

export function eventInteractionGeometry(input: {
  visual: VerticalGeometry
  dayHeight: number
  platform: "ios" | "android"
}): VerticalGeometry {
  "worklet"
  const minimum =
    input.platform === "ios"
      ? IOS_MINIMUM_EVENT_TARGET
      : ANDROID_MINIMUM_EVENT_TARGET
  const height = Math.min(
    input.dayHeight,
    Math.max(input.visual.height, minimum),
  )
  const center = input.visual.top + input.visual.height / 2
  return {
    top: Math.max(0, Math.min(center - height / 2, input.dayHeight - height)),
    height,
  }
}
