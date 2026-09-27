import { renderHook } from "@testing-library/react-native"
import { HeaderHeightContext } from "expo-router/react-navigation"
import type { ReactNode } from "react"
import { Platform } from "react-native"

import { Colors } from "@/theme"

import {
  buildCompactRootScreenOptions,
  useHeaderOverlapInset,
} from "./root-screen-options"

const originalOS = Platform.OS
const originalVersion = Platform.Version

function setOS(os: typeof Platform.OS) {
  Object.defineProperty(Platform, "OS", { configurable: true, value: os })
}

function setVersion(version: string) {
  Object.defineProperty(Platform, "Version", {
    configurable: true,
    value: version,
  })
}

afterEach(() => {
  setOS(originalOS)
  setVersion(originalVersion as string)
})

describe("buildCompactRootScreenOptions", () => {
  it.each([
    ["26.0", Colors.light, "none"],
    ["26.0", Colors.dark, "none"],
    ["18.5", Colors.light, "systemChromeMaterial"],
    ["18.5", Colors.dark, "systemChromeMaterial"],
  ] as const)(
    "returns a transparent compact bar on iOS %s",
    (version, colors, headerBlurEffect) => {
      setOS("ios")
      setVersion(version)
      expect(buildCompactRootScreenOptions(colors)).toEqual({
        headerShown: true,
        headerLargeTitle: false,
        headerBackButtonDisplayMode: "minimal",
        headerTransparent: true,
        headerTintColor: colors.text,
        headerBlurEffect,
      })
    },
  )

  it.each([Colors.light, Colors.dark])(
    "returns a flat page-colored bar on Android",
    (colors) => {
      setOS("android")
      expect(buildCompactRootScreenOptions(colors)).toEqual({
        headerShown: true,
        headerLargeTitle: false,
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      })
    },
  )
})

describe("useHeaderOverlapInset", () => {
  const withHeader = (height: number | undefined) =>
    function HeaderHeight({ children }: { children: ReactNode }) {
      return (
        <HeaderHeightContext.Provider value={height}>
          {children}
        </HeaderHeightContext.Provider>
      )
    }

  it("returns the header height on iOS", async () => {
    setOS("ios")
    const { result } = await renderHook(useHeaderOverlapInset, {
      wrapper: withHeader(100),
    })
    expect(result.current).toBe(100)
  })

  it("returns 0 on iOS outside a header", async () => {
    setOS("ios")
    const { result } = await renderHook(useHeaderOverlapInset, {
      wrapper: withHeader(undefined),
    })
    expect(result.current).toBe(0)
  })

  it("returns 0 on Android, where the bar is opaque", async () => {
    setOS("android")
    const { result } = await renderHook(useHeaderOverlapInset, {
      wrapper: withHeader(100),
    })
    expect(result.current).toBe(0)
  })
})
