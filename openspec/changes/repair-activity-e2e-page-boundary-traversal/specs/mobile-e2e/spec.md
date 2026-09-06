## MODIFIED Requirements

### Requirement: The Activity flow proves the real unread and pagination round trip

The mobile Maestro suite SHALL contain one top-level `activity.yaml` flow, shared unchanged across
iOS and Android, that uses the harness-managed NestJS/Postgres server and the generated v1
calendar-log client with nothing mocked.

The flow SHALL first import the dedicated older baseline calendar into cleared app state, open
Activity so the baseline server timestamp becomes the local read watermark, and positively verify
that the baseline history rendered. It SHALL then import the dedicated newer Activity calendar
without clearing app state, causing the real sync-triggered Activity refresh to search both held
tokens with the baseline watermark.

The flow SHALL observe the exact non-zero unread state on the Settings Activity row, open Activity,
and then prove that the same unread state is absent while the Settings row remains present. It SHALL
pull to refresh and then traverse to the page boundary at the foot of history, observing the
same-timestamp pair and the older-page anchor and asserting their rendered order.

That traversal SHALL be bounded by the distance each gesture covers, not by a widened clock:
every page-boundary scroll SHALL carry an explicit fast scroll speed and SHALL keep the
suite-standard 60 000 ms bound.

The baseline and newer imports MAY be nested Activity-only subflows, but only `activity.yaml` SHALL
be top-level so the harness does not execute setup fragments independently.

#### Scenario: Staged imports produce and clear the unread badge

- **WHEN** the flow marks the older baseline read and then imports and synchronizes the 52-row newer
  calendar without clearing device state
- **THEN** Settings exposes the Activity row with exactly 52 unread changes
- **AND** opening Activity renders the newer server-backed history and clears that unread state
- **AND** reopening Settings positively finds the Activity row without the previously observed
  unread accessible name

#### Scenario: Pull-to-refresh keeps the real timeline available

- **WHEN** the flow performs a native pull gesture at the top of the populated Activity list
- **THEN** the forced newest-page path completes without blanking or replacing the cached timeline
- **AND** a known first-page item remains visible

#### Scenario: Scrolling loads the real older page

- **WHEN** the flow scrolls until the lower-ID same-timestamp boundary item or older-page anchor is
  visible
- **THEN** that item renders from a real following-page response
- **AND** the first-page member of the timestamp pair was observed earlier in the journey

#### Scenario: The boundary rows are asserted in order

- **WHEN** the traversal reaches the foot of the list, where the first response's last row and
  both second-response rows are on screen together
- **THEN** the flow asserts `tie-higher` renders above `tie-lower`, and `tie-lower` above
  `older-anchor`
- **AND** those relative assertions are additive: every existing visibility assertion on the
  three rows remains

### Requirement: Flow selectors resolve against the shipped app

Every selector id used by a Maestro flow SHALL resolve to a `testID` that exists in
`mobile/src`. A repository proof running in the **baseline** gate SHALL enforce this, so a UI
rework that removes a `testID` fails at the commit that causes it rather than at an on-demand
native run.

Resolution SHALL account for how both sides are actually written, because a literal
string comparison misclassifies working selectors as broken: a flow `id:` value SHALL be
matched as an anchored **regular expression**, a `testID` SHALL be collected whether it is
written as a JSX attribute or as an object property, and a template-literal `testID` SHALL
stand for the family of ids sharing its static parts.

No flow selector SHALL be left unresolved. If one ever must be deferred it SHALL be
enumerated in a documented allowlist carrying its follow-up ticket, and the proof SHALL also
fail when an allowlisted id becomes present, so the allowlist cannot rot.

Where a shipped control carries no `testID` at all — a native-header search bar, whose
`react-native-screens` options object exposes none — the flow SHALL address it by its
English label, the same locale assumption the suite's existing text assertions already make.

The shared calendar-family flows SHALL reach the agenda surface through the calendar-view
header control (`calendar-view`) and the locale-stable "Agenda" entry of its menu — one
interaction shared by both platforms, with no per-platform selector or branch.

#### Scenario: A UI rework removes a testID a flow depends on

- **WHEN** a change deletes or renames a `testID` that a Maestro flow selects by id
- **THEN** the baseline gate fails on that change
- **AND** the failure names the flow file, the line, and the unresolved id

#### Scenario: A selector or testID is not a plain literal

- **WHEN** a flow selects by a regex id, or the app declares a `testID` as an object property or a template literal
- **THEN** the proof resolves it rather than reporting it as drift
- **AND** no working id is admitted to the allowlist to silence a false positive

