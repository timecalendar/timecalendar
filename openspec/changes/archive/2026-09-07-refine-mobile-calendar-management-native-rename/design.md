## Context

The shipped calendar-management route already uses compact native Stack chrome, a standard `RootPage` lane, and one id-keyed `FlatList`. `RootPage` currently contributes `Spacing.four` above the entire list owner. That produces the correct initial offset, but because the inset is outside the scroll view it remains visible after the list moves and creates an empty band below the header. The list header already owns the visibility caption, so it is the natural owner of the populated branch's first-content spacing.

Rename is currently a controlled React Native `Modal` containing an app-styled card, `TextInput`, and two `Pressable` actions. Its state and mutation semantics are correct: the draft is seeded once, empty names are legal, values longer than 100 trimmed characters are blocked, failures retain the draft, retries reuse it, persistence precedes the success announcement, and only cancel or success closes the dialog. Expo SDK 56 now exposes SwiftUI and Jetpack Compose primitives, but their platform-specific imports must remain behind `@/components/chrome` and their text-state and dialog APIs are not interchangeable.

The list/menu work is presentation-only. The dialog changes presentation and wrapper policy, not rename data behavior. The host cannot run an iOS simulator or accelerated Android emulator, so focused Jest/static checks are local and physical rendering evidence is recorded as a non-blocking human-device note.

## Goals / Non-Goals

**Goals:**

- Make initial and scrolled list geometry both correct without changing virtualization, state branches, tablet centering, bottom clearance, or platform add actions.
- Give Rename an SF Symbol on iOS and a Material Symbol on Android while preserving the same localized label and action id.
- Provide a controlled cross-platform text-entry dialog contract whose actual text entry and actions are native SwiftUI or Material 3 controls.
- Preserve every shipped validation, persistence, retry, selector, accessibility, localization, and observability guarantee.
- Keep every alpha Expo UI import and platform-specific presentation choice inside the chrome seam.

**Non-Goals:**

- No server rename, generated API, cache, sync, SQLite, selector, or translation-semantics change.
- No delete, visibility, row, add-action, global `RootPage`, global root-screen, or unrelated-form redesign.
- No new dependency, native plugin/configuration, store/EAS/Firebase, deployment/CI, migration, or legacy Flutter edit.
- No claim of visual parity between SwiftUI and Material 3, and no custom restyling of their native controls.

## Decisions

## Decision 1 — Move only the populated branch's top inset into scrollable list content

Calendar management opts out of `RootPage`'s outer `paddingTop` for this route. The populated `FlatList` receives `paddingTop: Spacing.four` in its `contentContainerStyle`; its existing `PageIntro` remains `ListHeaderComponent`, so the initial caption begins at the same shared first-content inset. Once the user scrolls, that padding and caption move with the list, allowing content to clip at the page boundary directly below the native header.

The screen retains one `RootPage`, its measured standard lane, horizontal gutters, non-header safe-area edges, `FlatList`, row gap, ordinary bottom padding, and Android FAB clearance. The accessible write-error notice receives the same explicit top inset when present outside the list. The unresolved branch remains blank, and the loaded-empty branch remains centered within the available lane; neither gains a second scroller or a synthetic header spacer.

Changing `RootPage` globally was rejected because ordinary non-list routes still require its first-content rhythm. Applying a negative margin to the list was rejected because it obscures ownership and becomes fragile under safe-area/header changes. Keeping the padding outside the list was rejected because it is the defect.

## Decision 2 — Supply platform-specific menu images through the existing action object

The Rename menu action keeps id `rename` and the existing localized title. On iOS its `image` is the SF Symbol `pencil`. On Android its `image` is a bundled monochrome asset derived from the Material Symbols `drive_file_rename_outline` glyph and passed as the `ImageSourcePropType` that `MenuView` requires. The asset is presentation-only, uses native menu tinting, and carries source/license attribution with the other repository asset records if required by the chosen source.

A plain symbol string on Android was rejected because the community menu contract renders such strings only as SF Symbols on iOS. Adding visible icon text to the localized action label was rejected because it changes the accessible name. Replacing the menu library was rejected because the existing seam already supports Android image sources.

## Decision 3 — Add one composed native text-entry dialog contract to the chrome seam

Add a generic `NativeTextEntryDialog` under `mobile/src/components/chrome/`, exported through the existing barrel. Its stable props express product-neutral dialog state: title, initial value, field label and placeholder, inline message, cancel/submit labels, pending/disabled state, stable identifiers, value-change notification, submit-with-current-value, and cancel. A single public component selects private iOS and Android renderers; feature code never imports `@expo/ui` directly or branches on native primitive APIs.

This is intentionally the first composed control in a seam that previously only re-exported thin primitives. Composition is necessary because exposing SwiftUI `Alert`/`TextField` and Compose `AlertDialog`/`OutlinedTextField` would leak incompatible alpha APIs and presentation semantics into the feature. The Architecture Book and a new ADR record this narrow exception: compose only when a stable cross-platform behavior contract must adapt materially different native APIs; do not turn chrome into a generic design system.

Re-exporting every platform primitive was rejected because the feature would own alpha churn and platform branching. Making the wrapper calendar-specific was rejected because validation and persistence belong to the feature. Using one universal React Native card was rejected because its editable and action controls are the surface being replaced.

## Decision 4 — Keep native input state local to the mounted wrapper and form logic in the feature

