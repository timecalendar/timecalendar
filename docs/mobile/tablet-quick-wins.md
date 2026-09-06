# Portrait-tablet quick wins

This is the implementation and regression ledger for the supported portrait-tablet contract.
Landscape, multitasking, sidebars, native configuration, and business behavior are outside this
contract.

## Shared responsive contract

- Measure the laid-out content owner with React Native `onLayout`. Do not infer nested, capped, or
  sheet content from a device model or the global window.
- `resolveResponsiveLayout` and `useResponsiveLayout` live in
  `mobile/src/components/responsive-layout.tsx`. An unknown or non-positive measurement is compact;
  compact is below 600 points and tablet begins at 600.
- Readable lanes cap at 640 points, standard lanes at 800, and full-bleed lanes have no cap.
  Compact gutters use `Spacing.four`; tablet gutters use `Spacing.six`.
- A two-column composition is only eligible at 834 points, for independent scan groups whose
  source and focus order remains meaningful. This pass retained one column everywhere because no
  optional column was needed to fix the audited defects. Forms always remain one column.
- The existing safe-area and navigation owners remain authoritative. Responsive lanes are applied
  inside those boundaries; screens do not add another safe-area inset.
- The changelog keeps the native iOS form-sheet and Android full-screen-modal presentation. Menus,
  alerts, pickers, headers, FABs, keyboard avoidance, and back behavior retain their platform
  conventions.

Rule keys: **R** readable, **S** standard, **F** full bleed, **G** optional 834+ columns, and **N**
verified no visual change. Target widths are 390, 599, 600, 768, 800, 834, and 1024 points/dp.

## Screen matrix

| Route / surface                      | Previous tablet behavior                                         | Shipped outcome                                                                                                                  | Priority / owner                        | Rule                 | Verification                                               |
| ------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------- | ---------------------------------------------------------- |
| `/` frame, header, welcome, statuses | Local 800 cap and fixed gutter                                   | Shared measured standard lane; header and body use the same adaptive gutter                                                      | P1 / TIM-500 after TIM-499              | S ≥600               | Home component tests + resolver table                      |
| `/` Upcoming                         | Fixed-width cards formed a phone strip                           | No card-size change needed; scroller consumes the standard lane without stretching cards                                         | P2 / TIM-500                            | S; G eligible at 834 | Home loaded/empty/error tests; resolver 834/1024 proof     |
| `/` Today timeline                   | Initial geometry depended on global window width                 | Tile geometry is owned by the reported tile-area layout; pre-layout uses only the minimum viable tile width                      | P1 / TIM-500                            | measured S           | Timeline dense-overlap, font-scale, and layout-event tests |
| `/calendar` day/week                 | Full-width information canvas                                    | No change needed: renderer remains full bleed and keeps gesture/tile behavior                                                    | P1 / TIM-500 after TIM-499              | F                    | Calendar and renderer suites                               |
| `/calendar` agenda and statuses      | Rows and states stretched across the tablet                      | Agenda list and its status lane are measured standard lanes                                                                      | P1 / TIM-500                            | S                    | Calendar agenda/empty/error tests                          |
| `/calendar` native header/menu/FAB   | Native ownership was already correct                             | No change needed; Stack header/menu and full-bleed FAB boundary stay authoritative                                               | N / TIM-500                             | F + N                | Static route/chrome and Calendar tests                     |
| `/event-details/[uid]` and checklist | Uncapped long lines and checklist                                | Loaded, loading, missing, and error content share one measured readable lane; no optional columns                                | P1 / TIM-500                            | R                    | Event-details and checklist suites                         |
| `/personal-events`                   | Local 800-point list cap                                         | Shared measured standard list lane                                                                                               | P2 / TIM-500                            | S                    | Personal-events list tests                                 |
| `/personal-event-form`               | Form and sticky footer could reach 800 points                    | Form and keyboard-safe footer share one measured readable lane                                                                   | P1 / TIM-500                            | R                    | Create/edit/validation/delete/form tests                   |
| `/onboarding`                        | Three separately capped pager regions                            | Measured standard outer lane, bounded illustration, and readable copy; page order and motion behavior unchanged                  | P1 / TIM-501                            | S + internal R       | Welcome pager, reduced-motion, and control tests           |
| `/onboarding/connect`                | Wide shared step frame                                           | Measured readable one-column lane                                                                                                | P1 / TIM-501                            | R                    | Connect optional-state and navigation tests                |
| `/onboarding/institution-name`       | Single field expanded to 800 points                              | Measured readable lane; keyboard and validation unchanged                                                                        | P1 / TIM-501                            | R                    | Institution form tests                                     |
| `/onboarding/programme`              | Single field expanded to 800 points                              | Measured readable lane; skip/continue/header behavior unchanged                                                                  | P1 / TIM-501                            | R                    | Programme form and route tests                             |
| `/onboarding/school`                 | Header/footer/rows used separate local 800 caps                  | Standard semantic width token aligns all three existing owners; native search header remains unchanged                           | P1 / TIM-501                            | S + native N         | Populated/search/empty/loading/error tests                 |
| `/onboarding/groups`                 | Local centered 800-point tree                                    | Measured standard lane; hierarchy and reading order unchanged                                                                    | P2 / TIM-501                            | S                    | Deep-tree, selection, empty/error tests                    |
| `/onboarding/import`                 | Two actions used the wide step frame                             | Measured readable lane with vertical action order retained                                                                       | P1 / TIM-501                            | R                    | Manual-import tests                                        |
| `/onboarding/ical-url`               | Field, state, and actions could reach 800 points                 | Measured readable lane; validation/retry/keyboard behavior unchanged                                                             | P1 / TIM-501                            | R                    | iCal URL state tests                                       |
| `/onboarding/qr-scan`                | Permission frame was wide; camera overlay actions were unbounded | Camera remains full bleed; permission states and recovery actions use measured readable bounds                                   | P1 / TIM-501                            | F camera + R overlay | Permission/import/recovery tests                           |
| `/user-calendars`                    | Shared management file used a local cap                          | TIM-501-owned screen now uses the measured standard lane; rename card caps at readable width. Settings entry is integration-only | P1 / TIM-501 owner, TIM-502 integration | S list + R dialog    | List, inset, rename/delete, large-font tests               |
| `/settings`                          | Local grouped-list cap                                           | Shared measured standard lane; no optional columns, preserving section/focus order                                               | P2 / TIM-502                            | S                    | Settings summary, badge, section-order tests               |
| `/appearance-settings`               | Controls could reach 800 points                                  | Measured readable lane; native Picker Host unchanged                                                                             | P1 / TIM-502                            | R                    | Appearance selection tests                                 |
| `/timezone-settings`                 | Single picker used the list cap                                  | Measured readable lane; native header and selection unchanged                                                                    | P1 / TIM-502                            | R                    | Timezone option/selection tests                            |
| `/notification-settings`             | Controls and error state could reach 800 points                  | Measured readable lane; Picker/Switch/action semantics unchanged                                                                 | P1 / TIM-502                            | R                    | Preference, permission, error/action tests                 |
| `/hidden-events`                     | Local list cap; state alignment differed                         | Measured standard lane shared by list, empty, and error states                                                                   | P2 / TIM-502                            | S                    | Named/UID/empty/error/un-hide tests                        |
| `/activity`                          | Local 800 cap was otherwise acceptable                           | Shared measured standard lane with aligned loading/empty/error/footer states; no redesign                                        | P2 / TIM-502                            | S + N                | Dense/paged/loading/empty/error tests                      |
| `/about`                             | Grouped content and prose shared one local cap                   | Standard responsive lane retained as one ordered column; no optional column introduced                                           | P2 / TIM-502                            | S + N                | Metadata/link/long-content tests                           |
| `/changelog` history                 | Release prose could reach 800 points                             | Shared measured readable lane                                                                                                    | P1 / TIM-502                            | R                    | Multi-release content tests                                |
| `/changelog-sheet`                   | Native presentation correct; inner content wide                  | Native presentation unchanged; shared inner changelog body is readable                                                           | P1 / TIM-502 after TIM-499              | R + native N         | Static presentation and changelog tests                    |
| `/feedback`                          | Keyboard-safe form could reach 800 points                        | Shared measured readable lane; form/keyboard/submission behavior unchanged                                                       | P1 / TIM-502                            | R                    | Empty/prefilled/invalid/pending/failure/success tests      |
| Splash overlay                       | Already centered and non-stretching                              | No change needed                                                                                                                 | N / TIM-502                             | F shell + centered N | Splash component/reduced-motion tests                      |
| `/dev-import`                        | Already centered and self-routing                                | No change needed                                                                                                                 | N / TIM-502                             | R state + N          | Production-inert/loading/error/success tests               |
| `/profile`, `/more`                  | Routing-only compatibility redirects                             | No change needed; both still redirect to `/settings` and render no UI                                                            | N / TIM-502                             | routing N            | `settings-route-structure.test.ts`                         |

