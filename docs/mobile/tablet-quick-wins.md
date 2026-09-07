# Portrait-tablet quick-win audit

This document is the implementation map and ownership ledger for the portrait-tablet work in
TIM-499 through TIM-503. The shared responsive foundation described below is implemented; the
screen matrix continues to describe bounded follow-up work for its owning tickets.

The supported target remains phone plus full-screen portrait tablets. The representative layout
classes are 390 points for a phone, 768 and 834 points for iPad portrait, 800 dp for an Android
portrait tablet, and 1024 points for the largest supported portrait class. The 599/600 boundary is
also included wherever the shared resolver is tested. Landscape, iPad multitasking, sidebars,
business behavior, and native orientation/device-family changes are outside this plan.

## Current-code findings

- Most list, management, and form screens independently use `MaxContentWidth` (800) with fixed
  `Spacing.four` horizontal padding. That is a useful phone-safe default, but it does not express
  whether a surface is prose, a form, a list, or an information-dense canvas.
- Home is capped at 800 while Today timeline geometry initially derives from global window width.
  The timeline later accepts an `onLayout` measurement, so it already exposes the right ownership
  seam but has an inconsistent pre-layout fallback on wide windows.
- Calendar day/week modes and the QR camera are information surfaces that benefit from the full
  available width. Applying the same cap as forms would make them worse.
- Expo Router Stack/native-tabs already own headers, tabs, safe areas, and route presentation.
  `/changelog-sheet` is an iOS `formSheet` and an Android `fullScreenModal`; responsive content
  must remain inside that native presentation rather than replace it.
- `/profile` and `/more` are compatibility redirects. Splash and `/dev-import` already use centered,
  non-stretching transient compositions. These surfaces need regression checks, not redesigns.

The contract below follows the SDK 56 Expo Router Stack presentation model and the repository's
existing chrome seam. It introduces no dependency; its durable current-state rule lives in the
Architecture Book's theming guidance.

## Implemented responsive foundation

`@/theme` exports `ResponsiveBreakpoints`, `ResponsiveContentWidths`, the responsive lane, size,
and metrics types, and `resolveResponsiveLayout(ownerWidth, lane)`. Ordinary view composition uses
`AdaptiveContent` from `@/components/adaptive-content`; list, scroll, and custom-geometry owners use
`useAdaptiveLayout(lane)` from the same module and attach its `onLayout` handler to the actual width
owner. Both component forms resolve the rules below through the same pure function.

### Measurement and breakpoint semantics

- Measure the laid-out container that owns usable content with React Native `onLayout`. Resolve
  nested content, capped parents, and presented content from that measurement, not from a device
  model or the global window.
- A positive width below 600 points is **compact**. A positive width at or above 600 points is
  **tablet**. Before the owner reports a positive width, retain compact behavior.
- `useWindowDimensions` remains appropriate for genuinely window-owned behavior such as font scale
  or a full-window overlay, but not for choosing a nested content lane.
- The semantic breakpoint changes gutters and eligibility; it does not by itself require a
  different composition. Existing phone composition must remain unchanged below 600.

### Lanes and gutters

| Lane             | Intended content                                   | Width rule                                                     |
| ---------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| Readable (`R`)   | Forms, prose, metadata, and compact status content | Centered; cap usable content at 640 points                     |
| Standard (`S`)   | Grouped lists, cards, and management surfaces      | Centered; cap usable content at the existing 800-point maximum |
| Full bleed (`F`) | Calendar/camera canvases and window-owned shells   | Use all width inside the current chrome/safe-area owner        |

- Compact horizontal gutters use `Spacing.four`; tablet gutters use `Spacing.six`. The lane cap
  applies after subtracting both gutters.
- `AdaptiveContent` remains a single ordered lane at every width. The resolver's
  `isColumnEligible` value is permission for a feature owner to evaluate composition at 834 and
  above, not an instruction to create columns.
- The existing Stack, native-tab, safe-area, keyboard-avoidance, and list inset owners remain
  authoritative. A responsive lane must not add a second safe-area inset.
- Forms remain one readable column at every supported portrait width.
- Optional columns (`G`) become eligible at 834 points, never at 768 or 800. They are allowed only
  for independent scan groups whose source and accessibility focus order remains meaningful when
  read top to bottom. Under large-text or width stress, the required fallback is one column.

