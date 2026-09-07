## Context

ADR 054 and the `mobile-root-page-primitives` capability established `EmptyState`, `PrimaryAction`, and `KeyboardSafeActionLayout` as the semantic contracts for section states, filled body/footer actions, and focused forms. The recent root-route normalization kept page-specific polish out of scope, leaving five small inconsistencies: Settings uppercases localized section labels, About applies readable-lane padding inside an already-guttered standard lane, Home assembles two empty title/caption pairs independently, and Feedback plus Programme duplicate the shared action and keyboard composition.

The personal-event editor is the reference focused-form consumer and already composes `KeyboardSafeActionLayout` with `PrimaryAction`. Its form behavior and selectors need preservation, not another migration. The host cannot render native keyboards or rotate devices, so structural behavior is proved in focused component tests and real iOS/Android geometry remains a non-blocking device-pass item.

## Goals / Non-Goals

**Goals:**

- Apply the established semantic presentation contracts to the remaining named surfaces.
- Keep one responsive gutter per content lane and preserve About's wider grouped actions.
- Keep focused fields scrollable and primary actions in a sibling region immediately above the keyboard.
- Preserve native iOS/Android action placement where it intentionally differs.
- Preserve validation, mutation, navigation, persistence, observability, accessibility labels, translations, and selectors.

**Non-Goals:**

- No redesign or extension of the shared primitives unless implementation reveals a concrete incompatibility with the accepted ADR 054 API.
- No global header, route, tab, calendar management, or unrelated onboarding change.
- No new artwork, animation, dependency, styling runtime, or landscape/tablet-multitasking behavior.
- No API/generated-client, server/schema, persisted-data, native/store/EAS, deployment/workflow, secret, or legacy Flutter change.
- No new personal-event behavior; that screen is a regression exemplar in this change.

## Decisions

## Decision 1 — Preserve grouped hierarchy without transforming localized Settings copy

Remove `textTransform: "uppercase"` from `SettingsSection` and retain its `smallBold` semantic text, `textSecondary` color, horizontal inset, section gap, grouped surface, and platform radius. Translations remain the source of visible casing, including Calendars, Events, and Preferences.

Changing locale resources to compensate for a forced transform was rejected because casing is language-owned. Increasing weight, size, or spacing was rejected because the existing grouped surface and semantic label already establish hierarchy on both platforms.

## Decision 2 — About prose uses the standard lane's gutter and a gutterless readable cap

Keep `RootPage lane="standard"` as the single measured owner for About's grouped actions. Remove the nested `useAdaptiveLayout("readable")` gutter from the introductory copy and link-error content. Within the standard lane, center those prose blocks at a maximum width of `ResponsiveContentWidths.readable` while allowing them to use the full standard-lane content width on compact screens.

This produces exactly one horizontal responsive gutter: the standard outer lane supplies it, while the inner prose block supplies only its semantic maximum width. Grouped actions remain standard-width and unchanged. Moving all About content to a readable root lane was rejected because it would unnecessarily narrow grouped actions; retaining nested lane padding was rejected because it compounds phone and tablet gutters.

## Decision 3 — Home empty pairs consume the shared section-state hierarchy

Use `EmptyState variant="section"` for the true no-upcoming-events pair and the no-today-events pair. Both therefore inherit one `subtitle` title, secondary caption, `Spacing.two` gap, polite live-region semantics, and left alignment. The Upcoming `See all` action remains a sibling in the section header composition and keeps its current target size and route behavior. Non-empty Upcoming cards, finished-today copy, next-day card, all-day events, and timeline geometry remain unchanged.

A new global heading component was rejected because `EmptyState` already owns exactly this title/caption semantic. Centering or illustrating these compact states was rejected because they are section-level states within Home, not full-screen emptiness.

## Decision 4 — Feedback adopts the reference body/action sibling composition

Replace Feedback's local `KeyboardAvoidingView`/`ScrollView`/filled `Pressable` assembly with `KeyboardSafeActionLayout` and `PrimaryAction`. Use the render-function form of readable `RootPage` so it owns the safe-area surface while the keyboard-safe layout remains the sole measured lane, scroll owner, and keyboard owner. The scroll region keeps the intro, fields, validation errors, focus traversal, and multiline behavior. The sibling action region keeps the retryable submission error, localized primary action, and existing localized sending status.