#### Scenario: The calendar-family flows switch to the agenda view

- **WHEN** `calendar.yaml` or `hidden-events.yaml` needs the agenda surface
- **THEN** it taps the `calendar-view` control and selects "Agenda", the same steps on Android and iOS
- **AND** `calendar.yaml` asserts the agenda list (`agenda-section-list`) mounted, which happens only in the agenda view
- **AND** the seeded-title round-trip assertions that follow are unchanged

#### Scenario: The onboarding flows reach a moved entry point

- **WHEN** `ical-import.yaml` needs the "Add by URL" entry, which moved off the welcome screen onto the school step
- **THEN** it advances the welcome carousel, takes the final CTA into the school step, and taps the "I can't find my school" action there
- **AND** `onboarding.yaml` addresses the native-header search bar by its placeholder, since that control can carry no `testID`
- **AND** both flows' existing assertions are unchanged

#### Scenario: A flow reaches a row below the fold

- **WHEN** a flow selects a control that renders outside the first screenful — the Settings
  hub's `settings-feedback` and `settings-environment` rows, or a today-timeline tile whose
  distance down the fixed-scale grid depends on the seeded event's time of day, or the restored
  hide target that follows its visible non-hidden control in the Agenda
- **THEN** it reaches that control with `scrollUntilVisible` rather than a plain visibility
  wait, because the repository proof resolves ids in source and cannot observe the device
  viewport — an existing `testID` below the fold otherwise fails identically to a deleted one
- **AND** unless the control is the last element on its screen, the reveal SHALL centre it
  (`centerElement: true`), because a scroll stops the instant the target first peeks in at the
  bottom edge — where iOS draws the floating tab bar over it — and the hierarchy still reports
  it visible, so the scroll and the following `tapOn` both report `COMPLETED` while the tap
  lands on the tab bar and silently navigates elsewhere
- **AND** where the revealed content is painted by the startup sync rather than the first
  render, the flow SHALL wait on an element the sync produces before scrolling, so the scroll
  cannot race the render and exhaust an empty list
- **AND** a final positive assertion SHALL follow the restored hide target's centred reveal,
  preserving the hide → absent → un-hide → present round trip rather than treating the scroll
  command alone as its terminal proof

#### Scenario: A known-stale selector is repaired

- **WHEN** an id listed in the proof's known-stale allowlist is reintroduced as a real `testID`
- **THEN** the proof fails until that id is removed from the allowlist

#### Scenario: A native header exposes an accessibility label distinct from its visual text

- **WHEN** a shared flow drives a native header action whose visual title differs from the
  accessibility label exposed in the Maestro hierarchy, such as the event-details `Hide`
  action exposed as `Hide this event`
- **THEN** the flow selects the action by the complete accessibility label that both platforms
  expose, rather than by visual text that exists in a screenshot but not in the hierarchy
- **AND** the interaction remains shared across Android and iOS and retains the following
  application assertion or round-trip proof
- **AND** where that label is not unique in the hierarchy, the flow disambiguates it per the
  collision scenario below rather than relying on match order

#### Scenario: A selector matches a second live element

- **WHEN** a flow's text or accessibility-label selector matches more than one element
  present in the hierarchy at the same moment — as the event-details header action and the
  native Alert chooser option do, both exposing the byte-identical `Hide this event` from
  two different i18n keys
- **THEN** the flow SHALL disambiguate with a relative anchor only the intended element can
  satisfy: the chooser option is selected `below:` the Alert title `Hide event`, a
  full-match regex no colliding string satisfies and which the header — drawn above the
  alert on both platforms — can never sit under
