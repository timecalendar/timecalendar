## Context

The notification preferences already have the correct durable model and synchronization owner: MMKV stores `frequency`, `nbDaysAhead`, and `isActive`; T05's app-lifetime runtime observes dirty generations and exposes route-independent status and Retry. The remaining screen predates T01 and still renders a universal Expo UI menu, a React Native plus/minus stepper, and a React Native switch inside `RootPage`.

T01 established `NativeSettingsHost`, `NativeSettingsSection`, `NativeSettingsRow`, `NativeSettingsSwitchRow`, `NativeSettingsChoiceRow`, and `NativeSettingsRadioDialog` under `@/components/chrome`. On iOS the host owns one SwiftUI `Form`; on Android it owns one Material `LazyColumn`; Expo Router remains the only navigation owner. The installed SDK also exposes buffered SwiftUI and Compose text fields with numeric keyboard hints, but a numeric keyboard does not validate content. The existing `NativeTextEntryDialog` deliberately renders an iOS custom overlay for mutation workflows and therefore is not the approved custom-days sheet.

The generated subscription DTO and server behavior are fixed: frequency remains `immediately | hourly | daily`, horizon remains an integer from 1 through 30, immediate work drains every five minutes, and daily work drains at 19:00 Europe/Paris. No GET, revision field, or server schedule change is available or needed.

## Goals / Non-Goals

**Goals:**

- Deliver one complete native notification settings journey using T01's presentation boundary and T05's preference/status contract.
- Preserve every valid stored horizon, including nonpreset values, and give preset-equivalent values a stable single selected state.
- Make cancellation and dismissal write-free; make each committed selection or confirmed custom value produce exactly one local preference mutation.
- Keep validation pure, localized, accessible, and independent of keyboard behavior.
- Keep one Router owner and one native scroll/inset owner per page, with platform-specific choice flows hidden behind project-owned chrome contracts.
- State subscription intent, schedule, processing cadence, and calendar-change horizon truthfully in French and English.

**Non-Goals:**

- Change notification permissions, prompt timing, categories, system-settings links, local reminders, delivery guarantees, or server scheduling.
- Change preference keys/defaults, synchronization runtime semantics, the DTO/OpenAPI/generated client, database schema, or server code.
- Replace the generic text-entry dialog used by other features or reproduce its iOS overlay.
- Add a fourth Maestro journey, a new native dependency/plugin, or a separate visual-QA ticket.

## Decision 1 — The parent becomes a native settings page and status presentation is reusable

Recompose `NotificationSettingsScreen` with `NativeSettingsHost` and native sections. One section contains the subscription-intent switch and explanatory copy; another contains value/navigation rows for Frequency and Days ahead; a final feature-owned status presenter consumes the same `useNotificationPreferences()` status union and Retry command used today. The notification UI layer may reuse that status presenter on pushed iOS choice pages so pending/error feedback does not become route-local or disappear during navigation.

On iOS, the frequency and horizon rows are navigation rows that push thin feature-owned routes. On Android, they are action rows that open Material radio dialogs without disclosure decoration. Turning the subscription off changes only `isActive`; frequency and horizon rows remain enabled and keep their values. The parent summaries always derive from canonical stored preferences, never from dialog drafts.

`RootPage`, React Native `ScrollView`, the universal `Picker`, the React Native `Switch`, and the custom stepper leave this screen. This follows ADR 060's one-scroll-owner contract instead of adding a second settings composition. Keeping the old controls beside the native rows was rejected because it would ship an incomplete migration and retain two interaction models on one page.

## Decision 2 — Frequency and horizon share choice models but not navigation mechanics

Define feature-owned immutable option models that map frequency values and horizon tokens to typed translation keys. Frequency has exactly three values. Horizon has preset tokens for 1, 3, 7, 14, and 30 plus `custom`; the selected token is a pure derivation: a stored preset maps to that preset and every other valid stored integer maps to Custom. Parent and chooser labels format the effective number through i18next pluralization.