`PrimaryAction` receives `busy={isPending}`, preserving duplicate-submission prevention while adding the established progress and accessibility semantics. Existing request construction, remembered e-mail timing, success alert/back navigation, failure retry, route-context normalization, and `feedback-*` selectors remain unchanged.

Keeping the action inside the scroll content was rejected because it can disappear behind or below the keyboard. Nesting a second responsive lane was rejected because it recreates the gutter defect being removed from About.

## Decision 5 — Programme shares the form owner while retaining native Skip placement

Use readable `RootPage` in render-function form around `KeyboardSafeActionLayout`, place the current `PageIntro`, field, and validation error in the scroll region, and render Continue as `PrimaryAction` in the sibling action region. `disabled={!canContinue}` preserves the only path to an empty programme name: the native Skip action. The iOS native header item and Android header `Pressable` remain feature-owned and unchanged in placement, sizing, label, and selector.

The existing normalization, length validation, draft update, Return-key submission, and route transition remain authoritative. Moving Skip into the body or representing it as a second `PrimaryAction` was rejected because it would change the accepted native hierarchy and make skipping appear equivalent to continuing.

## Decision 6 — Existing contracts and focused consumers are the CI proof

Extend the Settings, About, Home, Feedback, Programme, and personal-event component suites with structural and style assertions instead of snapshots. Platform-parameterized cases prove normal Settings casing, single-gutter About geometry, shared Home empty-state hierarchy, semantic action colors/targets/state, one scroll owner, body/action sibling separation, and iOS padding versus Android height keyboard behavior. Existing behavioral tests remain the proof for mutations, route parameters, CRUD, Skip/Continue, errors, and selectors.

ADR 054 already records the load-bearing decision, so no new ADR is added. Update the Architecture Book current-state topics and changelog to name the new consumers, and add one dated `(HUMAN: …)` inbox note for keyboard visibility, focus/blur, rotation within the supported portrait contract, Dynamic Type, VoiceOver/TalkBack, and both color schemes.

## Risks / Trade-offs

- [A shared form owner introduces a second measured gutter] → Use `RootPage`'s render-function form and make `KeyboardSafeActionLayout` the only lane/scroll owner; assert the owner tree and lane style.
- [Moving action feedback out of the scroll body changes success/failure behavior] → Move presentation only, keep the hook, refs, validation, alert, retry, and localized status unchanged, and rerun their existing behavioral tests.
- [Programme Continue migration accidentally enables blank submission] → Forward `disabled={!canContinue}` to `PrimaryAction` and retain focused Skip/Continue and Return-key tests on both platform branches.
- [Home's Upcoming action becomes misaligned or unreachable in the empty state] → Keep it as a minimum-size sibling beside the shared left-aligned state and add a focused route/target assertion.
- [About's inner cap widens prose on compact layouts] → Cap at the existing readable width and assert phone/tablet geometry against the outer standard-lane gutter.
- [Structural keyboard tests overstate native geometry] → Record native focus, blur, keyboard, rotation, and large-text checks in the inbox and do not claim device execution locally.

## Migration Plan

1. Add failing focused assertions for Settings casing, About lane geometry, and Home empty-state hierarchy, then make the presentation-only adjustments.
2. Migrate Feedback and Programme to the shared form/action components while retaining all existing handlers, states, labels, route parameters, and selectors.
3. Audit the personal-event exemplar and add only missing regression assertions; do not rewrite conforming code.
4. Update Architecture Book guidance/changelog and add the non-blocking device-pass note.
5. Run focused suites, TypeScript, lint, React Doctor changed-code, full Jest coverage, and the static Maestro selector proof used by CI.

Rollback is a normal revert. The change migrates no data or external contract and adds no dependency or route.

## Open Questions

None blocking. The accepted shared primitive APIs cover every named consumer; implementation should escalate only if native behavior demonstrates a contradiction with ADR 054 rather than inventing a new page-local exception.
