import type { GalleryPlatform } from "./types"

export type KnownA11yViolation = {
  story: string
  platform: GalleryPlatform
  // The element's testID, or `<nearest ancestor testID> > <role or type>`.
  element: string
  problem: string
  reason: string
  inbox: `docs/react-native-migration/inbox/${string}.md`
}

const ANDROID_SWITCH_ROW_INBOX =
  "docs/react-native-migration/inbox/2026-10-25-mobile-design-system-gallery-device-pass.md"
const ANDROID_SWITCH_ROW_REASON =
  "Compose stops the row's merged semantics at the trailing MaterialSwitch: Expo UI's SwitchView always passes a non-null onCheckedChange, so the unlabeled Switch is a second TalkBack focus stop inside the toggleable row."

// registry.test.ts fails on any violation missing from this list and on any
// entry that no longer reproduces, so the list can only shrink.
export const knownA11yViolations: readonly KnownA11yViolation[] = [
  {
    story: "native-settings--switches",
    platform: "android",
    element: "gallery-native-settings-switch-on > switch",
    problem: "missing label",
    reason: ANDROID_SWITCH_ROW_REASON,
    inbox: ANDROID_SWITCH_ROW_INBOX,
  },
  {
    story: "native-settings--switches",
    platform: "android",
    element: "gallery-native-settings-switch-off > switch",
    problem: "missing label",
    reason: ANDROID_SWITCH_ROW_REASON,
    inbox: ANDROID_SWITCH_ROW_INBOX,
  },
  {
    story: "native-settings--long-strings",
    platform: "android",
    element: "gallery-native-settings-long-switch > switch",
    problem: "missing label",
    reason: ANDROID_SWITCH_ROW_REASON,
    inbox: ANDROID_SWITCH_ROW_INBOX,
  },
]
