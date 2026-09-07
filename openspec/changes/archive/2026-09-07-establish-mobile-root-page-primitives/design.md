## Context

TimeCalendar's user-facing root destinations are Expo Router Stack siblings of `(tabs)`, but the root Stack currently defaults to `headerShown: false` and individual routes opt back into native chrome. The resulting screens independently choose header back labels, safe-area/page spacing, intro titles, empty-state alignment, and action styles. Activity and Hidden events are representative list owners: both already distinguish data states correctly, yet each renders an ad hoc empty sentence. The personal-event editor already separates scrollable fields from a sticky footer, but its save action does not use the semantic filled-brand pair and its keyboard behavior is not a reusable contract.

The existing foundations remain authoritative: Expo Router is the only navigation API; `AdaptiveContent`/`useAdaptiveLayout` own measured lanes but not safe areas or keyboard behavior; alpha native APIs stay behind `src/components/chrome/`; `primaryStrong`/`onPrimary` is the verified filled-action pair; feature routes remain thin; and Activity/Hidden data behavior and selectors must not change. The host cannot supply emulator rendering, so native keyboard, screen-reader, and theme rendering evidence is recorded as a non-blocking `(HUMAN: …)` migration-inbox pass while component behavior and selectors remain CI-proven.

The selected artwork is unDraw's “Developer Activity” (`https://undraw.co/illustration/developer-activity_4zqd`) for Activity and “No data” (`https://undraw.co/illustration/no-data_ig65`) for Hidden events. The official license at `https://undraw.co/license` permits commercial and non-commercial use, copying, modification, and distribution without attribution, while prohibiting redistribution as an asset pack, competing-service use, and AI/ML training. TimeCalendar uses two illustrations as product UI, not as a pack or model input.

## Goals / Non-Goals

**Goals:**

- Give every user-facing non-tab root destination compact localized native Stack chrome with a chevron-only back affordance and feature-owned native actions.
- Establish reusable page framing and intro rhythm that composes with measured readable/standard lanes, safe areas, lists, and forms without forcing an in-content copy of the route title.
- Establish one illustrated empty-state contract for full-screen centered and section-level left-aligned use, with semantic text hierarchy, local theme variants, and accessible no-motion rendering.
- Establish one filled primary-action contract for colors, minimum target, disabled/busy state, and accessible progress while preserving platform-native placement choices.
- Establish a reusable keyboard-safe owner with independently scrollable content and a pinned action region, and prove it through the personal-event editor.
- Preserve Activity and Hidden loading/error/list behavior, personal-event CRUD behavior, FR/EN parity, and existing test/Maestro selectors.

**Non-Goals:**

- No migration of every page's content to the new page, intro, empty-state, or action primitives; dependent design-feedback children own page-specific adoption beyond the exemplars.
- No redesign of Home's compact section-level empty state, which remains left-aligned and receives no full-screen artwork.
- No unification of iOS header buttons, Android FABs, and filled body buttons into one visual placement.
- No new animation, styling runtime, image/SVG runtime, navigation dependency, API/data behavior, persistence, native/store configuration, deployment/workflow, or legacy Flutter work.
- No page-specific About, Home, Settings, calendar-rename, or route-family polish.

## Decisions

## Decision 1 — Root Stack owns compact defaults; screens own localized titles and actions

Add a typed helper under `mobile/src/components/chrome/` that returns the user-facing root Stack defaults: visible native header, no large title, chevron-only/minimal back display, theme-backed header surface, and the existing native shadow posture. Apply it as the root Stack's default, then explicitly mark `(tabs)`, `onboarding`, `profile`, `more`, and `dev-import` headerless because they are a nested shell, nested flow, compatibility redirects, or an internal transition route. Register `more` explicitly so every root route is classified rather than inheriting accidentally.

Feature screens continue to render `<Stack.Screen options={{ title, ...actions }}>`, so titles remain localized at render time and platform-specific `unstable_headerRightItems`/`headerRight` behavior remains supported. Personal events and its form gain localized native titles; the form removes its second oversized in-content route title. A route-structure test enumerates all root files and requires each to be a user-facing default or an explicit headerless exception, while also asserting that the back display is minimal and never exposes `(tabs)`.

