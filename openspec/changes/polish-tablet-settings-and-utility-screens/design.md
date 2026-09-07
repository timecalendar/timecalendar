## Context

The shared portrait-responsive foundation already provides `resolveResponsiveLayout`, `useAdaptiveLayout`, and `AdaptiveContent` with readable, standard, and full-bleed lanes measured from the actual container owner. The remaining TIM-502 screens predate that foundation: most center a local `MaxContentWidth` container with fixed gutters, even when the content is prose or a form that should stop at the 640-point readable cap.

This change spans several established feature UI modules but changes no business or persistence behavior. Existing Stack routes own headers and modal presentation; SafeAreaView, KeyboardAvoidingView, ScrollView, SectionList, and the splash overlay each already have distinct inset, scrolling, or full-window responsibilities. The design must adopt shared width resolution at those owners without wrapping virtualized lists, duplicating safe-area padding, or moving native chrome into feature content.

The tablet audit makes TIM-501 the sole responsive owner of the shared user-calendar screen and rename presentation. TIM-502 therefore owns only the Settings entry/integration proof for that route. ADR 042 limits the product to phone and full-screen portrait tablets; landscape, multitasking, sidebars, and master-detail layouts are outside the supported contract.

## Goals / Non-Goals

**Goals:**

- Replace local generic width caps with the established semantic lanes on every TIM-502-owned settings, management, history, informational, and form screen.
- Keep list, scroll, safe-area, keyboard, native-control, and modal owners intact while aligning their inner content.
- Preserve phone behavior and every existing feature semantic, action, accessibility label/state, translation, route option, and test selector.
- Record explicit no-change regression proof for Splash, dev import, `/profile`, and `/more`.
- Leave an implementation checklist with focused component proofs, Architecture Book/matrix updates, local-green checks, and a CI proof.

**Non-Goals:**

- No optional 834+ section columns, reordering, split view, sidebar, master-detail navigation, landscape, or multitasking support.
- No changes to preference values, Activity refresh/cache/pagination, hidden-event storage, feedback submission, changelog acknowledgement, calendar-management behavior, destructive flows, external links, or routes.
- No edit to TIM-501-owned user-calendar or rename UI, shared responsive primitives, theme tokens, native chrome wrappers, translations, dependency manifests, API/generated code, database schema/migrations, native/store/EAS/Firebase configuration, CI/deployment configuration, or legacy Flutter.
- No screenshot, physical-device, or human approval gate. Existing non-blocking device-inbox items remain separate evidence.

## Decisions

## Decision 1 — Adopt semantic lanes at the existing layout owner

Use `AdaptiveContent` where ordinary view composition owns the width, and `useAdaptiveLayout` where a ScrollView, SectionList, or custom content-container must retain direct ownership. In either case, the positive `onLayout` measurement comes from the actual route content owner, and the resolved `laneStyle` supplies centering, cap, and horizontal gutter.

For ScrollView screens, keep one vertical scroll owner and apply the measured lane to its content container or a single inner content view as appropriate. For Activity, keep SectionList as the only vertical list and apply the standard lane without inserting a ScrollView. Loading, empty, full-error, cached-error, refresh, and footer content must use the same measured owner as populated content so state transitions do not jump between different horizontal systems.

Retain SafeAreaView outside the responsive lane. The shared primitive owns content gutter and width only; it does not add safe-area insets, navigation offsets, keyboard compensation, or list inset policy. Keeping local `MaxContentWidth` beside a lane was rejected because it would create competing caps and fixed/adaptive padding. Measuring the global window was rejected because native sheets and nested owners may be narrower.

## Decision 2 — Use one ordered column; do not consume column eligibility

All TIM-502-owned screens remain one source-ordered column, including Settings and About at 834 and 1024 points. The audit permits optional whole-section columns but does not demonstrate enough benefit to offset conditional layout, large-text fallback, and focus-order risk on these mostly short surfaces. Standard lanes already keep grouped lists readable at 800 usable points; readable lanes reduce forms and prose to 640.

This is a deliberate disposition, not deferred implementation within the change. A later proposal may add columns only with a screen-specific scanability case and an automated one-column fallback under font/width stress. Splitting individual SettingsSection groups or reordering content was rejected because it would damage the stable top-to-bottom source and accessibility order.

## Decision 3 — Map screen families to lanes without changing their behavioral seams