## Ownership and overlap

- TIM-499 owns `mobile/src/components/responsive-layout.tsx`, its focused test, responsive width
  tokens, root chrome verification, and the Architecture Book contract.
- TIM-500 owns Home, Calendar, event details/checklist integration, and personal-event UI.
- TIM-501 owns onboarding, school/group/source UI, and the shared
  `calendar-sources/ui/user-calendars-screen.tsx` responsive edit, including its rename dialog.
- TIM-502 owns Settings, notification controls, hidden events, Activity, About, changelog, and
  feedback. It reads the Settings-to-user-calendars link but does not concurrently edit the shared
  management screen.
- TIM-503 owns the final matrix reconciliation and available-device regression evidence. Shared
  responsive/theme/chrome files have one owner; later workstreams make narrow integration edits
  after that owner lands.

## Verification ledger

- Formatting: changed TypeScript/Markdown files pass `npx prettier --check`.
- Types and lint: `cd mobile && npx tsc --noEmit && npm run lint` pass.
- Focused UI proof: the responsive and changed-screen run passes 27 suites and 301 tests;
  the final school-lane pass adds 2 suites and 28 tests.
- Coverage gate: `cd mobile && npm test -- --coverage` passes 152 suites and 1,321 tests,
  including the repository thresholds.
- Static route/chrome and selector proof:
  `cd mobile && npx jest src/components/settings-route-structure.test.ts e2e/maestro-selectors.test.ts --runInBand`
  passes 2 suites and 95 tests.
- `openspec validate tablet-responsive-quick-wins --strict` passes.
- `git diff --check` passes; the branch is current with `origin/main`.
- Native portrait device execution is CI-owned because the development host has no iOS simulator
  or Android virtualization. This is recorded evidence, not a physical-device or human gate.

## Deferred, not quick wins

- Landscape, multitasking, master-detail navigation, and sidebars require a separate product and
  native-contract decision.
- Optional 834+ multi-column layouts remain deferred until a screen demonstrates a scanability
  benefit while preserving source/focus order and large-text fallback.
- Screenshots and subjective visual approval are useful evidence but are not merge gates.