On iOS, Router-owned `/notification-frequency` and `/notification-days-ahead` pages render `NativeSettingsChoiceRow`s inside one native host. Choosing frequency or a preset calls the existing setter once and returns to the parent; native Back before choosing writes nothing. Choosing Custom only opens the custom sheet and does not synthesize or persist a horizon.

On Android, the parent opens `NativeSettingsRadioDialog`s. Choosing frequency or a preset commits once and dismisses the dialog. Choosing Custom dismisses the choice dialog and opens the numeric editor initialized from the effective saved value; Cancel, outside dismissal of choice dialogs, and hardware Back write nothing. String tokens are used at the dialog boundary, while the feature maps preset tokens back to numbers before persistence.

A single universal select was rejected because it violates the approved platform journeys. Passing selected values in route parameters was rejected because the MMKV hook is already canonical and route parameters could become stale after another local update.

## Decision 3 — Custom days uses a settings-specific buffered numeric editor

Add a project-owned numeric-entry composition under `@/components/chrome` rather than reusing the existing iOS overlay. The public contract accepts translated title/label/actions, the initial string, validation message, identifiers, and cancel/submit callbacks. Chrome owns SwiftUI/Compose primitives, the native observable buffer, numeric keyboard hints, focus/keyboard layout, and delivery of the current native buffer on submit. The notifications feature owns parsing, error selection, commit policy, and route/dialog state.

On iOS, `/notification-days-custom` is registered as a Router `formSheet` with a native grabber and an appropriate detent. Its feature screen renders a SwiftUI form editor with explicit Cancel and Done actions. Router owns presentation and swipe dismissal; unmount, Cancel, and swipe perform no preference write. On Android, a Material numeric dialog uses explicit Cancel and Save, routes hardware Back through cancel, and keeps outside taps inert so dismissal semantics remain deterministic. Opening either editor copies the current effective saved number to a local draft every time.

The pure validator trims surrounding whitespace, requires one or more ASCII decimal digits, converts without clamping, and accepts only an integer from 1 through 30. Blank, signs, decimal/comma fractions, exponent notation, pasted nonnumeric text, and out-of-range values return a localized validation state and cannot invoke `setNbDaysAhead`. Leading zeroes are accepted as decimal digits and persist their numeric value. Successful Done/Save calls the existing setter exactly once, then dismisses; reopening starts from the newly effective stored value. Native buffer reads on submit avoid relying on a possibly delayed React text snapshot.

Extending the generic mutation-oriented `NativeTextEntryDialog` was rejected because its iOS presentation is the explicitly excluded overlay and its pending/write-failure lifecycle is unrelated to an immediate local preference commit. A React Native `TextInput` sheet was rejected because the established settings boundary requires SwiftUI/Compose composition.

## Decision 4 — Existing setters and runtime remain the only commit path

All confirmed choices call `setFrequency`, `setNbDaysAhead`, or `setIsActive` from the existing notification data hook. No screen directly imports storage, the generated client, transport, or runtime instance. Because each setter marks intent dirty before writing and publishes once afterward, UI code must call a setter once per committed selection and never during open, draft edit, validation, cancel, Back, or swipe.

Tests spy on the hook-level setters for UI cardinality and retain the T05 data tests as proof of dirty-before-write, serialization, retry, route-independent status, and DTO assembly. The UI does not introduce optimistic shadow preference state: after a commit, reactive storage is the displayed truth. Failed remote synchronization therefore retains the local selection while shared error/Retry remains visible.

Creating a second route-scoped mutation or draft store was rejected because it would undo T05's ownership and make errors disappear when a child unmounts.

## Decision 5 — Copy describes intent and fixed processing, not permission or reminder timing

Typed FR/EN keys cover section titles, row summaries, all choices, Cancel/Done/Save, validation states, accessibility labels, and explanatory footers. The switch label and copy describe subscribing to calendar-change notifications without claiming OS authorization. Frequency descriptions say immediate changes are processed every five minutes and daily changes at 19:00 Paris time without promising exact delivery. Horizon copy explains how far ahead calendar changes are covered and does not describe an event reminder scheduled N days before class.

