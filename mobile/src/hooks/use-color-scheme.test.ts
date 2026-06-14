import { renderHook } from "@testing-library/react-native"
import { useColorScheme as useDeviceColorScheme } from "react-native"

import { setThemePreference, SETTINGS_KEYS } from "@/features/settings/prefs"
import { remove } from "@/storage"

import { useColorScheme } from "./use-color-scheme"

// The C1 seam resolves the stored theme override against the device scheme:
// a stored "light"/"dark" wins, "system" falls through to the device value.
// The device scheme is driven by mocking react-native's useColorScheme.

// Mutate the actual module's useColorScheme rather than spreading it — spreading
// react-native enumerates its lazy native getters (FlatList, DevMenu) and forces
// them to evaluate off-device, which throws under jest-expo.
jest.mock("react-native", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native")
  RN.useColorScheme = jest.fn()
  return RN
})

const mockDeviceScheme = useDeviceColorScheme as jest.Mock

describe("useColorScheme (C1 override seam)", () => {
  beforeEach(() => {
    remove(SETTINGS_KEYS.theme)
    mockDeviceScheme.mockReturnValue("dark")
  })

  it("returns the device scheme when the preference is system", async () => {
    const { result } = await renderHook(() => useColorScheme())
    expect(result.current).toBe("dark")
  })

  it("returns the stored override when the preference is light or dark", async () => {
    setThemePreference("light")
    const light = await renderHook(() => useColorScheme())
    expect(light.result.current).toBe("light")
    light.unmount()

    // Override wins over the device scheme: set the device light, the pref dark.
    setThemePreference("dark")
    mockDeviceScheme.mockReturnValue("light")
    const dark = await renderHook(() => useColorScheme())
    expect(dark.result.current).toBe("dark")
    dark.unmount()
  })
})
