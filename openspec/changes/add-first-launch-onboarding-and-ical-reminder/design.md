# Design — first-launch onboarding and first-iCal reminder

## Context

The root layout currently starts `runMigrations()` at module scope without awaiting it, mounts startup readers immediately, and lets `useAppReady()` report `true` synchronously. The JS splash therefore covers content for only a cosmetic interval; it does not prove that migrations committed or that the first durable `user_calendars` read resolved. The route tree is anchored at `(tabs)`, while the current onboarding specification explicitly says onboarding is not a startup gate.

The necessary product seams already exist. `@/features/calendar-sources` exposes reactive calendars plus a loaded signal, but those two current hooks each construct their own live query and therefore are not an atomic startup snapshot; QR and URL imports converge on `leaveImportJourney()` after their durable upsert; `/onboarding/school` begins the existing add/import journey; and personal-event creation already works with no user calendars. MMKV behind `@/storage` is the established home for small, typed, durable client decisions. Expo Router's pinned SDK supports `Stack.Protected`, which removes ineligible screens from the active route graph and redirects to the first available screen rather than mounting a protected screen beneath an effect-driven redirect.

The startup boundary must also remain extensible for Phase 09: migrations run first, then the future Flutter importer, then calendar eligibility. This change supplies the ordered prerequisite seam but does not read Flutter storage or implement the importer.

## Goals / Non-Goals

**Goals:**

- Keep the splash/recovery surface up until migrations, the future-importer slot, the first calendar read, and route eligibility are resolved.
- Make onboarding mandatory only for a fresh zero-calendar user with no durable resolution.
- Let a deliberate Skip unlock the complete zero-calendar personal-event experience.
- Keep onboarding resolution and reminder dismissal independent, typed, total-decoded, and durable.
- Reuse the existing import journey and one accessible confirmation component/copy.
- Prove the startup matrix, no-tabs mount, persistence, reminder behavior, and native fresh-install path.

**Non-Goals:**

- Implementing the Phase 09 Flutter importer or inspecting Flutter storage.
- Changing calendar identity schema, OpenAPI, generated clients, server behavior, or legacy Flutter code.
- Creating another import route or duplicating QR/URL import logic.
- Reopening onboarding after the user has ever skipped or held a calendar.
- Adding native dependencies, app/EAS configuration, or CI workflow changes.

## Decisions

### Decision 1 — One ordered startup prerequisite coordinator; failures stay closed

`useAppReady()` becomes an asynchronous coordinator with explicit `pending | ready | failed` state and Retry. It awaits `runMigrations()` and then an injected/default no-op `runLegacyImport()` prerequisite before any database-backed feature reader or startup side effect mounts. `runMigrations()` continues to record through `@/firebase` but rethrows so the coordinator can remain failed instead of pretending the schema is usable. Phase 09 replaces the no-op at this named slot without changing route-decision code.

The five-second watchdog no longer sets readiness to true. If startup is still pending, it changes the splash from passive progress to an accessible recovery/retry surface; it never mounts or reveals the route tree. This satisfies the non-bricking intent without bypassing a schema or eligibility invariant.

*Alternatives rejected*: retaining the module-scope promise races the first query; Drizzle's hook directly in the root couples the route policy to the database implementation and leaves no ordered importer slot; a watchdog that opens tabs violates the gate whenever a prerequisite stalls.

### Decision 2 — A nested component boundary prevents pre-migration reads

The root keeps infrastructure providers and the JS splash mounted, but renders the navigation/runtime subtree only after the prerequisite coordinator is `ready`. Calendar-sources adds `useUserCalendarsState(): { calendars; loaded }`, mapping `data` and `updatedAt` from one `useLiveQuery` invocation and exporting it from the public barrel. The nested first-launch navigator consumes that atomic snapshot. Until it resolves, the navigator renders only the splash continuation—no `Stack`, Home, Calendar, startup sync, Activity, or notification registration. Existing calendar-source hooks remain compatible for their current consumers.

This component boundary, rather than conditional hook calls, guarantees no `user_calendars` query is constructed before migrations commit. Runtime side effects move below the same boundary so they cannot touch tables early.