### Presentation and use of extra width

- Calendar day/week canvases and the granted QR camera stay full bleed because width carries
  information. Agenda, prose, forms, management lists, and state messaging use a semantic lane.
- Wider layouts may expose more fixed-size Upcoming cards without stretching each card. A screen
  may use 834+ columns only when the screen-specific child proves a scanability benefit; centered
  single-column layout is the default and is not a failure to use tablet space.
- Native menus, alerts, pickers, header actions, FAB behavior, back behavior, and the current
  changelog modal presentation stay platform-owned. Only their inner feature content is eligible
  for lane sizing.

Rule keys in the matrix: `R` readable, `S` standard, `F` full bleed, `G` optional 834+ columns, and
`N` explicit no visual change needed. `P1` is a direct layout defect or strong quick win; `P2` is
bounded consistency work.

## Screen-by-screen matrix

| Route / surface                             | Current portrait-tablet behavior or problem                                                                                             | Proposed quick win or explicit disposition                                                                                                                                     | Priority | Owning child / workstream          | Width rule                            | Future verification                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/` frame, header, welcome, loading/error   | **Implemented:** one measured standard lane owns the feature header, status blocks, sections, scroll edges, and platform add affordance inside the existing safe area. | Phone composition, refresh, routing, source order, and platform chrome remain unchanged.                                                                                       | P1       | TIM-500 after TIM-499              | `S`, tablet ≥600                      | Focused Home tests cover 390/599/600/768/800/834/1024 lane metrics plus empty/error/refresh and platform actions.       |
| `/` Upcoming                                | **Implemented:** the horizontal scroller remains inside Home's standard lane and every card remains 200 points wide.                    | Wider measured lanes reveal more capacity without stretching cards or removing horizontal access.                                                                             | P2       | TIM-500                            | `S`; no `G` composition               | Home coverage asserts the fixed card width across the responsive boundary table and preserves event presses.           |
| `/` Today, all-day, timeline                | **Implemented:** the tile-area owner is the only positive pixel-width source; unmeasured content uses the interactive ordered reflow.   | Global window width remains a font-scale source only; positive remeasurements recalculate overlap and minimum-target behavior.                                                  | P1       | TIM-500                            | Measured `S`                          | Today coverage proves first measurement, narrower nested owner, remeasurement, overlap pixels, reflow, all-day, checklist, Dynamic Type, and presses. |
| `/calendar` day/week canvas and event tiles | **Verified unchanged:** the renderer-neutral timeline remains full bleed inside the Calendar content owner.                             | Agenda constraints do not enter or cap the renderer seam.                                                                                                                       | P1       | TIM-500 after TIM-499              | `F`                                   | Calendar coverage retains day/week tiles, actions, view changes, routing, date focus, and the uncapped full-bleed owner. |
| `/calendar` agenda, empty/error/refresh     | **Implemented:** status presentation and the refreshable SectionList share one measured standard lane.                                  | Grouping, sticky headers, checklist progress, routing, and refresh semantics remain unchanged.                                                                                  | P1       | TIM-500                            | `S` in agenda mode                    | Focused Calendar tests cover 390/600/768/834/1024 lane metrics plus loaded, empty, error, refresh, and row behavior.    |
| `/calendar` header/actions/view menu/FAB    | **Verified unchanged:** native Stack chrome still owns the title, view menu, Today, and Add behavior.                                   | Android's FAB remains an absolute child of the full Calendar bounds, outside the Agenda lane.                                                                                   | N        | TIM-500                            | `F` + `N`                             | Existing platform tests cover labels/actions/menu; focused ownership proof anchors the FAB to the full-bleed owner.     |
| `/event-details/[uid]` and checklist        | **Implemented:** loaded content, action failure, checklist, loading, and missing outcomes use one measured readable lane.                | The surface stays one ordered column at 834+ and preserves title → metadata → event action → checklist source/focus order.                                                      | P1       | TIM-500                            | `R`; no `G` composition               | Focused tests cover 390/768/834/1024 lane metrics and status semantics; existing details/checklist suites preserve actions and CRUD. |
| `/personal-events`                          | **Implemented:** header/Add, empty state, rows, and list edges share the measured standard lane.                                        | One reactive list and existing row labels, hints, and create/edit routes remain unchanged.                                                                                      | P2       | TIM-500                            | `S`                                   | Focused list coverage proves 390/600/768/800/834/1024 metrics plus empty/list/header and accessible row behavior.       |
| `/personal-event-form` create/edit/delete   | **Implemented:** the scroll body and keyboard-safe action footer share one measured readable lane.                                      | The form remains sequential and one column while preserving native pickers, validation, failures, confirmation, deletion, and navigation.                                     | P1       | TIM-500                            | `R`                                   | Focused form coverage proves matching body/footer metrics at 390/600/768/800/834/1024 and retains the complete CRUD suite. |
| `/onboarding` welcome carousel              | Pager top/content/footer independently cap at 800; copy and illustration read as an enlarged phone column.                              | Give page and action regions independent readable lanes without a padded outer lane; keep the illustration cap, page order, and motion behavior.                               | P1       | TIM-501                            | independent `R` regions               | Render every page at 390/768/800/834/1024; verify one compact gutter, reduced motion, large text, and visible controls. |
| `/onboarding/connect`                       | Short prose and actions occupy the shared 800-point step frame.                                                                         | Use a readable one-column lane; preserve vertical action order and external-link behavior.                                                                                     | P1       | TIM-501                            | `R`                                   | Cover optional states, navigation, centered width, and gutters at phone/tablet widths.                                 |
| `/onboarding/institution-name`              | A single field and CTA can expand to 800; keyboard layout is otherwise appropriate.                                                     | Use a readable one-column lane and retain current validation and keyboard avoidance.                                                                                           | P1       | TIM-501                            | `R`                                   | Test keyboard layout, validation, and CTA visibility at 390/768/800/1024.                                              |
| `/onboarding/programme`                     | The single-field step uses the same wide frame.                                                                                         | Use a readable one-column lane; preserve skip/continue and back behavior.                                                                                                      | P1       | TIM-501                            | `R`                                   | Test input, skip, validation, header/back, and large text across phone/tablet widths.                                  |
| `/onboarding/school`                        | Header/footer/rows use separate local 800 caps; empty-state vertical spacing depends on window height.                                  | Give rows, separators, feature-owned header/footer, and states one standard lane. Keep the native search header full width and unchanged.                                      | P1       | TIM-501                            | `S`; native header `N`                | Cover populated/search/no-result/loading/error/empty at all widths; assert shared row/separator edges.                 |
| `/onboarding/groups`                        | The tree list is already centered at 800 and usable but owns a local frame.                                                             | Adopt the shared standard lane; preserve hierarchy, one-column reading order, and confirm action.                                                                              | P2       | TIM-501                            | `S`                                   | Test deep nesting, selection, empty/error, large text, and confirm reachability at phone/tablet widths.                |
| `/onboarding/import`                        | Two import choices sit in the wide shared step frame.                                                                                   | Use a readable lane and keep both actions vertically ordered; do not add tablet-only routing.                                                                                  | P1       | TIM-501                            | `R`                                   | Verify both choices, labels, and navigation at 390/768/800/1024.                                                       |
| `/onboarding/ical-url`                      | Field, statuses, and actions share the 800-point cap and become too wide.                                                               | Use a readable lane; preserve validation, retry, import transition, and keyboard behavior.                                                                                     | P1       | TIM-501                            | `R`                                   | Cover idle/invalid/loading/failure/success transition and keyboard behavior at phone/tablet widths.                    |
| `/onboarding/qr-scan`                       | Permission states cap at 800; the granted camera fills the route with a fixed viewfinder and loosely bounded overlay content.           | Keep the camera full bleed; bound permission, guidance, recovery, and action content with readable/standard inner lanes without changing scanning.                             | P1       | TIM-501                            | `F` camera + `R/S` overlay            | Cover every permission/import state, undistorted preview, overlay bounds, and action reachability at all widths.       |
| `/user-calendars` and rename dialog         | The list has a local 800 cap and is shared by source and Settings workstreams; rename content is a separate presentation concern.       | TIM-501 is the sole responsive file owner: use a standard list lane and readable rename content without changing dialog presentation. TIM-502 verifies only entry/integration. | P1       | TIM-501 owner; TIM-502 integration | `S` list + `R` dialog                 | Test empty/list/FAB/header/rename/delete/large text at all widths and confirm no concurrent ownership.                 |
| `/settings`                                 | Grouped summary and destination sections now share one measured standard lane.                                                          | Implemented as one source-ordered column; optional columns remain unused.                                                                                                      | P2       | TIM-502                            | `S`                                   | Focused coverage preserves section order, summaries, badge, conditional rows, routing, and 390/768/800/834/1024 lanes. |
| `/appearance-settings`                      | Theme and language controls now share a measured readable lane.                                                                         | Implemented without changing native Picker Host or immediate preference behavior.                                                                                              | P1       | TIM-502                            | `R`                                   | Focused phone/tablet lane and preference-selection coverage passes.                                                    |
| `/timezone-settings`                        | The timezone picker now uses a measured readable lane.                                                                                  | Implemented while retaining its native header, option order, and immediate selection.                                                                                          | P1       | TIM-502                            | `R`                                   | Focused option, selection, and 800/1024 cap coverage passes.                                                           |
| `/notification-settings`                    | Controls and retry content now share a measured readable lane.                                                                          | Implemented while preserving native Picker/Switch, limits, persistence, and retry semantics.                                                                                   | P1       | TIM-502                            | `R`                                   | Focused behavior plus the 599/600 gutter transition passes.                                                            |
| `/hidden-events`                            | Loaded, empty, and write-error content now align to the measured standard lane.                                                         | Implemented without another vertical scroller; named-before-UID ordering and un-hide actions remain intact.                                                                    | P2       | TIM-502                            | `S`                                   | Focused empty/error/actions and 390/1024 lane coverage passes.                                                         |
| `/activity`                                 | The existing SectionList and every state/footer now use one measured standard lane.                                                     | Implemented at the virtualized-list/safe-area owner with no nested scroller or data-layer change.                                                                              | P2       | TIM-502                            | `S` + `N`                             | Focused dense/paged/loading/empty/error/refresh/navigation and 390/834 lane coverage passes.                           |
| `/about`                                    | Grouped actions use a measured standard lane while blurb/error prose uses readable bounds.                                              | Implemented as one source/focus-ordered column.                                                                                                                                | P2       | TIM-502                            | `S` + internal `R`                    | Focused metadata/actions/failures and nested 1024 lane coverage passes.                                                |
| `/changelog` history                        | Shared release content now resolves a measured readable lane from the presented owner.                                                  | Implemented with the regular native header and release order unchanged.                                                                                                        | P1       | TIM-502                            | `R`                                   | Focused history content coverage passes at 390/768/1024.                                                               |
| `/changelog-sheet`                          | Native presentation is unchanged; the shared inner body now measures a readable lane inside it.                                         | Implemented without route-option or acknowledgement-lifecycle changes.                                                                                                         | P1       | TIM-502 after TIM-499 shell check  | `R` + native `N`                      | Static platform-presentation and focused close/continue coverage passes.                                               |
| `/feedback`                                 | The keyboard-safe form now uses one measured readable lane.                                                                             | Implemented inside the existing keyboard/safe-area/scroll hierarchy with submission semantics unchanged.                                                                       | P1       | TIM-502                            | `R`                                   | Focused empty/prefilled/invalid/pending/failure/success and 390/768/800/1024 coverage passes.                          |
| Splash overlay                              | Verified unchanged: its absolute full-window overlay remains centered and non-stretched.                                                | **No change needed.** Full-window ownership, readiness, fade, accessibility, and reduced motion remain intact.                                                                 | N        | TIM-502                            | `F` shell + centered `N`              | Focused coverage passes at 390/768/800/834/1024 and for both motion branches.                                          |
| `/dev-import` transient states              | Verified unchanged: headerless states remain centered and self-routing.                                                                 | **No visual change needed.** The runtime gate and one-shot import behavior remain intact.                                                                                      | N        | TIM-502                            | `R` state + `N`                       | Focused production/loading/error/success behavior and multi-width composition coverage passes.                         |
| `/profile`, `/more`                         | Verified unchanged: both remain renderless redirects to `/settings`.                                                                    | **No change needed.** Static routing verification only.                                                                                                                        | N        | TIM-502                            | Routing `N`                           | Exact-source static guards reject responsive wrappers or route UI.                                                     |

## Ownership and merge order

1. TIM-499 owns the shared resolver/container API, responsive theme exports, focused boundary tests,
   shell/chrome verification, and any resulting current-state Architecture Book update.
2. TIM-500 owns Home, Calendar, event details/checklist integration, personal-events list, and the
   personal-event form.
3. TIM-501 owns onboarding, school/groups/import sources, QR scan, and the shared
   `calendar-sources/ui/user-calendars-screen.tsx` responsive edit including rename content.
4. TIM-502 owns Settings, notifications, hidden events, Activity, About, changelog, feedback,
   Splash/dev-import regression, and redirect verification. It must not concurrently edit the
   TIM-501-owned calendar-management screen.
5. TIM-503 owns the final full-route reconciliation and available automated/device regression. It
   records actual outcomes only after the implementation children have landed.

### TIM-501 implementation status

Implemented on the TIM-501 workstream:

- The welcome carousel leaves its safe-area root uncapped; page and action regions each own one
  readable lane, and the illustration retains its independent cap. At 390 points this preserves
  the shared 24-point compact gutter instead of nesting two gutters.
- Connect, institution name, programme, manual import, and iCal URL import use one-column readable
  lanes while retaining their safe-area, keyboard, validation, and navigation owners.
- School rows, separators, list header/footer, list states, and the group hierarchy share measured
  standard lanes; the native school search header remains unchanged and full width.
- QR permission content and overlay guidance/actions use readable lanes while the camera remains
  full bleed and the fixed-square viewfinder remains undistorted.
- User calendars use a measured standard lane, and the rename card sits inside a readable modal
  lane without changing modal presentation or calendar-source behavior.

Focused component checks exercise compact behavior through the resolver's existing boundary suite,
assert welcome page/action lanes at both 390 and 1024 points, and assert the other TIM-501
standard/readable lane caps at 1024 points. Existing state, navigation, keyboard, permission,
import, and calendar-management tests continue to cover behavioral parity.

TIM-499 lands first. TIM-500, TIM-501, and TIM-502 consume that established contract and may then
proceed according to their blocker graph; TIM-503 follows all implementation workstreams. Shared
responsive/theme/chrome files have one owner. If another workstream needs one of them, it rebases
after the owner lands and makes the narrow integration change rather than introducing a parallel
breakpoint or container.

## Verification contract for the child work

- Shared resolver tests: 390, 599, 600, 768, 800, 834, and 1024, plus a nested measured owner that
  is narrower than its global window. Boundary expectations are compact at 599, tablet at 600,
  single-column at 768/800, and merely column-eligible at 834/1024.
- Every changed screen: focused component coverage for its relevant loaded, loading, empty, error,
  dense, keyboard, overlay, large-text, and platform branch states. Assertions should target the
  resolved lane/composition and user-visible behavior, not duplicate resolver internals.
- Phone preservation: render the existing composition at 390 and keep interactions, navigation,
  safe areas, keyboard behavior, source/focus order, and touch targets unchanged.
- Static regression: preserve native route presentation, redirects, chrome import boundaries,
  dependency manifests, native orientation/device-family configuration, and existing Maestro
  selectors.
- Local checks belong to each implementation child. TIM-503 runs the repository-prescribed full
  mobile regression and records simulator/emulator evidence when available. Screenshots and
  subjective polish are useful evidence, not merge gates.

## Deferred, not quick wins

- Landscape, multitasking, master-detail navigation, sidebars, and custom tablet navigation require
  a separate product/native-contract decision.
- A custom modal system or per-device detection is not part of this responsive pass.
- Optional 834+ columns stay out of a child unless that child proves improved scanability, stable
  source/focus order, and a one-column large-text fallback.
- Redesigning calendar gestures, event density rules, onboarding sequence, form behavior, or any
  data/business flow is separate work.
- Physical-device or subjective polish findings that exceed these quick wins should be recorded as
  follow-ups rather than expanding the implementation children.
