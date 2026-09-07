## Context

ADR 054 and the `mobile-root-page-primitives` capability established the shared compact native Stack defaults, `RootPage`, `PageIntro`, `EmptyState`, and the ownership boundaries for scrolling, virtualization, keyboard avoidance, safe areas, and platform actions. The root Stack now defaults ordinary siblings to a visible compact header and explicitly hides `(tabs)`, `onboarding`, `profile`, `more`, and `dev-import`. Activity, Hidden events, and the personal-event editor are representative adopters.

The remaining route tree is still inconsistent. Root destinations mix `SafeAreaView`, `AdaptiveContent`, custom top padding, and feature-local empty states. Feedback repeats its native route title as a large content heading. The nested onboarding Stack still defaults every child to `headerShown: false`; only School and Programme opt back in, both blank the actual header title and repeat it in content. Other import-journey screens have no native back affordance at all. Empty/loading/error geometry also varies, especially where a virtualized list or full-screen camera owns the content.

This is presentation-only work. Routes remain thin, features retain localized titles/actions and all data behavior, and no `@react-navigation/*` import is introduced. The development host cannot render iOS or Android devices, so unit/component/static proofs are local and the final native rendering pass is recorded non-blockingly in the migration inbox.

## Goals / Non-Goals

**Goals:**

- Make the complete top-level and nested-onboarding route inventory explicit and regression-tested.
- Give ordinary pushes one localized compact native title and a chevron-only back affordance.
- Apply shared page rhythm without changing scroll, list, keyboard, overlay, refresh, pagination, or platform-action ownership.
- Remove only duplicate route headings; retain explanatory captions and content-level section headings.
- Keep loading, empty, error, and populated branches aligned below native chrome with no transient blank band.
- Preserve route parameters, deep links, platform presentations, actions, selectors, FR/EN copy, and accessibility focus order.

**Non-Goals:**

- No new navigation destinations or changes to tab, Home, calendar timeline, or Settings-hub geometry.
- No calendar row actions/rename changes, calendar-management geometry redesign, primary-action restyling, or About prose-gutter redesign beyond shared page adoption.
- No change to onboarding sequence, import draft lifetime, camera behavior, form validation, CRUD, API/data/storage, or notifications behavior.
- No forced visual parity between native iOS and Android presentations or action placement.
- No API/generated client, server/schema, native/store/EAS, dependency, deployment/workflow, secret, or legacy Flutter change.

## Decisions

## Decision 1 — Keep two explicit inventories: the root Stack and nested onboarding Stack

The existing root layout remains the single classification source for top-level siblings. Its compact default continues to cover `appearance-settings`, `timezone-settings`, `notification-settings`, `about`, `feedback`, `user-calendars`, `personal-events`, `personal-event-form`, `event-details/[uid]`, `activity`, `hidden-events`, `changelog`, and the presented `changelog-sheet`. `(tabs)`, `profile`, `more`, `onboarding`, and `dev-import` remain explicit root-level headerless exceptions.

The onboarding layout gains its own compact screen options and explicit child registrations. `index` is the sole headerless child because it is the branded carousel landing. `school`, `institution-name`, `programme`, `connect`, `import`, `qr-scan`, `ical-url`, and the off-path `groups` route inherit visible compact chrome and set their localized title in feature UI. A route-structure test recursively discovers top-level and onboarding route files, compares them with both inventories, and asserts the expected mode for each. Layout files are excluded as navigators rather than treated as screens.

This makes auto-discovery visible in review without moving translations into layouts. An allowlist that ignores newly discovered files was rejected because a new route could silently inherit the wrong posture. Treating the root `onboarding` container as visible was rejected because it would produce stacked headers above the nested Stack.

## Decision 2 — Nested onboarding reuses compact chrome but preserves feature-owned actions

