## Context

`mobile/src/features/calendar/ui/event-details-screen.tsx` is a 399-line feature screen that owns route/data reads, four visibility/edit callbacks, header configuration, two async status branches, calendar-name derivation, rich details presentation, checklist composition, and all local styles. Its component test already proves much of the user-visible contract, but the implementation boundary forces unrelated concerns through one React function.

React Compiler is enabled in `mobile/app.config.ts`. A current verbose React Doctor scan identifies the screen function as high-complexity, flags all four `useCallback`/`useMemo` sites as manual memoization in compiler-managed code, and flags the tag list's occurrence index key. The generated `EventTag` shape in the committed contract exposes only `name`, `color`, and `icon`; none is documented unique, and two identical tag occurrences are valid presentation data.

The screen is the shared Phase 04/05 surface for synced and personal events. Its decomposition must therefore preserve the persistence and navigation edges rather than merely reproduce the static layout.

## Goals / Non-Goals

**Goals:**

- Make `EventDetailsScreen` a below-200-line loading/not-found/resolved-event orchestrator whose branches are obvious on first read.
- Give header actions, async states, and rich content focused UI-owned boundaries while retaining the existing feature/data dependency direction.
- Preserve synced hide/unhide and personal edit behavior exactly, including write-error and navigation timing.
- Keep duplicate tags visible and make the lack of a stable domain tag identity explicit.
- Leave direct tests for loading, not found, synced visible, synced hidden, and personal events, plus focused action tests where the extracted boundary benefits from them.
- Resolve the changed screen's high-complexity diagnostic and classify every remaining changed-file React Doctor finding with code and contract evidence.

**Non-Goals:**

- No copy, visual, route, data-seam, storage, API contract, schema, checklist, or formatting behavior change.
- No new tag identifier and no name-only identity assumption.
- No broad removal of memoization from calendar data, renderer, checklist, or other features.
- No React Doctor configuration, suppression, dependency installation, or unrelated finding cleanup.
- No native E2E run or `run-e2e` label from this host; existing selectors and the post-merge device path remain unchanged.

## Decision 1 — Keep the exported screen as explicit state orchestration

`EventDetailsScreen` will retain only the route uid, rich event read, locale/display-zone resolution, and three explicit outcomes: loading, resolved not-found, and resolved event. Loading and not-found presentation will move to small status components, while a resolved-event component will compose the header, write error, rich content, and checklist.

The extracted modules remain under `features/calendar/ui` (a colocated subdirectory is acceptable) and import the calendar `data/` sub-barrel rather than the feature barrel. The existing `ui/index.ts` and feature barrel continue exporting only `EventDetailsScreen`; internal pieces do not become cross-feature API.

A controller object containing every screen concern was rejected because it would move the large control-flow graph behind one opaque hook. Leaving the JSX sections in the screen but extracting only styles was rejected because it would not simplify orchestration or resolve the diagnostic.

## Decision 2 — Extract one UI action hook and keep persistence semantics at the existing seams

A focused UI hook will own event-kind action selection and return the presentational header-action model plus the hide failure state. It will call `useHiddenEvents`, `useHideActions`, `useRouter`, and translation exactly once for a resolved event.

For a visible synced event, the returned action opens the existing native chooser. Each hide callback calls `router.back()` only when its corresponding mutator returns success. For a hidden synced event, the action removes uid and name entries independently when each is present and never navigates; this includes the deep-link case where both sets contain the event. For a personal event, the action pushes exactly `/personal-event-form?uid=<event.id>`. A presentational header component renders the unchanged labels, roles, hit target, and `Stack.Screen` title.

Passing the action hooks separately into header and body was rejected because `useHideActions().failed` is hook-instance state; duplicating the hook could disconnect the chooser's failure from the visible notice. Moving hide/edit behavior into a data layer was rejected because native alerts and routing are UI orchestration, while persistence already belongs to the hidden-events seam.

## Decision 3 — Split presentation by responsibility without widening public API