Day values use i18next `_one`/`_other` plural keys on the parent, chooser, and custom editor. Error copy differentiates blank/nonnumeric-or-fractional input from the 1–30 range failure where useful, while both prevent saving. Catalog parity remains compile-time enforced.

## Decision 6 — Layered proof updates the current Architecture Book without a new ADR

Pure tests cover preset classification and exact draft parsing at boundaries and invalid pasted forms. Chrome tests cover platform primitive selection, native buffer submission, numeric keyboard configuration, identifiers, selected accessibility state, and every dismissal callback. Feature tests cover both platform branches, all frequencies and presets, existing custom values including 1 and 30, off-state retention, open/cancel/reopen behavior, single setter calls, shared pending/error/Retry after child unmount, and translated summaries/copy. Route-structure tests pin thin exports, root registrations, iOS push pages, and the form-sheet options. A repository contract test continues to reject generated-client/storage ownership in UI.

Update navigation, accessibility, i18n, testing, feature/current-state guidance, the Architecture Book changelog, and the `mobile-fcm-subscription` spec. ADRs 056 and 060 already own the composed native boundary, so no new costly-to-reverse decision is introduced. Host automation does not claim sheet geometry, keyboard reachability, Dynamic Type, VoiceOver/TalkBack announcements, Material ripple, light/dark appearance, swipe/Back feel, or phone/tablet layout; those remain owner-led device acceptance under D05.

No new top-level Maestro flow is added because the fixed three-journey budget treats detailed notification settings as focused host-test plus owner-device evidence. The CI proof is an ordinary Jest contract/behavior suite discovered by `test-mobile` and mutation-checked by temporarily breaking a selected-state or commit-cardinality guard during implementation, then restoring it.

## Risks / Trade-offs

- [SwiftUI form-sheet sizing or keyboard placement differs across supported devices] → keep Router and native form ownership singular, use installed SDK contracts only, and leave exact phone/tablet/large-text behavior to owner device acceptance.
- [Native text callbacks lag behind fast typing before confirmation] → submit the chrome-owned observable buffer's current value rather than trusting only React draft timing.
- [Custom selection accidentally writes the previous number] → treat `custom` as navigation/presentation only and assert zero setter calls until a valid explicit submit.
- [A preset-equivalent custom value appears selected twice] → derive exactly one choice token from the canonical saved number; presets win over Custom.
- [Remote save failure is confused with permission denial] → reuse T05's sanitized status union and add schedule/intent copy that never names authorization as successful.
- [New routes drift from root inventory or create nested scroll/navigation] → add thin-route and root-registration assertions plus one-native-host ownership tests.
- [Numeric keyboards still allow unexpected pasted text] → validate the submitted string independently and never clamp rejected input into persistence.

## Migration Plan

1. Add pure option/validation helpers and extend project-owned native settings chrome/mocks for the buffered numeric editor.
2. Recompose the parent and Android dialogs, preserving existing preference/status hooks and verifying immediate single commits.
3. Add thin iOS frequency, horizon, and custom routes; register the selection pushes and native form sheet in the existing root Stack.
4. Add translations, focused behavior/contract tests, spec deltas, and Architecture Book current-state updates.
5. Run focused Jest suites, OpenSpec validation, then the complete mobile local gate. Verify every declared sensitive and out-of-scope path is unchanged.

Rollback can restore the old presentation without a data migration: all preferences keep their existing keys and values, T05's runtime remains compatible, and the DTO/server schedule are unchanged. The new routes hold no durable state.

## Open Questions

None blocking. Implementation may tune the iOS sheet detent and internal native spacing against the installed SDK and owner device evidence, but it must retain Router ownership, explicit confirmation, one native scroll owner, and write-free dismissal.