`mobile/src/app/onboarding/_layout.tsx` resolves the active theme and calls the existing `buildCompactRootScreenOptions`; it does not create a second options helper. The root-level onboarding container stays headerless while child screens render the actual header. School keeps its native search field and its special dismissing back action when launched from calendar management. Programme keeps its iOS native/Android React Skip action. Their `headerTitle: ""` overrides are removed so the already-localized `title` becomes visible, while their minimal-back and theme options may collapse into inherited defaults where behavior is identical.

The QR scanner is an explicit content-layout exception, not a navigation exception: it gets the localized compact header and back affordance, but its camera remains the full-bleed owner below that header. The changelog sheet similarly retains iOS form-sheet versus Android full-screen-modal presentation and its Close action while sharing compact title/back defaults.

Putting titles in the onboarding layout was rejected because titles are runtime-localized, some depend on feature state/actions, and the Architecture Book assigns title ownership to features. Keeping Connect/import steps headerless was rejected because they are ordinary pushes and currently require in-content Back controls or gesture knowledge.

## Decision 3 — Adopt `RootPage` by replacing only the page frame, never the content owner

Each eligible destination replaces its outer themed surface, non-header safe area, top rhythm, and primary measured lane with `RootPage`. Existing content owners stay in place:

| Owner shape | Destinations | Adoption rule |
| --- | --- | --- |
| Plain readable preference/content | Appearance & language, Timezone, Notifications, Connect, manual import, iCal URL | `RootPage lane="readable"`; ordinary content starts at shared top rhythm. |
| Scroll/form owner | Feedback, About, changelog history/sheet, event details, institution/programme forms | `RootPage` surrounds or supplies the measured lane to the existing `ScrollView`/keyboard owner; no additional scroller. |
| Virtualized collection | Activity, Hidden events, Personal events, User calendars, School | `RootPage lane="standard"` passes lane geometry to the existing `SectionList`/`FlatList`; refresh, pagination, keyboard dismissal, automatic insets, FAB overlay, and list padding remain feature-owned. |
| Stateful plain/list hybrid | Event-details loading/not-found and User-calendars loading/empty/error | The same `RootPage` frame is used for every state so state changes cannot add or remove an unexplained top band. |
| Full-bleed or brand exception | Onboarding welcome, QR camera content, redirects, development import transition | Keep the current content owner; the inventory test records the deliberate exception. |

Where a screen needs two semantic widths, such as About's standard grouped actions plus readable prose, `RootPage` owns the standard lane and the existing nested readable measurement remains local. Where a list needs direct lane style or metrics, the render-function form of `RootPage` supplies them rather than wrapping the list in a `View` that changes virtualization geometry.

Replacing existing list owners with a shared `ScrollView` was rejected because it would break refresh, pagination, keyboard, and virtualization semantics. Adding `RootPage` around an unchanged `AdaptiveContent` owner was also rejected where it would double gutters or caps; each destination ends with one primary lane owner.

## Decision 4 — Native route titles stand alone; `PageIntro` carries captions only

An ordinary destination sets one localized `Stack.Screen` title and removes an in-content heading that repeats that same route name. Existing explanatory text moves into caption-only `PageIntro`, which supplies `textSecondary` typography and the shared bottom rhythm. Screens with no explanatory copy render no intro merely to fill space. Content-level headings remain when they name sections, releases, calendars, events, or carousel pages rather than the route itself.

Concrete duplicate removals include Feedback; School and Programme; Institution name, Connect, manual import, iCal URL, group selection, and QR permission states once their route title moves to native chrome. User Calendars keeps its visibility explanation as the caption/list header but uses the shared intro spacing. Event details keeps the event title because it identifies the selected event while the native route title identifies the screen.

Changing or deleting translation keys is not required unless a key becomes truly unused. Reusing the title key in native chrome preserves FR/EN meaning and deep-link state. A blank `headerTitle` plus in-content title was rejected because it defeats the compact-header contract and gives assistive technology two competing navigation/title patterns across sibling screens.

