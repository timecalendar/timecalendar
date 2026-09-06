# Portrait-tablet quick-win audit

This document is the implementation plan and ownership ledger for the portrait-tablet work in
TIM-499 through TIM-503. It describes the current React Native UI on `main` and proposes bounded
follow-up work; it does not describe responsive behavior as already implemented.

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
existing chrome seam. It introduces no dependency and does not require an Architecture Book change
in this audit PR; TIM-499 will document the durable current-state rule when its API exists.

## Proposed responsive contract

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
| `/` frame, header, welcome, loading/error   | The frame and safe-area owner independently cap at 800; header and body rely on fixed gutters.                                          | Adopt one measured standard lane inside the existing safe-area owner; align header and body and keep welcome full-row.                                                         | P1       | TIM-500 after TIM-499              | `S`, tablet ≥600                      | Render loaded/loading/error at 390/768/800/834/1024; assert common edges and phone parity.                             |
| `/` Upcoming                                | Fixed 200-point cards remain a phone-like strip inside a wide capped frame.                                                             | Keep card width and horizontal access. At 834+ expose more cards through available lane width; do not stretch cards or require columns.                                        | P2       | TIM-500                            | `S`; `G`-eligible ≥834                | Check fixed card size/touch targets at 390/768 and additional visible capacity at 834/1024.                            |
| `/` Today, all-day, timeline                | Initial tile geometry uses global window width even though the parent is capped; a later tile-area `onLayout` can disagree at 834/1024. | Resolve tile geometry from the reported tile-area width from the first usable measurement onward; keep event math and behavior unchanged.                                      | P1       | TIM-500                            | Measured `S`                          | Table-test reported widths, dense overlaps, all-day rows, and font scale at every target class.                        |
| `/calendar` day/week canvas and event tiles | Full-width rendering is appropriate, but width ownership is implicit.                                                                   | **No cap needed.** Keep the renderer full bleed and feed actual laid-out renderer width where custom geometry requires it.                                                     | P1       | TIM-500 after TIM-499              | `F`                                   | Verify fill/no clipping, minimum-legibility behavior, dense overlaps, and gestures at 390/768/800/834/1024.            |
| `/calendar` agenda, empty/error/refresh     | Agenda rows and state content stretch across the full tablet route.                                                                     | Center agenda and its state/refresh content in a standard lane while other calendar modes remain full bleed.                                                                   | P1       | TIM-500                            | `S` in agenda mode                    | Assert mode-specific wrapper and loaded/empty/error/refresh alignment at phone and tablet widths.                      |
| `/calendar` header/actions/view menu/FAB    | Native Stack header already owns month title, view menu, Today, and Add.                                                                | **No header/menu change needed.** Keep native ownership; only verify an in-content Android FAB remains anchored to full-bleed bounds.                                          | N        | TIM-500                            | `F` + `N`                             | Exercise labels/actions/menu and platform FAB edge offset at all target widths.                                        |
| `/event-details/[uid]` and checklist        | Loaded and state content is uncapped; long metadata and checklist rows span the tablet.                                                 | Use a readable lane for loaded/loading/missing/error content. Consider 834+ grouping only if the child proves title → metadata → actions → checklist focus order.              | P1       | TIM-500                            | `R`; optional `G` ≥834                | Cover long text, all states, checklist CRUD, large text, and accessibility order at 390/768/834/1024.                  |
| `/personal-events`                          | The list is already centered at 800 and usable but owns a local frame.                                                                  | Adopt the shared standard lane; keep one list and existing Add/header behavior.                                                                                                | P2       | TIM-500                            | `S`                                   | Check empty/list/header at every target width and ensure rows never exceed 800.                                        |
| `/personal-event-form` create/edit/delete   | The one-column form and keyboard-safe footer use the 800-point list cap, yielding overly wide fields.                                   | Put form and footer in the same readable lane; preserve keyboard avoidance, native pickers, alerts, and action order.                                                          | P1       | TIM-500                            | `R`                                   | Cover create/edit/validation/error/delete and footer reachability at 390/768/800/1024 plus large text.                 |
| `/onboarding` welcome carousel              | Pager top/content/footer independently cap at 800; copy and illustration read as an enlarged phone column.                              | Use a standard outer lane with separately bounded illustration and readable copy/action regions; keep page order and motion behavior.                                          | P1       | TIM-501                            | `S` with internal `R`                 | Render every page at 390/768/800/834/1024; verify reduced motion, large text, and visible controls.                    |
| `/onboarding/connect`                       | Short prose and actions occupy the shared 800-point step frame.                                                                         | Use a readable one-column lane; preserve vertical action order and external-link behavior.                                                                                     | P1       | TIM-501                            | `R`                                   | Cover optional states, navigation, centered width, and gutters at phone/tablet widths.                                 |
| `/onboarding/institution-name`              | A single field and CTA can expand to 800; keyboard layout is otherwise appropriate.                                                     | Use a readable one-column lane and retain current validation and keyboard avoidance.                                                                                           | P1       | TIM-501                            | `R`                                   | Test keyboard layout, validation, and CTA visibility at 390/768/800/1024.                                              |
| `/onboarding/programme`                     | The single-field step uses the same wide frame.                                                                                         | Use a readable one-column lane; preserve skip/continue and back behavior.                                                                                                      | P1       | TIM-501                            | `R`                                   | Test input, skip, validation, header/back, and large text across phone/tablet widths.                                  |
| `/onboarding/school`                        | Header/footer/rows use separate local 800 caps; empty-state vertical spacing depends on window height.                                  | Give rows, separators, feature-owned header/footer, and states one standard lane. Keep the native search header full width and unchanged.                                      | P1       | TIM-501                            | `S`; native header `N`                | Cover populated/search/no-result/loading/error/empty at all widths; assert shared row/separator edges.                 |
| `/onboarding/groups`                        | The tree list is already centered at 800 and usable but owns a local frame.                                                             | Adopt the shared standard lane; preserve hierarchy, one-column reading order, and confirm action.                                                                              | P2       | TIM-501                            | `S`                                   | Test deep nesting, selection, empty/error, large text, and confirm reachability at phone/tablet widths.                |
| `/onboarding/import`                        | Two import choices sit in the wide shared step frame.                                                                                   | Use a readable lane and keep both actions vertically ordered; do not add tablet-only routing.                                                                                  | P1       | TIM-501                            | `R`                                   | Verify both choices, labels, and navigation at 390/768/800/1024.                                                       |
| `/onboarding/ical-url`                      | Field, statuses, and actions share the 800-point cap and become too wide.                                                               | Use a readable lane; preserve validation, retry, import transition, and keyboard behavior.                                                                                     | P1       | TIM-501                            | `R`                                   | Cover idle/invalid/loading/failure/success transition and keyboard behavior at phone/tablet widths.                    |
| `/onboarding/qr-scan`                       | Permission states cap at 800; the granted camera fills the route with a fixed viewfinder and loosely bounded overlay content.           | Keep the camera full bleed; bound permission, guidance, recovery, and action content with readable/standard inner lanes without changing scanning.                             | P1       | TIM-501                            | `F` camera + `R/S` overlay            | Cover every permission/import state, undistorted preview, overlay bounds, and action reachability at all widths.       |
| `/user-calendars` and rename dialog         | The list has a local 800 cap and is shared by source and Settings workstreams; rename content is a separate presentation concern.       | TIM-501 is the sole responsive file owner: use a standard list lane and readable rename content without changing dialog presentation. TIM-502 verifies only entry/integration. | P1       | TIM-501 owner; TIM-502 integration | `S` list + `R` dialog                 | Test empty/list/FAB/header/rename/delete/large text at all widths and confirm no concurrent ownership.                 |
| `/settings`                                 | Grouped sections cap at 800 and are usable, though 1024 leaves long horizontal row bands.                                               | Adopt the standard lane. Optional 834+ whole-section columns require stable source/focus order; never split a section.                                                         | P2       | TIM-502                            | `S`; optional `G` ≥834                | Cover section order, summaries, badge, conditional rows, 390/768/800/834/1024, and large-text fallback.                |
| `/appearance-settings`                      | Two controls stretch within an 800-point frame.                                                                                         | Use a readable lane; retain the native Picker Host and immediate preference behavior.                                                                                          | P1       | TIM-502                            | `R`                                   | Assert selected state, native host boundary, and readable cap at phone/tablet widths.                                  |
| `/timezone-settings`                        | A single picker uses the 800-point list cap.                                                                                            | Use a readable lane; preserve native header and immediate selection.                                                                                                           | P1       | TIM-502                            | `R`                                   | Assert header, options, selection, and cap at 390/768/800/1024.                                                        |
| `/notification-settings`                    | Controls plus loading/error/destructive states stretch to 800.                                                                          | Use a readable lane; keep native Picker/Switch and all permission/action semantics.                                                                                            | P1       | TIM-502                            | `R`                                   | Cover preference, permission, loading/error, and destructive states at phone/tablet widths.                            |
| `/hidden-events`                            | The centered 800-point list is acceptable but local; empty/error alignment differs from related management screens.                     | Adopt the standard lane and shared centered state treatment; keep one column.                                                                                                  | P2       | TIM-502                            | `S`                                   | Cover named/UID sections, empty/error, and un-hide action at every width class.                                        |
| `/activity`                                 | The SectionList is already centered at 800 and readable; pagination/status rows use the same local ownership.                           | No redesign needed. Adopt the standard lane when available and align loading/empty/error/footer states.                                                                        | P2       | TIM-502                            | `S` + `N`                             | Cover dense/paged/loading/empty/error, sticky behavior, and accessibility order across widths.                         |
| `/about`                                    | Grouped content caps at 800; descriptive prose can remain wider than comfortable.                                                       | Keep standard sections and give long copy readable inner bounds. Optional 834+ whole-section columns must preserve order.                                                      | P2       | TIM-502                            | `S` + internal `R`; optional `G` ≥834 | Test metadata/actions, unavailable links, long localization, large text, and focus order.                              |
| `/changelog` history                        | Shared release content caps at 800, leaving long prose lines.                                                                           | Use a readable lane; retain native header and chronological order.                                                                                                             | P1       | TIM-502                            | `R`                                   | Render several releases and long notes at phone/tablet widths.                                                         |
| `/changelog-sheet`                          | Native iOS form-sheet/Android full-screen presentation is correct; inner release content still uses 800.                                | Keep presentation exactly as configured and constrain only the shared inner body to the readable lane.                                                                         | P1       | TIM-502 after TIM-499 shell check  | `R` + native `N`                      | Assert route options statically and render inner content at representative presented widths on both platform branches. |
| `/feedback`                                 | The keyboard-safe form is centered at 800, producing wide fields and helper text.                                                       | Use a readable lane; preserve parameter limits, validation, submission states, and keyboard avoidance.                                                                         | P1       | TIM-502                            | `R`                                   | Cover empty/prefilled/invalid/pending/failure/success and keyboard behavior at 390/768/800/1024.                       |
| Splash overlay                              | Logo and progress content are already centered and do not stretch.                                                                      | **No change needed.** Preserve its full-window overlay ownership and safe scaling.                                                                                             | N        | TIM-502                            | `F` shell + centered `N`              | Re-run component/static checks at all target classes and with reduced motion.                                          |
| `/dev-import` transient states              | Headerless loading/error/success content is already centered and self-routes.                                                           | **No visual change needed.** Reuse a readable centered-state primitive only if TIM-502 can do so without behavior churn.                                                       | N        | TIM-502                            | `R` state + `N`                       | Verify production-inert and loading/error/success transitions at phone/tablet widths.                                  |
| `/profile`, `/more`                         | Both routes redirect to `/settings` and render no feature UI.                                                                           | **No change needed.** Routing verification only.                                                                                                                               | N        | TIM-502                            | Routing `N`                           | Keep the static redirect contract; width must not introduce rendered content.                                          |

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
