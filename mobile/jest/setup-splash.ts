// Mock expo-splash-screen's native module for the whole suite: importing the
// splash overlay calls preventAutoHideAsync() at module load and hideAsync() on
// mount, both of which hit native code that has no JS implementation off-device
// (like @react-native-firebase / expo-sqlite). Registered globally here,
// mirroring setup-firebase/setup-db; the proof test asserts the overlay renders
// and dismisses with these no-op'd. AccessibilityInfo's native reduced-motion
// read is mocked to false by default; the proof test overrides per-case to
// drive both branches (D2).
import { AccessibilityInfo, type EmitterSubscription } from "react-native"

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve()),
  setOptions: jest.fn(),
}))

jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false)
jest
  .spyOn(AccessibilityInfo, "addEventListener")
  .mockReturnValue({ remove: jest.fn() } as unknown as EmitterSubscription)
