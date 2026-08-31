## Context

`PersonalEventFormScreen` currently binds `personal-event-delete` directly to an async `onDelete()` that calls `useDeleteEvent().remove(uid)` and navigates back on success. The hook already provides the correct persistence and observability contract through `useRecordedAction`: a repository rejection is recorded, `failed` drives `WriteErrorNotice`, and a later successful retry clears the flag. The missing safety boundary is entirely at the UI edge.

Personal events are durable, device-local data with no server backup. The change must therefore distinguish the user's intent to open a destructive prompt from the separately confirmed write, and it must serialize the latter. The form must stay open and populated for cancellation and failure. React Native's native `Alert` is already the established confirmation pattern in the app and provides platform-native presentation and system accessibility behavior without a new dependency or route.

## Goals / Non-Goals

**Goals:**

- Require an explicit, localized confirmation before the personal-event repository delete is invoked.
- Make cancellation and every supported passive dismissal a no-write path that leaves the edit form open.
- Serialize confirmation callbacks synchronously so only one repository request can be active and only one successful navigation can occur.
- Preserve the current visible and recorded failure behavior, and allow a fresh confirmation/retry after failure.
- Prove the contract at the component boundary and through the existing real-SQLite Maestro round-trip.

**Non-Goals:**

- No undo, soft delete, bulk delete, synced-event deletion, reminder work, or navigation redesign.
- No repository, schema, API, generated-client, migration, dependency, native/store configuration, or legacy Flutter change.
- No new cross-feature confirmation abstraction: this is a leaf interaction with one call site.
- No claim that physical-device VoiceOver/TalkBack checks ran on this host; those checks are recorded for human execution in the migration inbox.

## Decisions

### Decision 1 — Use React Native `Alert.alert` as the confirmation boundary

Pressing `personal-event-delete` will call `Alert.alert` with a localized title and body that explicitly name permanent event deletion. The button array will place a localized Cancel action first with `style: "cancel"` and a localized Delete action second with `style: "destructive"`. Android alert options will allow native back/outside dismissal and use `onDismiss` only to return the local prompt guard to idle; it will never write. On iOS, the system alert and cancel-style action retain native focus, ordering, announcement, and accessibility-escape behavior.

The explicit title/body and button text carry the destructive meaning independently of red styling, satisfying users who cannot perceive color. A custom modal was rejected because it would add focus trapping, escape handling, platform styling, and overlay behavior that the native alert already owns. Reusing a shared app abstraction was rejected because no existing abstraction encodes this single-flight form-navigation contract, and introducing one for one leaf site would exceed the scope.

### Decision 2 — Guard prompt and request phases in the screen with a synchronous ref

The screen will own a small phase guard such as `idle | prompting | deleting` in a ref. The initial Delete press moves `idle → prompting` before opening the alert, preventing duplicate prompts. Cancel and native dismissal move `prompting → idle`. The destructive callback proceeds only from `prompting`, moves synchronously to `deleting` before awaiting `remove(uid)`, and ignores all later callbacks while that request is pending. A render state mirrors the deleting phase so the underlying Delete control exposes disabled/busy state and cannot open another prompt.

A ref is required for correctness because two callbacks can run before a React state update commits; state alone is not a mutual-exclusion guard. Moving this guard into `useDeleteEvent` was rejected: the hook correctly owns repository invocation and recorded failure state, while prompt lifecycle and exactly-once route closure belong to this screen. The hook should change only if implementation proves its existing contract cannot support retry, which current code and tests show it can.

### Decision 3 — Navigate only from the single guarded success path and always release after failure

The confirmed callback awaits `del.remove(uid)`. A `true` result calls `router.back()` once from that guarded callback. A `false` result performs no navigation; the existing event values and `WriteErrorNotice` stay mounted. Completion releases the local guard so a failed request can be retried through a new alert. The callback must not clear or rebuild form state, and cancellation must not touch the hook at all.

### Decision 4 — Test the native boundary by capturing alert callbacks, then retain real-device evidence separately

The component suite will spy on `Alert.alert`, press `personal-event-delete`, and invoke the captured cancel/destructive/onDismiss callbacks. Tests will prove: opening does not write; cancel and passive dismissal do not write or navigate; confirm passes the uid; repeated destructive callbacks while a deferred promise is pending produce one write; success navigates once; failure does not navigate, preserves the visible error, releases the guard, and permits a successful retry.

The Maestro flow will create and open a uniquely titled event, press Delete, tap Cancel, assert the edit form and event remain, return/reopen as needed, then press Delete and confirm Delete before asserting the list no longer contains the title. Static/off-device validation will check the YAML/wrapper shape, while definitive native execution remains the post-merge `main` workflow because this host has no KVM or iOS simulator. Physical-device focus, announcements, escape/back dismissal, and native presentation will be recorded in a `(HUMAN: ...)` inbox note and will not be represented as passed.

## Risks / Trade-offs

- **[Native alert behavior differs slightly by platform]** → Use only the cross-platform title/message/two-action contract, explicitly configure Android dismissal, and record both-platform assistive-technology checks in the inbox.
- **[A state-only pending flag admits two synchronous confirmations]** → Set the ref phase before the first await and make every callback validate the expected phase.
- **[A stale prompt guard could prevent retry after cancel, dismissal, or failure]** → Reset the guard in every non-success exit and cover each reset path with callback-level component tests.
- **[Maestro selects localized native alert text]** → Run the established E2E device locale (English), use exact stable action copy, and anchor surrounding steps with existing test IDs and the unique event title.
- **[Underlying form control remains reachable to assistive technology while a native alert is open]** → Rely on the system modal alert's focus behavior; confirm VoiceOver/TalkBack focus containment and escape behavior on physical devices.

## Migration Plan

No data or runtime migration is required. The change is additive UI logic and catalog copy. Rollback is a normal code revert; stored personal events and their schema are unchanged.

## Open Questions

None. The Founding Engineer brief resolves copy localization, dismissal semantics, verification scope, device-only evidence, and the absence of a separate QA gate.
