import { requireNativeView } from "expo"
import type { ComponentType } from "react"

import type { CalendarFocusObserverViewProps } from "./calendar-focus-observer.types"

const NativeView: ComponentType<CalendarFocusObserverViewProps> =
  requireNativeView("CalendarFocusObserver")

export default function CalendarFocusObserverView(
  props: CalendarFocusObserverViewProps,
) {
  return <NativeView {...props} />
}