*Alternatives rejected*: mounting the full Stack behind an opaque overlay hides a visual flash but still mounts and executes ineligible tabs, which does not meet the no-paint/no-race contract; composing the existing calendar and loaded hooks lets two independent queries settle in different orders and can misclassify a recovered user as empty.

### Decision 3 — A pure route decision drives `Stack.Protected`

The new `first-launch/data` layer owns a pure decision:

| First calendar read | Resolution | Initial eligibility |
| --- | --- | --- |
| unresolved | any | pending; render splash only |
| zero calendars | absent | onboarding required |
| zero calendars | `skipped` or `calendarImported` | eligible tabs |
| one or more calendars | any | eligible tabs and seed `calendarImported` if absent |

The root Stack puts onboarding behind the inverse eligibility guard and wraps `(tabs)` plus every other post-onboarding route behind the eligibility guard. The dev-only token-import route remains unprotected but is declared after the eligible group. When onboarding is required, its declared screen is the first available fallback, so normal cold launch and attempts to enter Home/Calendar resolve there without either tab mounting. When Skip or import changes the durable resolution, Expo Router removes the now-ineligible onboarding route and the root Stack rebuilds from `(tabs)` in the same route-graph transition. The ordering is load-bearing: because `(tabs)` was absent when the navigator initialized, route-name fallback may use declaration order rather than the initial-route setting, so the exception must not precede tabs. The dev-import exception remains directly addressable and preserves the existing seeded native E2E/import recovery seam; after its durable upsert the eligible graph becomes available and its existing calendar replacement succeeds. Later imports use the supported Settings journey instead of reopening first-launch onboarding.

This is the load-bearing navigation rule recorded in a new ADR (reserved number 053 after checking merged and open-PR reservations).

*Alternative rejected*: a screen-level `router.replace()` races the same render that adds the eligible graph and can leave the native Stack without a rendered route; an effect redirect can also mount the anchored tabs before eligibility and flash/run them. Moving the filesystem into duplicate route groups would churn every route and create ambiguous deep-link ownership.

### Decision 4 — Two feature-owned MMKV stores encode two different decisions

A new `first-launch/store` sublayer uses `@/storage` for:

- `OnboardingResolution = "skipped" | "calendarImported" | undefined`
- `FirstIcalReminderState = "pending" | "dismissed"`, where missing/malformed values total-decode to `pending`

They use separate flat keys, parsers, imperative setters, and reactive hooks. Both keys are classified `environment-independent`: they describe a person's acknowledged product journey, not data belonging to one backend. Skip writes only `skipped`; reminder confirmation writes only `dismissed`. A successful import writes `calendarImported` before leaving the journey. An existing/recovered calendar makes the route eligible immediately and seeds `calendarImported`, ensuring later deletion cannot resurrect onboarding.

*Alternative rejected*: one combined `onboardingComplete` boolean makes Skip accidentally dismiss the reminder and cannot distinguish import resolution; deriving completion only from current calendar count reopens onboarding after deletion; SQLite flags would add schema/migration cost to non-relational state.

### Decision 5 — Import success resolves before the existing shared exit

`leaveImportJourney()` remains the single QR/URL success exit. It first records `calendarImported`, then clears/dismisses the onboarding journey as today; a directly opened single-entry import route deterministically replaces to `/calendar` instead of relying on a failing back operation. The durable calendar upsert still happens before this seam, so a failed import never resolves onboarding.

The dev-only token import also becomes eligible from calendar presence and need not duplicate the resolution write. No API or import implementation moves.

*Alternative rejected*: adding completion writes independently to QR and URL screens would create two success contracts and make future import methods easy to miss.

### Decision 6 — One modal confirmation component owns the shared explanation

`first-launch/ui` owns one controlled React Native `Modal` confirmation component used by both welcome Skip and reminder dismissal. The title/body and confirm copy are identical: TimeCalendar remains usable for personal events, and an iCal can be imported later from Settings. The caller supplies the context-appropriate cancel label (`Continue onboarding` or `Keep reminder`) and the confirmed action.