Alternatives rejected: keeping `headerShown: false` and fixing named routes leaves future siblings inconsistent; hard-coding titles in `_layout.tsx` separates translation/runtime state from feature ownership; a custom header would replace platform behavior and duplicate Expo Router.

## Decision 2 — Page primitives compose with existing layout owners instead of replacing them

Add `RootPage` and `PageIntro` under `mobile/src/components/`. `RootPage` owns only the themed full-height surface, non-header safe-area edges, a measured semantic lane, and consistent top/bottom page rhythm. It exposes a content slot that can hold a virtualized list, a scroll owner, or ordinary content without nesting a list in another scroller. `PageIntro` owns the gap and optional heading/caption hierarchy; its heading is optional so a native Stack title can be the sole route heading, and a root page is never required to repeat it in oversized content.

The components build on `useAdaptiveLayout` rather than creating breakpoints or using window/device identity. They do not own navigation, list insets, keyboard avoidance, overlays, or platform presentation. Activity and Hidden use the shared frame in ways that retain their existing standard lane and list owners.

Alternatives rejected: one mandatory ScrollView breaks virtualized-list ownership; an all-purpose screen component would conflate safe area, navigation, lists, and keyboards; a mandatory intro title recreates the duplicated title problem.

## Decision 3 — Empty state is semantic content with optional decorative theme-paired artwork

Add `EmptyState` with `variant: "screen" | "section"`, required localized title, optional localized caption, optional `{ light, dark }` local image sources, and caller-provided `testID`. Screen mode grows to available space and centers a bounded content group; section mode stays left-aligned and content-sized. Text uses `ThemedText` title/caption variants, scales normally, wraps, and is exposed in source order. The state container is a polite live region where supported; the image is decorative (`accessible={false}` and hidden from accessibility) so the localized title/caption carry all meaning.

No animation or transition is added, making rendering reduced-motion-safe by construction. Activity uses “Developer Activity”; Hidden events uses “No data”. Each illustration is downloaded through the official page, recolored at source to the exact light `primary` and dark `primary` values, exported as optimized local PNG variants, and selected through the app's single color-scheme seam. A small asset record beside the images names each official source page, creator/license URL, color variants, and retrieval date; runtime code never contacts unDraw.

Alternatives rejected: hotlinks make offline UI and third-party availability part of rendering; a single bright asset cannot truthfully match both semantic primary tokens; runtime SVG support adds a dependency for two static illustrations; assigning an accessibility label to decorative artwork duplicates the state text.

## Decision 4 — Primary action centralizes filled semantics, not platform placement

Add `PrimaryAction` under `mobile/src/components/` with translated `label`, `onPress`, optional `testID`, `disabled`, `busy`, and composable style props. Filled actions always use `primaryStrong` with `onPrimary`. The component resolves a 44-point iOS or 48-dp Android minimum height, keeps an enabled visual at full opacity, gives disabled/busy states a documented reduced opacity, blocks activation in both states, exposes `accessibilityState={{ disabled, busy }}`, and renders an `onPrimary` activity indicator without making progress a second focus target.

The contract applies to filled in-body/footer actions. iOS native header actions and Android FABs remain feature-owned native compositions; they use platform sizing and the same semantic color roles but do not masquerade as the filled component. The Activity full-error retry may consume `PrimaryAction`; compact inline retries remain secondary. The personal-event Save action consumes it without changing `personal-event-save`.

Alternatives rejected: one cross-platform placement component would force an iOS FAB or Android-shaped header action; letting each feature choose filled colors recreates the contrast defect; treating busy as only a label swap permits duplicate submission.

## Decision 5 — Keyboard-safe action ownership is a scroll/body/footer composition

