# Expo SDK 58 / iOS 27 readiness

Snapshot: 2026-09-18. Source: [Expo SDK 58 beta changelog](https://expo.dev/changelog/sdk-58-beta).

## Question

Can `mobile/` move from Expo SDK 56 to SDK 58 and build against the iOS 27 SDK (Xcode 27)?

## Verdict

Not yet. SDK 58 resolves the UIScene requirement natively, but two blockers remain. Nothing
forces the move today: the Xcode 26.6 command-line toolchain still builds the app, and Apple
requires the iOS 27 SDK for App Store uploads only from April 2027.

The upgrade is ready to start when both hold:

1. Expo SDK 58 is stable.
2. A `@react-native-firebase/*` release contains
   [invertase/react-native-firebase#9321](https://github.com/invertase/react-native-firebase/pull/9321).

It runs as a revisit of ADR 001 (runtime baseline).

## Baseline

| | `mobile/` | SDK 58 |
| --- | --- | --- |
| `expo` | `~56.0.11` | `58.0.0-preview.3` (`next` tag) |
| `react-native` | `0.85.3` | `0.88.0-rc.1` |
| `react` | `19.2.3` | `19.3.0` |
| `react-native-gesture-handler` | `~2.31.1` | `~3.2.1` |
| `react-native-reanimated` | `4.3.1` | `4.6.0` |
| `react-native-worklets` | `0.8.3` | `0.12.2` |
| `react-native-screens` | `4.25.2` | `~4.28.0` |
| `react-native-pager-view` | `8.0.1` | `9.0.4` |
| `react-native-safe-area-context` | `~5.7.0` | `~5.9.1` |
| `@react-native-firebase/*` | `^24.1.1` | not bundled (latest `26.4.0`) |
| Xcode | 26.6 | 27 required |

SDK 58 column: `packages/expo/bundledNativeModules.json` on `expo/expo` `main` and npm dist-tags.

## Why iOS 27 forces an SDK bump

Apps built with the iOS 27 SDK must use the UIScene life cycle (Apple TN3187). It is a
build-time gate with no `Info.plist` opt-out; a window-only app fails at launch with
"UIScene life cycle is required for apps built with this SDK".

- SDK 56 generates an AppDelegate/window-only project and has no UIScene path.
- SDK 57 has no built-in support. The backport PR
  [expo/expo#50026](https://github.com/expo/expo/pull/50026) is closed unmerged. Expo's SDK 57
  answer is the experimental opt-in plugin `@config-plugins/expo-uiscene-lifecycle`
  ([expo/config-plugins#326](https://github.com/expo/config-plugins/pull/326)), which is
  SDK 57-only and rejects SDK 58+.
- SDK 58 `expo prebuild` generates `SceneDelegate.swift` and a `UIApplicationSceneManifest`
  entry. `UIWindow` creation lives in the scene delegate.

SDK 57 plus the stopgap plugin is a detour onto an experimental plugin with no future. The
target is SDK 58 directly.

## Blockers

### 1. react-native-firebase config plugins lose their anchors

The SDK 58 `AppDelegate.swift` no longer sets `moduleName`, no longer calls
`factory.startReactNative`, no longer declares `application(_:open:options:)`, and writes
`internal import Expo`. Every insertion point the RNFB iOS config plugins match on is gone.

The fix is [invertase/react-native-firebase#9321](https://github.com/invertase/react-native-firebase/pull/9321):
open, changes requested on 2026-09-16, unreleased. `26.4.0` does not contain it.

`mobile/app.config.ts` registers `@react-native-firebase/app`, `crashlytics`, `analytics` and
`messaging`. Per the PR description, the `app` plugin on SDK 58 only warns:

```
» @react-native-firebase/app: Unable to determine correct Firebase insertion point in AppDelegate.swift. Skipping Firebase addition.
```

The hard `✖ Prebuild failed` in that report comes from the `auth` plugin, which this app does
not use. The expected failure here is therefore silent: prebuild succeeds,
`FirebaseApp.configure()` is never injected, and Crashlytics, Analytics and Messaging are dead
at runtime. This is read from the PR description and is not reproduced against this project.

Any upgrade attempt must assert that the generated `ios/**/AppDelegate.swift` contains
`FirebaseApp.configure()`.

### 2. SDK 58 is a beta on a React Native release candidate

`expo@next` is `58.0.0-preview.3` on `react-native@0.88.0-rc.1`. The beta opened on
2026-09-15 and runs "three to four weeks"; stable ships shortly after React Native 0.88
stable. The changelog's known-issues section is empty because the beta is days old.

## Migration work (not blockers)

**CI toolchain.** `.github/workflows/ci-mobile-e2e.yml` pins `runs-on: macos-26`, which has no
Xcode 27. The `actions/runner-images` repository carries an `xcode-27-arm64` image readme; the
runner label and its availability are unverified.

**EAS cloud images.** Xcode 27 images are "coming soon"; the EAS default is Xcode 26.6. Store
binaries build with `eas build --local` on a host that already has Xcode 27, so this does not
gate releases.

**Two-SDK jump.** 56 to 58 spans React Native 0.85 to 0.88. Expo recommends upgrading one SDK
at a time.

**`react-native-gesture-handler` 3.x.** A major version. The calendar grid's pinch zoom uses
the `Gesture` builder, `GestureDetector`, `GestureType` and `State`. This is the highest
regression risk in the upgrade.

**`requireFullScreen`.** `mobile/app.config.ts` sets `requireFullScreen: true`. On iOS 27 it
no longer opts the app out of iPad window resizing, so every screen must hold up at arbitrary
window sizes.

**`@expo/ui`.** Used in 12 files under `mobile/src`. The iOS `<Host>` top-aligns instead of
centering and spacing defaults change. `backgroundOverlay` is deprecated for `background`;
the `border` / `strokeBorder` `color` parameter is deprecated for `content`. Needs a visual
pass on device.

**`expo-router`.** The navigation core is reworked and custom navigators may need updates.
`mobile/src` has none (`withLayoutContext`, `createNavigatorFactory`, `useNavigationBuilder`
are unused). Native tabs and toolbars are stable in SDK 58.

**Strict TypeScript API.** React Native 0.87+ enforces the strict API and deep imports from
`react-native/Libraries/*` error. Four test files mock
`react-native/Libraries/Utilities/useWindowDimensions`:

- `src/features/export-guides/ui/guide-screens.test.tsx`
- `src/features/home/ui/today-timeline.test.tsx`
- `src/features/calendar-sources/ui/visibility-control.test.tsx`
- `src/components/adaptive-content.test.tsx`

**Unbundled native modules.** `react-native-mmkv` (`4.3.x`) and `react-native-nitro-modules`
(latest `0.37.1`, pinned `^0.35.9`) are not versioned by Expo. Their React Native 0.88
compatibility is unchecked.

**Node.** SDK 58 requires Node 22.13+, 24.3+ or 26+.

## No exposure

`mobile/src` does not use any of the removed or changed APIs below:

- `InteractionManager`, the `Touchable*` root exports
- `expo-sqlite` libSQL (`syncLibSQL()`, `libSQLOptions`, `useLibSQL`)
- `expo-file-system` (`File.write()` is async in SDK 58)
- `expo-notifications` (foreground notifications shown by default in SDK 58)

`mobile/app.config.ts` has no local config plugin that patches `AppDelegate.swift`.

## Operating policy until the upgrade

- Build iOS with the Xcode 26.6 command-line toolchain (`xcode-select` default):
  `expo run:ios`, CI on `macos-26`, and `eas build --local`.
- Xcode 27 stays installed side by side for its GUI (device pairing, "Connect via network").

## Optional early spike

A throwaway branch on `npx expo install expo@next --fix` with the Firebase plugins removed
surfaces the gesture-handler 3, `@expo/ui` and iPad-resizing breakage ahead of stable. It
proves nothing about Firebase and is not mergeable.

## Watch list

- [invertase/react-native-firebase#9321](https://github.com/invertase/react-native-firebase/pull/9321): merged and released
- React Native 0.88 stable, then Expo SDK 58 stable (`expo` `latest` dist-tag moves to `58.x`)
- [Expo SDK 58 beta changelog](https://expo.dev/changelog/sdk-58-beta) known-issues section
- GitHub-hosted macOS runner with Xcode 27