`RenameCalendarDialog` remains mounted only while a calendar is selected and continues to own the rename mutation, validation rule, translated copy, error choice, success announcement, and close lifecycle. It passes the trimmed current name as `initialValue` to `NativeTextEntryDialog`. The wrapper creates one Expo native observable text state for that mount and forwards changes to the feature for validation; submit reads the current native buffer and passes that exact value back to the feature. The save handler rechecks the trimmed-length predicate so a queued or asynchronous change event cannot bypass validation.

The native buffer is not rebound to `useUserCalendars()` or reset on rerender. Pending/error prop changes therefore do not replace the typed draft. On retry the same buffer is submitted. Empty and whitespace-only values remain legal, while the data seam continues to trim before sending. If cancel closes a pending dialog, a late completion must not issue a second close or success announcement after the dialog has unmounted; the underlying mutation/cache behavior remains unchanged.

Binding the input to the reactive SQLite row was rejected because async round trips can drop fast input. Capping the native field with `maxLength={100}` was rejected because the legal rule measures the trimmed value and existing over-limit feedback must remain visible rather than silently truncating input.

## Decision 5 — Use native composition appropriate to each operating system

On iOS, an over-full-screen React Native modal supplies background isolation and keyboard-avoiding viewport geometry while a SwiftUI `Host` composes the native title/message text, `TextField`, progress state, and `Button` actions. The composition remains readable at compact width and Dynamic Type sizes, and its stable accessibility identifiers map to the existing `user-calendar-rename-*` selectors. The backdrop is inert; only the native Cancel button or successful save dismisses it.

A SwiftUI `Alert` was rejected: alert actions dismiss immediately, so a failed async save cannot retain the visible field and error. `Alert.prompt` was also rejected because it is iOS-only and has the same lifecycle problem.

On Android, a Compose `Host` renders Material 3 `AlertDialog`, `OutlinedTextField`, text/progress, and native text buttons. `dismissOnClickOutside` is false. Hardware Back is enabled and `onDismissRequest` is treated as the explicit cancel path. Material dialog/window insets keep the field and both actions reachable above the IME; the implementation uses platform width and keyboard inset behavior rather than an app-styled absolute footer.

Both renderers use system light/dark appearance and typography instead of forcing app card tokens onto native controls. Platform-specific native modules receive suite-wide Jest mocks that preserve callbacks, state, disabled/busy semantics, and stable identifiers for focused tests.

## Decision 6 — Test ownership follows the behavior boundary and device gaps stay explicit

The calendar-management suite proves initial top inset, scrolled-list ownership, error/empty/populated geometry, tablet lane, bottom/FAB clearance, menu labels/icons on both platforms, and unchanged row actions. The feature rename suite drives the chrome contract to prove seeding, trimmed-length validation, legal empty values, pending single-flight behavior, retained failure/retry draft, cancel, persistence-gated announcement, and no post-cancel late announcement.

A focused chrome suite renders both platform branches with package mocks and proves native primitive selection, test identifiers, inline message, disabled/busy state, iOS inert backdrop/focus isolation, Android outside-tap policy and hardware-Back cancel, plus compact/rotation-safe ownership. Existing data-layer tests remain the authority for request trimming, server-response persistence, cache updates, and observability.

Update `theming.md`, `accessibility.md`, `testing.md`, the calendar-sources entry in `features.md`, `CHANGELOG.md`, and a new ADR for the composed chrome exception. Add a dated `(HUMAN: …)` migration-inbox note for real iOS/Android keyboard, rotation, Dynamic Type, VoiceOver/TalkBack focus, outside-tap, and Back behavior. The note is evidence debt, not a merge gate.

## Risks / Trade-offs

- [Moving the outer inset disturbs empty/error or tablet geometry] → Scope the zero-top override to calendar management, add top spacing to each non-list visible branch that needs it, and assert concrete lane/content styles for every state.
- [Native observable text and React validation drift for one event] → Submit the wrapper's current native buffer and repeat the validation predicate inside the submit handler.
- [A native alert-like control dismisses before persistence settles] → Do not use SwiftUI `Alert`; keep iOS presentation controlled by the mounted modal and Android `AlertDialog` controlled by props.
- [Cancel races an in-flight success] → Mark the mounted attempt inactive on cancel and suppress late UI effects while leaving the existing mutation/cache contract intact.
- [Native alpha APIs change] → Keep all imports, modifiers, and platform branching in one chrome module with focused wrapper tests and a lint-enforced boundary.
- [Off-device mocks overstate accessibility or keyboard behavior] → Test state/structure locally, record device-only checks explicitly, and avoid claiming physical proof from Jest.
- [A raster menu icon looks wrong under native tinting] → Use a single-color Material Symbols source at appropriate density and verify menu rendering in both schemes on device.

## Migration Plan

1. Add the platform-specific native dialog wrapper, Jest mocks, and focused chrome contract tests.
2. Move rename form orchestration onto that wrapper while retaining the current mutation/data seam and selectors.
3. Add the platform menu icons and focused row/menu assertions.
4. Move calendar-management top spacing into list/state content and prove initial, scrolled, empty, error, tablet, safe-area, and FAB geometry.
5. Update Architecture Book guidance, ADR/changelog, and the non-blocking device-pass note.
6. Run focused tests, TypeScript, lint, React Doctor on changed code, full coverage, strict OpenSpec validation, disclosure/scope review, and use the normal mobile CI job as the exact-head CI proof.

Rollback is a normal revert. No persisted data, API, generated code, or native configuration changes require cleanup.

## Open Questions

None blocking. Exact SwiftUI/Compose modifier names may follow the installed Expo SDK 56 typings, but the wrapper contract, dismissal rules, ownership, and verification obligations above are fixed.