Add `KeyboardSafeActionLayout` as the reusable owner for focused forms. It renders a `KeyboardAvoidingView` around a flexing `ScrollView` content region and a sibling pinned action region. It uses `padding` behavior on iOS and `height` on Android, `keyboardShouldPersistTaps="handled"`, caller-composable readable lane styles, and safe-area ownership supplied by the screen. The action region therefore moves immediately above the keyboard while fields remain scrollable and do not jump into a second scroll owner.

PersonalEventEditor adopts this owner and `PrimaryAction` for Save. Delete remains a separate destructive/secondary action below Save, and save/delete errors remain in the action region. Existing field order, validation, native pickers, route/edit resolution, action order, identifiers, and persistence hooks remain unchanged. Focused tests assert per-platform keyboard behavior, separation of fields/actions, scrollability, state forwarding, and stable selectors; the inbox pass verifies actual iOS/Android keyboard geometry and large-text behavior.

Alternatives rejected: absolute positioning overlaps content and safe areas; placing the action inside the ScrollView lets it disappear below the keyboard; a global keyboard listener duplicates React Native's platform owner and is harder to keep stable.

## Decision 6 — The shared rule is binding and ADR-backed

Add ADR 054 for the root-page/action ownership split because it governs every future non-tab destination and is expensive to reverse after broad adoption. Update `navigation.md` for route classification and compact headers, `theming.md` for empty/action visual roles and artwork, `accessibility.md` for semantic empty/busy behavior, `testing.md` for focused shared-component proofs, and `CHANGELOG.md` for the new binding rule. Update feature documentation only where Activity, Hidden events, and personal events now consume the contract.

Alternatives rejected: documenting only in component comments would hide a cross-feature rule; omitting the ADR would lose why visual semantics are shared while placement remains native.

## Risks / Trade-offs

- [Making visible headers the default can expose a redirect/internal route] → Enumerate every root route, explicitly hide shell/redirect/internal exceptions, and test the classification against the route directory.
- [A page wrapper can interfere with SectionList/ScrollView sizing] → Keep RootPage non-scrolling, accept content owners as children, and test Activity plus Hidden list/empty branches at phone and tablet widths.
- [Dynamic Type can make illustrated states vertically tight] → Cap artwork dimensions, allow text to wrap, preserve source order, and let the full-screen container scroll only when the consuming screen already owns a scroller; verify large-font layout on device.
- [Static art can drift from theme tokens] → Record exact source colors, keep paired files named by scheme, and add a focused source/selection test; future token changes must regenerate both assets.
- [KeyboardAvoidingView differs across OS and keyboard configuration] → Encode per-platform behavior, keep the footer in normal flex layout, test structural behavior, and record real-keyboard proof for both platforms in the migration inbox.
- [Shared action adoption can accidentally change CRUD concurrency] → PrimaryAction only reflects caller state; existing save/delete hooks remain authoritative and focused tests preserve calls, failure states, and selectors.

## Migration Plan

1. Add and test the compact root Stack options helper, classify every root route, and give personal-event root destinations localized native titles.
2. Add RootPage/PageIntro, EmptyState, PrimaryAction, and KeyboardSafeActionLayout with focused light/dark, platform, accessibility, state, layout, and selector tests.
3. Add the four local illustration files plus the source/license record; verify Metro resolves the static sources with no new dependency or network access.
4. Adopt RootPage/EmptyState in Activity and Hidden events, preserving their loading/error/list branches and existing selectors.
5. Adopt KeyboardSafeActionLayout/PrimaryAction in the personal-event editor, remove only the duplicate in-content route title, and preserve Save/Delete behavior and Maestro identifiers.
6. Add ADR 054 and update the binding Architecture Book topics and changelog; add the non-blocking device-proof inbox note.
7. Run focused component/feature/route tests, TypeScript, lint, the full mobile Jest coverage gate, React Doctor changed-code gate, and the existing Maestro-selector static/flow proof used by CI.

Rollback is a normal revert: assets and primitives are additive, consumers retain their data contracts, and no persistent data, server contract, or native configuration migrates.

## Open Questions

None blocking. Page-specific adoption beyond Activity, Hidden events, and the personal-event form remains intentionally assigned to dependent design-feedback changes.