## Decision 5 — Shared empty/status composition is adopted only where it preserves meaning

Personal Events and User Calendars use the shared screen `EmptyState` without mandatory artwork, retaining their existing localized meaning and stable selectors. Already-adopted Activity and Hidden events remain unchanged except for any frame integration needed by neighboring refactors. Event-details loading/not-found and School loading/error/no-results stay feature-specific because they carry progress, retry, search-query, or event-state semantics, but they render inside the same shared page frame and measured lane as populated content.

Loading gates remain authoritative: User Calendars must still render neither empty content nor a live region before its async local read resolves. Pull-to-refresh, cached-error, and pagination states remain owned by Activity and list features. Using `EmptyState` for every error was rejected because it would erase retry/action distinctions and make an error visually indistinguishable from valid emptiness.

## Decision 6 — Tests prove structure and behavioral invariants; documentation extends ADR 054

The static route suite owns exhaustive root/onboarding discovery, header exception sets, shared compact options, title ownership, and the absence of blank group-derived back labels. Focused feature suites assert shared frame/intro adoption, removal of duplicate headings, state placement, preserved list/scroll/keyboard props, native header actions, route parameters, selectors, and accessibility ordering. Existing feature suites remain the behavior proof for CRUD, refresh, pagination, import, and routing; no broad snapshot replaces them.

ADR 054 already contains the load-bearing decision, so no new ADR is added. `navigation.md`, `theming.md`, `accessibility.md`, `testing.md`, `features.md` where needed, and `CHANGELOG.md` are updated to describe the fully adopted current state. A dated `(HUMAN: …)` inbox note requests iOS/Android verification of headers, back behavior, sheet/camera presentation, Dynamic Type, keyboard layout, VoiceOver/TalkBack order, and light/dark spacing without blocking the code path.

## Risks / Trade-offs

- [A newly visible nested header changes usable height or exposes a second title] → Remove the matching content heading, use non-header safe-area edges, and test each nested route's title and first content node.
- [A shared frame nests or constrains an existing list/scroll owner] → Use `RootPage`'s render-function geometry, retain exactly one list/scroller, and assert refresh/pagination/keyboard props in the owning feature suite.
- [School search or calendar-management dismissal regresses under inherited options] → Preserve the native search configuration and platform-specific dismiss back action, with focused iOS/Android option tests.
- [Loading-to-content transitions create a blank band] → Render every state under the same frame and test loading, empty, error, and populated branches against the same owner/lane selectors.
- [Removing a visible heading harms accessibility] → Treat the native Stack title as the route heading, keep meaningful content headings, and verify source/focus order plus caption semantics in focused tests and the device pass.
- [Broad presentation edits disturb selectors or deep links] → Keep route files, parameters, handlers, and existing test IDs stable; static Maestro-selector validation and current feature tests remain required.

## Migration Plan

1. Extend the root/onboarding route inventory test and configure nested compact Stack defaults with explicit child registrations.
2. Normalize onboarding titles and page frames while preserving Welcome, QR camera, School search/dismiss, Programme Skip, draft, and import behavior.
3. Adopt `RootPage`/`PageIntro` in ordinary root preference, content, form, history, and details screens.
4. Adopt the shared frame and appropriate empty-state composition in virtualized management/history collections without replacing list owners.
5. Update focused screen tests, translations only where needed, Architecture Book current-state guidance, changelog, and the non-blocking device-pass note.
6. Run focused route/screen tests, TypeScript, lint, React Doctor changed-code, full Jest coverage, and the static Maestro selector proof; review the diff for scope and sensitive surfaces.

Rollback is a normal revert. This change migrates no persisted data or external contract, adds no route, and retains all existing feature behavior behind presentation composition.

## Open Questions

None blocking. Header and content exceptions are enumerated above; implementation should flag a route only if its current native behavior contradicts that inventory rather than silently inventing another exception.
