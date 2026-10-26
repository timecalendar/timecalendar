import { createContext, useContext } from "react"

import type { EventAppearance } from "@/theme"

export const EventSurfaceContext = createContext<
  Readonly<EventAppearance> | undefined
>(undefined)

export function useEventSurfaceAppearance():
  | Readonly<EventAppearance>
  | undefined {
  return useContext(EventSurfaceContext)
}
