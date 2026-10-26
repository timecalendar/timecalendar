import { renderHook } from "@testing-library/react-native"
import { createElement, type ReactNode } from "react"

import { resolveEventAppearance } from "@/theme"

import {
  EventSurfaceContext,
  useEventSurfaceAppearance,
} from "./event-surface-context"

describe("useEventSurfaceAppearance", () => {
  it("is undefined outside an event surface", async () => {
    const { result } = await renderHook(() => useEventSurfaceAppearance())
    expect(result.current).toBeUndefined()
  })

  it("returns the provided appearance inside one", async () => {
    const appearance = resolveEventAppearance({
      color: "#009688",
      scheme: "dark",
      increasedContrast: false,
    })
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        EventSurfaceContext.Provider,
        { value: appearance },
        children,
      )
    const { result } = await renderHook(() => useEventSurfaceAppearance(), {
      wrapper,
    })
    expect(result.current).toBe(appearance)
  })
})