The modal has `accessibilityViewIsModal`, heading semantics, deterministic focus on show, `onRequestClose` wired to cancel/dismiss, translated labels, platform target sizes, and no transition animation (therefore no reduced-motion branch). Cancel never writes. Welcome Skip is changed from navigation-to-school to opening this modal; confirm writes `skipped`, then the root inverse guard removes onboarding and selects the tabs anchor.

*Alternative rejected*: native `Alert` provides platform focus but cannot expose a reusable, behavior-tested component contract or consistent small-screen/Dynamic Type layout; two dialogs would let explanatory copy drift.

### Decision 7 — One normal-flow bottom card is composed into both tabs

`first-launch/ui` also owns `FirstIcalReminder`, which reads calendars through `@/features/calendar-sources` and reminder state through its store. It renders only after the calendar read has loaded, onboarding is resolved, there are zero calendars, and state is `pending`. Any positive calendar count hides it reactively; falling back to zero shows it only if it was never dismissed.

Home and Calendar mount the same component as the last child of their vertical layout, below the flexible scroll/timeline region. The component owns its bottom `SafeAreaView`, rounded top corners, themed surface, wrapping/scaling copy, import CTA, and dismiss affordance. Normal flow reserves its actual Dynamic Type height, avoiding overlay/FAB conflicts and fixed-height guesses on small screens. CTA pushes `/onboarding/school`, the existing journey entry; dismiss opens Decision 6's modal.

*Alternative rejected*: duplicating a banner in each tab risks behavioral and copy drift; an absolute overlay needs a fixed reservation that breaks under large text and can cover calendar controls or Android FABs.

### Decision 8 — Tests prove policy at pure, route, component, and native levels

Pure tests cover the full startup and reminder matrices. Store tests cover total parsing, independence, reactivity, and relaunch durability. Root/route tests hold migrations/importer/calendar reads pending and assert protected tabs/screens do not render; then drive fresh, skipped, dismissed-reminder, existing-calendar, retry, and recovered-calendar cases. Component tests cover both dialog callers, cancel/dismiss versus confirm, focus/semantics, CTA route, both tab hosts, and reactive hide-after-import.

The fresh-install Maestro flow begins with `launchApp: clearState: true` and no deep link, skips via confirmation, creates a personal event, and observes the reminder on Home and Calendar. The imported/onboarding-success flow remains and proves successful import reaches tabs. Because this host has no KVM or iOS simulator, the PR receives `run-e2e` and cannot pass review until exact-head Android and iOS native jobs are green; this is CI evidence, not a human gate.

## Risks / Trade-offs

- [Protected-route declaration accidentally leaves a post-onboarding sibling available] → enumerate all root screens under one protected block, add a static route-structure proof, and review the ADR/navigation page against `_layout.tsx`.
- [Migration error or hung future importer strands the native splash] → hand off promptly to the JS recovery surface, announce failure, and provide Retry; never interpret timeout as eligibility.
- [An old install has calendars but no new resolution key] → calendar presence grants eligibility immediately and seeds `calendarImported` before later deletion can matter.
- [MMKV reset classification makes environment switching surprising] → document both flags as environment-independent and cover reset classification exhaustively in the existing type/test gate.
- [The reminder competes with tab content on short screens or large text] → normal-flow composition reserves measured height; card copy wraps and the main content remains scrollable.
- [Native deep-link import is the only intentional gate exception] → keep the exception development-variant action-gated as today and cover normal fresh launch separately with no deep link.

## Migration Plan

1. Add the typed flags and decision/store tests without changing routing.
2. Make migrations awaitable/failable and add the no-op importer prerequisite; move runtime readers below readiness.
3. Add the protected route graph and seed existing-calendar resolution.
4. Wire Skip/import resolution and the reminder UI.
5. Update docs, focused tests, the fresh-install Maestro flow, and the exact-head native CI label/evidence.

No user-data migration is required: missing keys deliberately represent an unresolved onboarding decision and a pending reminder. Rollback removes the new gates/UI; existing MMKV keys are harmless unknown values and the durable calendar/personal-event data remains unchanged.

## Open Questions

None blocking. The product behavior, native E2E requirement, Phase 09 boundary, and autonomous merge policy are explicit in the handoff.