- **AND** the flow SHALL first wait on an element unique to the disambiguating surface (the
  chooser's `Hide all events of the same name`), so an alert that never presents fails
  explicitly at a named step instead of silently re-tapping the first match
- **AND** the disambiguation SHALL stay cross-platform, with no per-platform selector or
  branch, and SHALL NOT weaken the round trip the flow proves
- **AND** the repository selector proof is not expected to catch this class: it resolves ids
  in source and cannot observe runtime ambiguity, the same limit the below-the-fold scenario
  records — a colliding selector fails only on a device, and it fails downstream of the tap,
  at an assertion that names an unrelated element

#### Scenario: A flow command succeeds on one platform and is a no-op on the other

- **WHEN** a shared flow issues a command whose implementation differs per platform — as
  Maestro's bare `back` does, driving Android's hardware back key but a left-edge swipe on
  iOS, which reports `COMPLETED` without popping a native-stack screen
- **THEN** the flow SHALL NOT use that command, and SHALL re-enter a root screen with the
  shared `stopApp` + `launchApp` restart idiom instead
- **AND** the repository selector proof SHALL reject a bare `back` in any flow, naming the
  file and line
- **AND** unlike the below-the-fold and collision classes, this one IS statically decidable:
  the command is a literal in the flow, so the proof catches it without a device — and it
  must, because the platform that passes hides it, and the platform that fails reports it as
  a timed-out assertion on the screen the flow believed it had already left

#### Scenario: A cold-launch readiness wait is outlasted by a degraded runner

- **WHEN** a flow's first wait after a `launchApp` — a readiness bound on how long the device
  may take to render, not a claim about application behaviour — expires because the
  release-config launch was abnormally slow, as in run `33216821519` where `launchApp` alone
  took 75.8 s and the following 60 s wait then elapsed in full
- **THEN** the retry budget SHALL NOT be widened to cover it: the attempt is past `launchApp`
  and its last record is a failed assertion, so classifying it retryable would weaken the
  assertion guard that runs first — and a first-screen assertion is exactly where a genuine
  boot regression also surfaces
- **AND** the readiness wait itself SHALL instead be sized for the slowest observed runner
  rather than the typical one, at every site where it immediately follows a `launchApp`, so
  the same degraded session cannot terminate a different flow at the same gate
- **AND** the site SHALL record the measured launch duration and the run it came from, so a
  future reader can tell a provenance-backed bound from an arbitrary one
- **AND** this widening is sound because it is one-directional: a longer wait converts only a
  slow render into a pass, while an app that never renders the awaited element fails at the
  raised bound exactly as it did at the original one — it cannot produce a false green
- **AND** the class is distinguished from a true assertion failure by its command record: a
  handful of commands ending at the launch gate, against the many recorded commands and
  genuinely-rendered element of the collision class

#### Scenario: A seeded fixture is outlived by the job that observes it

- **WHEN** a native job seeds its fixture calendar once at start-up and then runs long enough
  to cross a UTC midnight before a flow asserts that fixture through the agenda, whose window
  is `[today 00:00, today + 7 days)` and forward-only, recomputed from the **device** clock at
  the moment the flow mounts it — as in run `33220510226`, where the server seeded on Aug 28,
  iOS reached `hidden-events` on Aug 29, and the agenda rendered `No events this period.`
- **THEN** the failure SHALL be classified as a seed/date-contract defect and not as a defect
  in the feature under test: every command up to the assertion completed, the hide chooser was
  tapped, and only the observation window moved
- **AND** a fixture asserted through the agenda SHALL be anchored on the UTC day **after** the
  seed run, which lies inside the window from both the seed day's anchor and the next day's,
  so one crossing cannot move it out; the flow's runtime is bounded far below a second crossing
- **AND** its title SHALL be date-neutral, because a `Today`-named event that is deliberately
  not today sends the next reader hunting an application bug
- **AND** a non-hidden control asserted alongside a target SHALL share the target's day: a
  control exists to keep an empty view from satisfying `assertNotVisible` vacuously, and one
  that does not outlive the crossing its target survives stops doing that job on exactly the
  run that needs it
- **AND** a flow that can only be satisfied by the seed day — the _today_ timeline — SHALL keep
  that anchor, with its residual one-crossing exposure recorded and pinned by the seed proof
  rather than left to be re-derived from a red gate
- **AND** the contract SHALL be proven without a database, by a pure builder taking the seed
  instant, since what breaks here is date arithmetic and a mocked repository would exercise the
  ORM instead

#### Scenario: A first-page pagination traversal outruns its scroll budget

- **WHEN** a real-server Activity flow must traverse to the final row of its 50-row first page,
  and a native gate shows both platforms still making forward progress when the scroll bound
  expires — every gesture advancing, none stalling
- **THEN** the diagnosis SHALL be the gesture, not the clock: at the default scroll speed the
  swipe is a drag too slow to fling, so the list advances well under one screen per gesture
  while the fixture is roughly thirteen screens tall
- **AND** the traversal SHALL be repaired by setting an explicit fast scroll speed on each
  page-boundary scroll, and the bound SHALL be the suite-standard 60 000 ms — a previously
  widened bound SHALL be restored rather than widened again
- **AND** a fast fling SHALL be admissible only where maximum overshoot lands on the target
  rather than past it, which holds while the boundary rows are the last rows of history; the
  flow SHALL record that dependency, since a fixture that adds rows below them voids it
- **AND** a focused repository proof SHALL derive the boundary from its two real sources — the
  seed script's log count and the client's page limit — and SHALL fail if any page-boundary
  bound is widened, the fast speed is dropped, the three pagination selectors are reordered, or
  the order assertions are removed

#### Scenario: A merged onboarding journey moves the URL-import entry deeper

- **WHEN** the school step's unlisted-institution action no longer opens the iCal URL screen
  directly, but instead begins the shipped institution → programme → connect → manual-import
  journey
- **THEN** `ical-import.yaml` SHALL follow that shared journey through stable shipped ids and
  select the manual-import screen's URL option, rather than timing out on the institution step
  or deep-linking around the user-visible entry
- **AND** the existing URL-screen title and empty-submit validation assertions SHALL remain
  unchanged, with no platform-specific selector or branch
- **AND** a focused repository proof SHALL pin the inserted route edges in order, so a future
  navigation change fails the baseline gate before another native cycle

#### Scenario: A controlled input echoes a stale value across an erase boundary

- **WHEN** a native flow clears a controlled input immediately before typing a value that will be
  sent by an irreversible Save action, and a late controlled-state echo can restore a suffix from
  the seeded value
- **THEN** the flow SHALL cross a second consecutive erase boundary before entering the target
  value
- **AND** Save SHALL remain gated behind a bounded selector that conjunctively matches the input
  id and the complete exact target value, so any remaining prefix or suffix fails before the
  server mutation
- **AND** a focused repository proof SHALL pin the two erases, exact in-field gate, Save order,
  and the existing local-write plus wiped-device server-convergence assertions

#### Scenario: Keyboard dismissal fails after the next control is actionable

- **WHEN** a shared flow has entered its value and the captured hierarchy already exposes the
  next Continue control as visible and enabled, but a keyboard-dismiss command fails because the
  input is already unfocused while native keyboard chrome remains in the hierarchy
- **THEN** the flow SHALL remove that terminal dismiss command and wait for the existing Continue
  control with a bounded id selector before tapping it
- **AND** the flow SHALL retain the explicit Continue interaction rather than substituting a
  return-key submission, optional command, platform branch, or deep link around the route
- **AND** a focused repository proof SHALL reject any keyboard-dismiss command and pin each
  input → matching Continue wait → matching Continue tap sequence

#### Scenario: A merged checklist-summary journey retains obsolete navigation

- **WHEN** the pull-request merge result adds checklist progress assertions to a shared flow but
  carries an agenda selector removed from the shipped calendar header, a bare seeded-title
  selector, or a platform-asymmetric `back` command
- **THEN** the flow SHALL enter Agenda through the shared `calendar-view` menu and use the
  cross-platform composed-label regex for every event-container interaction
- **AND** after toggling the local checklist row it SHALL cold re-enter Calendar without clearing
  state, dismiss the optional iOS system confirmation, wait for Calendar readiness, and navigate
  through the same shared Agenda control before requiring the exact `1/1` progress id
- **AND** it SHALL reopen the real seeded event and retain the hard-delete cleanup, so the local
  SQLite add → type → toggle → progress → reopen → delete round trip is not weakened
- **AND** a focused repository proof SHALL pin the ordered re-entry and fail if the stale agenda
  id, a bare seeded title, or a bare `back` command returns

#### Scenario: A cancelled destructive prompt must preserve a row across native-stack exit

- **WHEN** a shared flow cancels a destructive native prompt on a pushed edit screen and must
  leave that screen before proving the persisted row remains
- **THEN** it SHALL re-enter the owning root route with `stopApp` → deep link → optional iOS
  confirmation, without clearing application state
- **AND** it SHALL wait for the exact preserved row before reopening it, explicitly confirm the
  destructive action, and require the same exact row to become absent
- **AND** a focused repository proof SHALL reject a bare `back`, missing or reordered cold
  re-entry, a weakened preserved-row assertion, or a weakened confirmed-deletion assertion

#### Scenario: A successful keyboard command navigates away from the asserted screen

- **WHEN** a shared checklist flow types a row and a keyboard-dismiss command reports success but
  acts as Android Back because the input is already unfocused
- **THEN** the flow SHALL contain no keyboard-dismiss command and SHALL first wait up to 15 seconds
  for one selector that conjunctively matches the live checklist input id and exact typed value
- **AND** it SHALL cold re-enter Calendar without clearing state, reopen the seeded event, and
  require the persisted typed row before toggling it
- **AND** the subsequent exact progress proof, reopen, hard-delete, and exact absence assertion
  SHALL remain in order, with a focused mutation proof rejecting any lost or reordered stage

#### Scenario: A hierarchy-visible onboarding CTA is covered by the keyboard

- **WHEN** iOS exposes an institution or programme Continue control in the accessibility hierarchy
  while native keyboard chrome physically covers its tappable bounds
- **THEN** the institution form SHALL retain its device-proven keyboard-avoiding
  scroll/tap-handling layout, while the programme form SHALL place its existing Continue control as
  a sticky sibling after the scroll and inside the same keyboard-avoiding view
- **AND** the shared flow SHALL gate each explicit CTA tap behind both an exact conjunctive
  input-id/value wait and the existing bounded CTA-id wait, with no keyboard-dismiss command,
  Return-key submission, coordinate tap, optional route proof, deep-link bypass, or platform fork
- **AND** focused component and flow mutation proofs SHALL fail if either CTA can return behind the
  iOS keyboard, either exact value gate is removed or widened, or either CTA tap is bypassed

#### Scenario: A focused exact-value input is covered by the keyboard

- **WHEN** a shared checklist flow has entered the exact typed value and the focused input remains
  in the hierarchy but its bounds sit behind the software keyboard, so Maestro marks it not visible
- **THEN** the flow SHALL scroll the same conjunctive input-id and exact-value selector downward
  until it is 100% visible and centred, within a bounded 30-second reveal
- **AND** that reveal SHALL precede the existing bounded exact-value visibility gate and SHALL be
  shared across platforms and inert when the input is already fully visible
- **AND** the subsequent state-preserving cold re-entry, persisted-row assertion, toggle/progress,
  hard-delete, and exact absence proof SHALL remain in order
- **AND** focused mutation proof SHALL reject a removed, widened, reordered, uncentred, or
  partially-visible reveal and any weakening of the readiness gate or persistence round trip

#### Scenario: A focused field covers and consumes its Continue transition

- **WHEN** a focused institution or programme field leaves its body Continue control behind the
  software keyboard, and the first otherwise-successful CTA tap can be consumed only to dismiss or
  defocus that keyboard
- **THEN** the flow SHALL reveal the matching Continue id downward until it is 100% visible and
  centred within 30 seconds before retaining the existing bounded CTA visibility wait
- **AND** it SHALL keep the required CTA tap followed by exactly one optional same-id tap, so the
  fallback is inert after navigation but performs the transition when the first tap only changes
  keyboard state
- **AND** the next-screen wait SHALL remain mandatory and SHALL prove the route transition
  non-vacuously, with no platform fork, keyboard-dismiss command, Return submission, coordinate tap,
  selector widening, or route bypass
- **AND** focused mutation proof SHALL reject a missing, widened, reordered, uncentred,
  partially-visible, or unbounded reveal; a removed or required fallback; a missing required tap;
  or a bypassed downstream route wait

#### Scenario: A scroll-contained programme CTA remains physically occluded

- **WHEN** the exact programme value gate, full centred reveal, bounded CTA wait, required CTA tap,
  and optional same-id fallback all complete, but the mandatory Connect wait expires with the
  focused keyboard still physically covering the programme CTA
- **THEN** the existing programme CTA SHALL move unchanged out of the `ScrollView` and become the
  immediate sticky sibling after that scroll while remaining inside the existing
  `KeyboardAvoidingView`
- **AND** the scroll SHALL contain zero programme CTAs, the avoiding view SHALL contain exactly one,
  and focused mutation proof SHALL reject moving it back inside the scroll, outside the avoiding
  view, before the scroll, duplicating it, or losing iOS `padding` or scroll tap-handling semantics
- **AND** the institution screen and the shared programme sequence SHALL remain unchanged, so the
  next native gate still proves the explicit visible CTA transition rather than a Return-key,
  keyboard-dismiss, coordinate, platform-fork, optional-route, or deep-link bypass

#### Scenario: An exact controlled-input suffix survives both erase boundaries

- **WHEN** the rename input is focused and exposes the conjunctive exact state
  `id: user-calendar-rename-input` plus `text: E2E Renamed Timetablee` after both broad erase
  commands and target input have completed
- **THEN** one conditional shared subflow SHALL select only that exact wrong state, tap at
  `99%,50%` relative to the same input element, and erase exactly one character
- **AND** once the condition matches, neither the element-relative tap nor the one-character erase
  SHALL be optional; if the input was already exact, the whole correction SHALL be skipped
- **AND** the existing bounded gate SHALL still require the conjunctive exact target
  `user-calendar-rename-input` plus `E2E Renamed Timetable` before Save, so any other corruption
  remains terminal before a server write
- **AND** focused mutation proof SHALL reject a missing or widened wrong-value condition, a
  screen-global or non-input coordinate, an erase count other than one, Save before the exact
  target gate, or any weakened baseline/local-write/wipe/re-import/server-convergence assertion