- **Standard:** Settings hub, hidden events, and Activity. Their grouped rows and management/history collections benefit from the 800-point list cap.
- **Readable:** appearance, timezone, and notification settings; changelog history/sheet content; feedback form. Controls, prose, and compact state content use the 640-point cap.
- **Standard with readable inner copy:** About keeps grouped SettingsSection rows aligned to the standard lane while its blurb and link error receive a readable inner bound.
- **No visual change:** Splash retains full-window absolute-fill ownership and centered content; dev import retains its centered headerless state (a readable bound may be expressed only if it does not change transitions); `/profile` and `/more` remain one-line Redirect routes.
- **Integration only:** Settings continues to link to `/user-calendars`, but TIM-501 owns all responsive edits to that destination and rename presentation.

Feature data/store/form layers and public exports remain untouched. No new shared primitive is introduced because the foundation already owns the reusable policy. Updating an existing feature's UI import to `@/components/adaptive-content` is the intended consumption path.

## Decision 4 — Preserve native presentation and interaction ownership explicitly

The responsive lane stays below Expo Router Stack configuration and inside existing route presentation. Changelog sheet remains an iOS form sheet and Android full-screen modal; only `ChangelogContent` changes width behavior. Appearance, timezone, and notification settings keep `Host`, `Picker`, and `Switch` at the chrome seam. Feedback keeps KeyboardAvoidingView outside SafeAreaView/ScrollView composition. Activity keeps RefreshControl on SectionList and its existing `onEndReached` pagination. Splash keeps its absolute overlay and reduced-motion lifecycle.

Tests must prove these contracts from both component behavior and existing static route-structure assertions. A custom tablet modal, responsive header, duplicated safe-area padding, nested virtualized list, or platform fork was rejected because each would expand a width-only change into navigation or behavior redesign.

## Decision 5 — Drive responsive component tests through owner measurements

Focused tests render each changed family with the existing data/native seams mocked at their established boundaries, dispatch layout events carrying representative widths, and assert the resolved lane style plus preserved user-visible behavior. Cover 390 for phone parity, the 599/600 gutter boundary in a representative owner, 768/800 single-column tablets, and 834/1024 cap/unused-column eligibility. Individual screen suites need only the widths and states that prove their mapping; they must not duplicate the pure resolver's full table.

Activity tests retain dense/paged/loading/empty/error and refresh/footer interaction cases. Feedback retains empty/prefilled/invalid/pending/failure/success and keyboard composition. About and changelog retain long copy, metadata/link failure, release ordering, acknowledgement, and platform presentation. Splash/dev-import/redirect tests are regression-only and must not manufacture new UI. Existing static selector coverage remains the CI proof that affected Maestro flows retain their anchors; a new Maestro journey is unnecessary because no user behavior or route is added.

## Risks / Trade-offs

- **[Adaptive padding is applied twice]** → Remove the replaced local horizontal padding/cap and keep only safe-area ownership outside the lane; assert flattened styles after measured layout.
- **[Virtualized Activity behavior changes]** → Keep SectionList as the sole vertical owner and preserve RefreshControl, `onEndReached`, headers, footer, and state callbacks in focused tests.
- **[Forms lose keyboard reachability]** → Keep Feedback's KeyboardAvoidingView/SafeAreaView/ScrollView nesting and test the lane only inside that hierarchy.
- **[Presented changelog content measures the window instead of the sheet]** → Attach measurement within `ChangelogContent` so history and sheet resolve from their actual presented owner; retain route options statically.
- **[Concurrent calendar work conflicts]** → Do not touch user-calendar or rename files; test only the Settings route link and rebase on latest `main` before final review/merge as required by the epic.
- **[A width-only edit accidentally changes semantics]** → Limit production changes to UI composition/styles, retain current hooks/actions/routes, and review the diff for data, store, generated API, migration, native config, dependency, workflow, and legacy Flutter drift.

## Migration Plan

Apply the lane mapping by screen family, add focused tests beside each changed UI owner, then update the tablet matrix and current-state Architecture Book guidance. This is source-only composition with no persisted-data, API, native binary, configuration, or rollout migration. Rollback is a revert of the UI, tests, and documentation; no cleanup or backfill is required.

## Open Questions

None. If implementation discovers that a new shared primitive, Architecture Book rule, sensitive surface, or edit to TIM-501-owned files is necessary, the Applier must stop and return the design mismatch to the Founding Engineer instead of widening this proposal.