The resolved content boundary will own calendar-name derivation and the current title, tags, optional content lines, updated footer, and checklist placement. Small title/tag/content components may be private to that module or its directory. Calendar names remain absent below two held calendars, absent when the event calendar is unresolved, and routed through `effectiveCalendarName` for trimmed/whitespace fallback. Date/time formatting continues to receive the resolved locale and display zone explicitly; all-day behavior remains in the existing formatter.

No new localization key or shared component abstraction is warranted. Generalizing these event-specific sections into `src/components` was rejected because their semantics belong to the calendar feature and have no second owner.

## Decision 4 — Remove only the screen's non-semantic manual memoization

The four current callbacks/derived value carry no correctness lock, referential-identity contract, or measured expensive computation. React Compiler is enabled, the header action is not consumed by a manually memoized external API, and the calendar-name derivation is one array lookup plus string normalization. The extracted UI code will therefore use ordinary closures and direct derivation, relying on React Compiler for optimization.

Memoization in `calendar/data/event-details.ts`, the event-source seam, calendar renderer, or checklist feature remains out of scope because those sites may protect projections or reactive dependencies and require independent evidence.

## Decision 5 — Preserve duplicate tag occurrences without inventing domain identity

The implementation will not use `tag.name` alone as a key and will not modify OpenAPI/generated types to manufacture an id. The renderer will retain an occurrence-aware key derived from the available tag fields plus its duplicate occurrence position, or retain the current value-plus-position identity if that is the clearest implementation. Identical duplicates must both render, and a component test will pin that behavior.

Because tag bubbles are stateless, non-interactive presentation nodes and the contract supplies no stable occurrence id, positional occurrence identity has no user-state reassociation risk. If React Doctor continues to flag it, the finding will be recorded as an evidence-backed limitation with the generated shape and duplicate rendering test, not suppressed. Adding an API/data-layer id is rejected absent proof that the server owns a stable unique identity; it would be a sensitive contract expansion for a leaf rendering diagnostic.

## Decision 6 — Prove behavior at both orchestration and focused action boundaries

The screen suite will directly name and cover loading, not found, synced visible, synced hidden, and personal branches. It will retain exact assertions for success-only back navigation, hide-by-name, dual uid/name unhide, write-error visibility, personal route push, calendar threshold/whitespace fallback, both checklist mounts, locale/timezone/all-day formatting, translations, accessibility, and test IDs. Extracted action logic may receive its own colocated test if doing so makes callback/error paths clearer; tests will reset suite-owned alert/router mocks through exception-safe teardown.

Verification will run the focused event-details suites first, then TypeScript, targeted lint/formatting, and the full mobile Jest suite when practical, explicitly recording whether Jest exits naturally. React Doctor will run with `--verbose --scope changed`; the high-complexity finding must be absent, and every other changed-file finding must be listed as fixed, false positive, or evidence-backed limitation. The existing event-details component test is the CI proof in `test-mobile`; no workflow change is needed.

## Risks / Trade-offs

- **[Extraction accidentally changes hook ownership or error visibility]** → Call visibility hooks once in the focused action hook and retain screen-level integration coverage of the failure notice.
- **[Behavior disappears behind helpers while the top-level looks short]** → Keep the three screen outcomes explicit and test the focused action boundary directly; do not create one all-purpose controller.
- **[Tag identity remains diagnostically imperfect]** → Preserve duplicate data, prove it in a test, and classify the finding with generated-contract evidence rather than inventing uniqueness or suppressing the rule.
- **[Moving JSX changes accessibility or visual spacing]** → Move existing props/styles without redesign and retain semantic queries for the header, loading state, title, action labels, error notice, and content.
- **[Full Jest exposes an existing process-lifecycle issue]** → Record command output and whether it exits naturally; do not weaken Jest or expand into unrelated harness cleanup.

## Migration Plan

No data or deployment migration is required. This is a source-only refactor shipped through the existing React Native bundle. Rollback is a normal code revert; routes, persisted events, hidden-event state, and checklist rows remain unchanged.

## Open Questions

None. The current contract and Founding Engineer brief resolve the behavior, architecture, verification, QA, and sensitive-surface boundaries.
