## Why

Calendar management currently reserves its shared page inset outside the virtualized list, so scrolled content disappears below a persistent empty band rather than directly beneath the native header. The Rename affordance also lacks platform iconography and opens a custom cross-platform card whose text field and actions do not use the native SwiftUI and Material 3 controls now available behind the mobile chrome seam.

## What Changes

- Make the calendar-management `FlatList` own its first-content inset so the initial caption keeps the shared page rhythm while scrolled rows clip directly beneath the native header.
- Preserve loading, empty, populated, error, refresh, bottom-safe-area, tablet-lane, and platform add-action geometry while removing the list-only outer top band.
- Add a platform-appropriate Rename icon to the existing native overflow-menu action: an SF Symbol on iOS and a Material Symbol asset on Android.
- Replace the app-styled rename card, `TextInput`, and `Pressable` actions with one controlled text-entry dialog contract whose iOS and Android compositions use native SwiftUI and Material 3 controls behind `@/components/chrome`.
- Preserve the shipped rename mutation, validation, retry, persistence, cache, localization, accessibility, selectors, success announcement, and explicit-dismissal semantics.
- Extend the Architecture Book, add a load-bearing native-dialog seam decision, and record non-blocking physical-device verification for keyboard, rotation, Dynamic Type, and assistive technology.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-user-calendars`: Refine list scrolling geometry, native menu iconography, and the controlled rename dialog's platform-native presentation without changing calendar data behavior.

## Impact

The change affects calendar-management UI and tests under `mobile/src/features/calendar-sources/ui/`, the `mobile/src/components/chrome/` wrapper and its Jest mocks, one bundled Android menu icon asset, and current-state Architecture Book/ADR/changelog/inbox documentation. It adds no dependency and changes no API contract, generated client, persistence schema or migration, native/store/EAS/Firebase configuration, deployment workflow, or legacy Flutter code.
