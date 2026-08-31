## Context

The backend-environment selector introduced a dedicated `BACKEND_ENVIRONMENT_CAPABILITY` build input. `app.config.ts` normalizes only `development`, `preview`, and `production`; absent or malformed input deliberately resolves to `production`, independently of `APP_VARIANT`, OTA metadata, Firebase configuration, and the compiled API URL.

The native E2E workflow predates that boundary. Its Android and iOS prebuild steps set only `APP_VARIANT=development`, while their release compilation steps set the development variant plus a platform-local `EXPO_PUBLIC_API_URL`. A CI-shaped config resolution therefore produces `appVariant=development` but `backendEnvironmentCapability=production`, so the runtime cannot select `local` and the seeded import fails before later B10 flows run. The existing `mobile/e2e/test_ci_mobile_e2e.sh` proof checks toolchain, retry, and artifact invariants but does not inspect this build contract.

The workflow is a sensitive CI surface. The change must recover the local seeded-server path on both platforms without weakening the production fail-closed behavior or changing application/runtime selection code.

A second, independent defect sits immediately behind the first. Exact-head run 33162979890 proved the routing repair — both platforms reach `TEST ENVIRONMENT · Local`, complete `import-seed.yaml`, and render the real seeded events — then fail terminally on `tapOn: id: "calendar-view-agenda"`. That id belonged to a segmented control removed in `a45b9a5`, when the calendar header moved to native chrome. The view control is now a single header element with `testID="calendar-view"` — an `@expo/ui` `Picker` with `appearance="menu"` on iOS, a `@react-native-menu/menu` trigger `Pressable` on Android — and the view is chosen from its menu. `calendar.yaml` and `hidden-events.yaml` still carry four references to the dead id, so the seeded round trip they exist to prove can never complete.

The same class of drift is not unique to this id. `run_e2e.sh` iterates top-level flows lexically and stops at the first failure, so `calendar.yaml` (third alphabetically) has been masking every later flow. Two further selectors removed by unrelated UI reworks are still referenced downstream: `onboarding-welcome-url-cta` (`ical-import.yaml`, removed in `482f134`) and `onboarding-school-filter` (`onboarding.yaml`, removed in `f2e47ee`). Triage amendment #2 folds both into this change (Decision 3b): deferring them would leave the gate terminating at flow 9 of 14, and a red job is not a gate — B10 would close having produced no green exact head for `TIM-263`.

A static enumeration of every literal `id:` in the flows against every `testID` in `mobile/src` returns ten candidates, of which **seven are false positives**: Maestro matches ids by regex, and testIDs are declared as object properties and template literals as well as JSX attributes. Exactly three are genuinely stale — the three above. That asymmetry is what shapes Decision 4.

## Goals / Non-Goals

**Goals:**

- Make each Android and iOS native E2E prebuild and release-compilation step resolve development identity, development backend capability, and the platform-correct local API URL.
- Add a focused, locally runnable structure proof that fails if any of those four build steps loses or misstates one member of the contract.
- Reach the agenda surface in both shared calendar-family flows through the control the app actually ships, with one cross-platform, locale-stable interaction and no per-platform branch.
- Repair every stale selector in `mobile/.maestro/**`, so the complete flow set can run to green on one exact head.
- Catch selector drift at the commit that causes it, in the baseline gate, instead of at an on-demand native run.
- Keep the Architecture Book, E2E operator README, and agent handbook aligned with the executable contract.
- Require baseline checks and both native jobs to pass on the recovery PR's exact head, with direct run/job links recorded in the handoff.
- Classify a nested startup failure from command structure without treating its still-open failed
  `runFlowCommand` ancestor as an independent application failure.
- Correct only the exact observed rename residue before the existing exact pre-Save gate, using a
  pinned element-relative Maestro interaction that cannot address outside the selected input.
- Keep the programme Continue action physically above the keyboard by adopting the repository's
  sticky-footer containment, while leaving the device-proven iCal journey and institution screen
  unchanged.

**Non-Goals:**

- Change `app.config.ts`, the backend-environment selector, endpoint allowlist, persisted environment behavior, retry attempt budget or assertion guard, Maestro flow order, seeded-data assertions, or server lifecycle.
- Change application UI/behaviour outside the authorized Activity held-calendar lifecycle repair
  and the bounded programme sticky-footer layout; change the device-proven institution-name screen;
  add a `testID` to a control that lacks one; change either form's validation/draft/navigation/Skip
  contract; or introduce a new keyboard dependency or platform-specific Maestro flow.
- Change OpenAPI/generated clients, server schema or migrations, native/store configuration, EAS profiles, Firebase files, deployments, infrastructure, or legacy Flutter.
- Re-run a terminal native failure without a material workflow fix, add a separate QA gate, or modify the parent feature PR.

## Decisions

## Decision 1: Declare the complete backend contract on every native build step

The Android prebuild, Android Gradle release assembly, iOS prebuild, and iOS Xcode Release build will each declare all three inputs explicitly:

| Platform | Identity                  | Capability                                   | Local URL                                   |
| -------- | ------------------------- | -------------------------------------------- | ------------------------------------------- |
| Android  | `APP_VARIANT=development` | `BACKEND_ENVIRONMENT_CAPABILITY=development` | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3005`  |
| iOS      | `APP_VARIANT=development` | `BACKEND_ENVIRONMENT_CAPABILITY=development` | `EXPO_PUBLIC_API_URL=http://localhost:3005` |

Keeping the values on the named prebuild/build steps makes every config evaluation and bundle compilation self-contained and reviewable. The capability is not inferred from the development identity, scheme, URL, or CI context. Existing Gradle bounds, Xcode invocation, native identities, and artifact locations remain unchanged.

Alternatives rejected:

- Infer capability from `APP_VARIANT`: this weakens the independent security boundary and contradicts the fail-closed selector design.
- Change the missing-value default to development: malformed production builds could become non-production-capable.
- Set only the final bundle steps: `expo prebuild` also evaluates app config and must generate native development configuration from the same declared inputs.
- Put the values at workflow or repository scope: this unnecessarily exposes build-only inputs to unrelated steps and makes platform ownership less obvious.

## Decision 2: Prove named step environments, not global string counts

`mobile/e2e/test_ci_mobile_e2e.sh` will retain its existing invariants and add a helper that isolates each of the four named workflow step blocks. For each block it will assert exactly one development identity, exactly one development backend capability, and exactly one expected platform URL. It will also reject the opposite platform URL in that block.

This focused shell proof remains dependency-light and runs in both native jobs before device execution. Step-scoped assertions prevent a duplicated value in one job from compensating for an omission in another, which a workflow-wide occurrence count would miss.

Alternatives rejected:

- Rely only on `app.config.test.ts`: it proves parsing and fail-closed semantics, not that GitHub Actions supplies the inputs.
- Check only total string counts: counts do not establish co-location or platform correctness.
- Add a general workflow parser dependency: the four fixed step contracts are small enough for the existing shell proof, and a new parser would broaden this recovery change.

## Decision 3: Reach the agenda through the shipped calendar-view control

Both shared flows replace `tapOn: id: "calendar-view-agenda"` with the interaction the app actually offers:

```yaml
- tapOn:
    id: "calendar-view"
- tapOn:
    text: "Agenda"
```

`calendar-view` is the **same** `testID` on both platforms (`calendar-view-menu.tsx`): the `@expo/ui` `Picker` (`appearance="menu"`) on iOS and the `@react-native-menu/menu` trigger `Pressable` on Android. `Agenda` is `calendar.view.agenda`, which is byte-identical in `en.json` and `fr.json`, so the selection stays locale-stable — the same property the existing flow headers already rely on. No per-platform branch is introduced.

`calendar.yaml`'s follow-on `assertVisible: id: "calendar-view-agenda"` becomes an assertion on `id: "agenda-section-list"` — the `FlatList` in `agenda-list.tsx`, which mounts **only** when `view === "agenda"`. That is a strictly stronger proof than the old one: the dead assertion only proved a segment existed, whereas the new one proves the view actually switched. `hidden-events.yaml`'s two references are pure taps and need no companion assertion; its existing seeded-title waits already prove the agenda rendered.

Alternatives rejected:

- Extract a shared `runFlow` sub-flow for the interaction: `run_e2e.sh` globs `.maestro/*.yaml` and runs **every** top-level file standalone, so a sub-flow would need a nested directory and a new convention. Three call sites of two lines each do not justify it, and Decision 4's guard — not deduplication — is what actually prevents recurrence.
- Assert the trigger's label reads "Agenda" after selection: on Android that label is an `accessibilityLabel` and on iOS it is the picker's rendered value; asserting it cross-platform is fragile and proves less than the agenda list mounting.
- Add a `view` deep-link parameter to reach agenda without the menu: that is an application change, explicitly out of scope, and it would stop exercising the control a user actually taps.
- Drop the agenda step and assert seeded titles on the timeline grid: the flow headers already record why that is not viable — calendar-kit grid tiles live inside a Reanimated worklet grid and carry no per-event `testID`.

## Decision 3b: Repair the two onboarding selectors in the same change

Triage amendment #2 widened this change from `calendar-view-agenda` alone to the full stale
set. The reason is arithmetic, not preference: `run_e2e.sh` runs top-level flows lexically and
stops at the first failure, so repairing only the calendar family leaves the gate terminating
at `ical-import.yaml` — flow 9 of 14. A red job is not a gate, so acceptance criterion 6 could
not be met and `TIM-263` would still have no green exact head. All three repairs live in
`mobile/.maestro/**`: identical surface, identical risk class, identical reviewer, and no
separable review boundary — while splitting them costs one full native CI cycle each.

**`ical-import.yaml` — `onboarding-welcome-url-cta`.** The "Add by URL" entry did not
disappear; it moved (482f134). The welcome screen is now a three-page carousel and the URL
entry lives on the school step as `onboarding-school-missing` ("I can't find my school",
`school-picker-screen.tsx`), which pushes `/onboarding/ical-url`. The flow therefore advances
the carousel (`onboarding-next` ×2), takes `onboarding-welcome-cta` into the school step, waits
on `"Select your school"`, then taps `onboarding-school-missing`. The wait is load-bearing
rather than cosmetic: that title renders as the list header, which mounts only in the
_browsing_ state, so it also proves the list finished loading and the footer action carrying
`onboarding-school-missing` is on screen. Two seeded fixtures (`school.fixtures.yml`) keep the
footer above the fold.

**`onboarding.yaml` — `onboarding-school-filter`.** The school search moved into the native
header (`headerSearchBarOptions`, f2e47ee). `react-native-screens`' `SearchBarProps` carries no
`testID`, so no id can address it without an application change. It does not need one: the flow
taps `text: "Search schools"` (`onboarding.school.search`). That is not a new locale dependency
— this same file already asserts `"Select your school"`, and `ical-import.yaml` asserts
`"Add a calendar by URL"` and `"Enter a calendar URL."`. The e2e device runs in EN by
established convention, so the placeholder is exactly as stable as the assertions around it.

Alternatives rejected:

- Deep-link straight to `/onboarding/ical-url` and skip the entry point: it would stop proving
  the entry is reachable at all, which is the only thing this flow's first half tests.
- Add a `testID` to the header search bar: `SearchBarProps` has no such field, so it would take
  a `mobile/src` change to swap the control — the `TIM-265` boundary, and out of scope.
- Defer both to `TIM-265`: rejected above; it cannot satisfy acceptance criterion 6.

## Decision 4: Guard selector drift in the baseline gate, not the native gate

A new `mobile/e2e/maestro-selectors.test.ts` (Jest, so it runs in the existing `test-mobile` baseline job with no new CI surface) reads every `mobile/.maestro/*.yaml`, collects each `id:` selector, reads every non-test file under `mobile/src`, collects each declared `testID`, and fails on any selector that resolves to none — naming the flow file, the line, and the id.

The baseline gate is the correct home. All three stale selectors were introduced by UI-rework PRs that ran the baseline gate and did not run the on-demand native gate; a proof living only in `test_ci_mobile_e2e.sh` would have caught none of them at the commit that caused them. The workflow-contract proof stays where it is — it asserts workflow structure, which is a different concern.

**The matching rules are the load-bearing part.** A naive literal comparison reports ten candidates on this repo, of which **seven are false positives**. Writing the naive version and allowlisting its output would admit real, working ids — including `settings-feedback`, the exact id `TIM-263` exists to prove — after which the guard could never catch a real break again. So:

1. **A flow `id:` value is a regex, not a literal.** Maestro matches ids by regex; `checklist-check-.*` and `checklist-remove-.*` (`event-checklists.yaml`) are deliberately written that way. Each selector is compiled anchored, `^(?:…)$`.
2. **A `testID` is declared two ways.** `testID="x"` as a JSX attribute, and `testID: "x"` as an object property on a data-driven descriptor — `about-screen.tsx` and `settings-screen.tsx` declare `about-changelog`, `settings-about`, `settings-appearance` and `settings-feedback` the second way, forwarded through `testID={props.testID}`. Both forms are collected; the pass-through itself declares nothing and is skipped.
3. **A template-literal `testID` stands for a family.** ``testID={`checklist-check-${item.uuid}`}`` is expanded by substituting a sample for each `${…}`, so the regex in rule 1 has a concrete member of the family to match.

`KNOWN_STALE` ships **empty**: every stale id is repaired here, so nothing is deferred. It is kept (rather than deleted) as the documented shape for a future deferral, and the check stays bidirectional — an allowlisted id that _is_ present in `mobile/src` fails, so the allowlist cannot silently rot.

The suite also self-checks against going vacuous: non-zero flow/selector/testID counts, and both directions of each rule (`calendar-view` resolves while `calendar-view-agenda` does not; `checklist-check-.*` resolves while the bare prefix `checklist-check-` does not).

Alternatives rejected:

- Extend `test_ci_mobile_e2e.sh` instead: that script runs only inside the two on-demand native jobs, which is precisely the gate that was not protecting us.
- Literal-only matching with the false positives allowlisted: rejected above — it disarms the guard permanently, which is worse than not having one.
- Also resolve `text:` assertions against the locale files: the suite asserts seeded server data and native OS chrome as well as app copy, so it would be mostly false positives. The unreached-flow risk it would partly cover is instead handled by taking the native gate and repairing what it surfaces.

## Decision 5: Update the existing testing rule without a new ADR

`docs/mobile/architecture-book/testing.md`, its changelog, `mobile/e2e/README.md`, and `docs/agent-dev-environment.md` will state that release-config native E2E builds require the explicit capability in addition to the variant and platform URL. Local build examples will include all three inputs. `testing.md` additionally records that flow selectors must resolve against real app `testID`s and names the baseline guard that enforces it.

Both files are binding documentation and are flagged as a sensitive surface. The build/selector
corrections are not costly-to-reverse architectural decisions, so no new ADR is warranted.
Decision 10 later refines ADR 038 in place for nested command provenance while preserving its
process-per-flow lifecycle, assertion-first guard, bounded attempts, and terminal application rule.

## Decision 6: Treat exact-head native CI as required recovery evidence

After the implementation is pushed, the recovery PR will receive its normal baseline gate plus the `run-e2e` native workflow. Both named Android and iOS jobs must pass on the same exact commit that is reviewed; seeded calendar import through the real local server is part of that unmodified flow set. The handoff records the commit SHA and direct run/job links. A native failure is terminal under ADR 038 unless a material new fix justifies another run.

No separate QA stage is added because the issue explicitly assigns the exact-head CI evidence to the normal apply/review pipeline and the Reviewer owns autonomous merge after green preflight.

## Decision 7: Reopen pagination at the held-calendar lifecycle edge

A completed Activity backfill describes the held-calendar set that produced it. When the
app-lifetime live query observes a later set containing a new calendar, the Activity ownership
lifecycle resets only the persisted older-page cursor and completion flag, then forces the
existing newest-page coordinator. Cached rows and read metadata remain intact.

This ordering is safe on both sides of the calendar-sync race. If sync's Activity refresh is
already in flight, the forced refresh joins the same module-level newest-page slot and its write
adopts the cursor after the reset. If sync's refresh already finished against the stale completion
flag, the lifecycle edge issues a new refresh that establishes the expanded set's cursor. The
older-page slot stays independent. Removal pruning remains an independent action against the same
authoritative observed set, and the first loaded observation remains a baseline rather than a
transition.

Alternatives rejected:

- Preserve a completed chain when the held set expands: the completion describes only the old
  token set and permanently suppresses the expanded set's cursored page.
- Reset inside every newest-page write: ordinary newest refreshes would discard valid partial
  backfill positions and repeat already-cached pages.
- Wire the reset from calendar-sources: that reverses the enforced dependency and recreates the
  module cycle ADR 049 prohibits.
- Work around the missing page in Maestro: it would conceal a production state defect and weaken
  the real-server pagination proof.

## Decision 8: Prove checklist persistence across a state-preserving cold re-entry

The final `hideKeyboard` in `event-checklists.yaml` is removed. Run `33365735943` showed why a
successful keyboard command is not a useful postcondition: after the input had already unfocused,
Android treated the command as Back and returned to Agenda while Maestro reported `COMPLETED`.
Before leaving details, the flow instead waits up to 15 seconds for one selector conjunctively
matching `id: checklist-input-.*` and exact `text: "Buy notebook"`.

The flow then uses the already-proven state-preserving Calendar cold re-entry (`stopApp` → calendar
deep link → optional iOS confirmation, without `clearState`), reopens `E2E Today Lecture(,.*)?`,
and requires the typed row before toggling it. The existing second cold re-entry, exact
`progress-1-1` proof, reopen, hard-delete, and exact absence assertion remain in order. This turns
the pre-toggle assertion into a persistence proof on the correct screen rather than an assertion
against whichever route a keyboard command happened to leave active.

Alternatives rejected:

- Keep `hideKeyboard` and add another screen assertion: the command itself can navigate on Android,
  so this preserves a platform-asymmetric side effect.
- Toggle immediately after typing: that proves only the live details instance, not persistence
  across a route lifecycle.
- Use `back`, `clearState`, or a platform fork: `back` has the same cross-platform ambiguity,
  `clearState` destroys the SQLite row being proved, and the shared flow already has a safe route.

## Decision 9: Keep onboarding body CTAs above the keyboard, then prove exact flow values

The two screens retain a flex `KeyboardAvoidingView` with iOS padding behavior and a scrollable
content region whose `keyboardShouldPersistTaps="handled"` permits activation while the keyboard is
present. The institution screen's current scroll-contained CTA is device-proven and remains
unchanged. The programme screen's earlier scroll-contained placement is superseded by Decision 12:
its existing CTA becomes a sticky sibling after the scroll, inside the same avoiding view. Android
continues to rely on its existing resize behavior. No new dependency or keyboard primitive is
introduced, and validation, draft writes, route targets, Skip behavior, labels, ids, and
user-entered values are unchanged.

This is required because accessibility-hierarchy visibility is not physical tapability. In the
iOS artifact from run `33365735943`, `onboarding-institution-continue` was exposed at y=581–629
while the keyboard covered that region; Maestro selected the correct id but the tap hit the
keyboard/prediction layer and changed `E2E Institution` to `E2E Institutiont`. The initial repair
proved the institution transition on-device, but run `33395764565` later showed that identical
scroll containment did not protect the programme CTA. That measured distinction is why only the
programme placement changes now.

The shared `ical-import.yaml` remains platform-neutral. After each `inputText`, it first waits up
to 15 seconds for one selector matching the existing input id and the complete exact value, then
retains the existing bounded Continue-id wait and explicit tap. Repository proof pins both
input → exact-value gate → CTA wait → CTA tap sequences and rejects any `hideKeyboard` anywhere in
the flow set. Component proof pins the keyboard-avoiding/scroll/tap-handling semantics for both
screens, including the iOS behavior and unchanged Android contract.

Alternatives rejected:

- Treat hierarchy `visible` as sufficient: the captured tap proves an exposed element may still be
  occluded by native keyboard chrome.
- Dismiss the keyboard, submit with Return, tap coordinates, or make the CTA optional: each either
  repeats the failing primitive or bypasses the shipped explicit control.
- Add a new shared keyboard component immediately: only two adjacent screens need the bounded
  repair, and the existing repository pattern is sufficient without expanding the abstraction.

## Decision 10: Exclude only a live failed flow wrapper from the global retry veto

The global `FAILED`-command guard remains the classifier's fail-closed default. Before applying
that guard, the classifier may exclude a failed command from the veto set only when all of these
conditions hold:

1. its command name is exactly `runFlowCommand`;
2. it precedes the final failed startup command and has a strictly lower depth;
3. every entry after that wrapper and through the final command remains deeper than the wrapper —
   no intervening entry returns to the wrapper's depth or shallower and thereby closes it.

Those conditions identify a still-live structural ancestor whose child failure Maestro has
propagated onto the enclosing flow before serializing the child commands. They match the captured
29-entry Activity record from job `99468944392`: entry 25 is a failed depth-zero wrapper and entries
26–28 are its depth-one configuration, stop, and failed open-link child sequence, with no return to
depth zero. Removing that wrapper alone from the veto set leaves the existing final-restart-epoch
classifier in charge. The final failed startup command itself remains the failure being classified;
every other earlier failed command remains globally terminal.

A same-depth wrapper is not an ancestor. A lower-depth wrapper followed by any entry at its depth
or shallower is already closed. A failed child assertion or interaction at any depth is never
excluded. The output assertion guard still runs first; evaluated assertions and non-startup
interactions in the final epoch, unreadable/malformed records, and deterministic exhaustion remain
terminal. Every retry still reruns the whole top-level flow in a fresh Maestro process, with one
shared server lifecycle and the existing four-attempt maximum.

Alternatives rejected:

- Ignore every failed `runFlowCommand`: a completed subflow can fail independently and a later
  startup command must not erase that application verdict.
- Ignore every lower-depth failed command: depth alone does not establish that the command remains
  open; a later same-depth entry closes the ancestor and makes its failure independent history.
- Add the captured `IOSDriver.openLink` text as another signature: ADR 038 deliberately replaced
  punctuation-sensitive signatures with the machine-readable command structure.

## Decision 11: Correct only the exact observed rename suffix inside the selected input

The existing exact pre-Save gate remains mandatory. Immediately before it, the shared rename flow
adds one conditional subflow whose `when.visible` selector conjunctively matches both
`id: user-calendar-rename-input` and exact `text: "E2E Renamed Timetablee"`. Only when that exact
observed state is live does the subflow:

```yaml
- runFlow:
    when:
      visible:
        id: "user-calendar-rename-input"
        text: "E2E Renamed Timetablee"
    commands:
      - tapOn:
          id: "user-calendar-rename-input"
          point: "99%,50%"
      - eraseText: 1
- extendedWaitUntil:
    visible:
      id: "user-calendar-rename-input"
      text: "E2E Renamed Timetable"
    timeout: 15000
```

This exact shape parses under the repository-pinned Maestro 2.8.0. In that version,
`TapOnElementCommand.relativePoint` is resolved only after the id selector finds its element, and
`calculateElementRelativePoint` computes the coordinate from that element's bounds. `99%,50%`
therefore means `bounds.x + 99% of bounds.width`, `bounds.y + 50% of bounds.height`: strictly
inside the selected input and near its trailing edge, not a screen-global coordinate that could
target another control. Tapping there places the caret after the trailing residue; `eraseText: 1`
removes exactly one character. The tap and erase are required once the exact condition matches.

If the field is already exact, the conditional subflow is skipped and the mandatory exact gate
passes. Any other prefix, suffix, or corruption matches neither correction condition nor target
gate and remains terminal before Save. The baseline, local-write, wipe/re-import,
server-convergence, and baseline-absence assertions remain unchanged.

Alternatives rejected:

- Widen the wrong-value selector or accept the corrupted title: either can hide a new controlled-
  input defect or write known-bad server state.
- Use a screen-global point: it is sensitive to device dimensions and can target outside the
  input; the element-relative point is computed from the selected input's own bounds.
- Make the inner tap or erase optional: once the exact residue is detected, a partial correction
  must fail explicitly rather than fall through ambiguously to the write gate.
- Add another broad erase boundary: two 50-character erases already reproduced the residue; the
  measured state needs a one-character correction, not a third destructive sweep.

## Decision 12: Make the programme CTA a sticky sibling inside the avoiding view

Move the existing `onboarding-programme-continue` Pressable unchanged out of the `ScrollView` and
place it immediately after the scroll, still inside the existing `KeyboardAvoidingView`. Add only
the minimum local or shared footer spacing required. This is the personal-event form's proven
containment: on iOS the avoiding view's `padding` behavior lifts the footer; on Android the resized
window keeps the sibling reachable. The scroll retains `keyboardShouldPersistTaps="handled"` for
the form content.

The focused component proof treats containment as the contract. The programme scroll contains
zero matching CTAs; the avoiding view contains exactly one; and that CTA follows the scroll while
remaining inside the avoiding view. The same proof retains iOS `behavior="padding"` and the
scroll's tap-handling contract, and covers Android's undefined behavior/resize path. Those
assertions are mutation-sensitive: moving the CTA back into the scroll, outside the avoiding view,
before the scroll, duplicating it, or dropping the iOS/tap-handling semantics must fail.

The `ical-import.yaml` programme sequence is deliberately unchanged: exact input-id/value gate →
100%-visible centred reveal → bounded CTA wait → required CTA tap → one optional same-id fallback →
mandatory Connect wait. The fresh native gate therefore proves the real visible CTA transition;
Return submission would exercise the already-wired `onSubmitEditing={submit}` path but bypass the
user-facing control and conceal the defect.

Alternatives rejected:

- Keep the CTA inside the keyboard-avoiding scroll: run `33395764565` is direct counter-evidence;
  the test that called that structure “lifted” asserted only ancestry, not non-occlusion.
- Submit with Return, hide the keyboard, tap coordinates, fork by platform, or weaken the Connect
  wait: each bypasses or obscures the visible CTA transition the gate must prove.
- Change the institution screen or introduce a new keyboard abstraction: the former is already
  device-proven and the latter is unnecessary for one local containment correction.

## Risks / Trade-offs

- [One platform or phase drifts later] → Step-scoped assertions cover all four build steps and both exact URLs.
- [Duplicated environment declarations require maintenance] → The duplication is intentionally bounded to four sensitive steps and makes each config evaluation self-contained; the proof keeps them synchronized.
- [A malformed production build becomes development-capable] → Leave all parser/runtime defaults untouched and change only the development-only E2E workflow.
- [Static proof passes while native routing still fails] → Require both native jobs on the recovery PR's exact head, including the real seeded import flow.
- [CI retry masks the import regression] → Preserve ADR 038's assertion-first and bounded-failure
  invariants: assertion/application/unknown failures are terminal and only structurally classified
  XCTest startup transport failures may retry; Decision 10 narrows only propagated-wrapper
  provenance.
- [The menu popup is not addressable on one platform] → This is the residual risk of Decision 3 and only a device settles it. `appearance-settings.yaml` records design D5: `@expo/ui` picker **popup internals** were judged unreliable for a toggle round trip. This case differs — the trigger carries a `testID` that `appearance-settings.yaml` already asserts visible on both platforms, and the menu entries are plain OS menu items with fixed labels, the same shape `environment-switch.yaml` and `hidden-events.yaml` already drive through native `Alert` choosers. If the exact-head run shows one platform cannot address the entry, that is a material finding for the Founding Engineer, not a retry: the fallback would be an application change (a testID-addressable view control or a deep-link parameter) that this change is not authorized to make.
- [A flow not reached since the UI rework carries a stale **text** assertion] → The guard covers `id:` selectors only, and six flows (`environment-switch`, `event-checklists`, `home`, `personal-events`, `settings`, `user-calendars`) have not been reached by a native run since the rework, because `run_e2e.sh` stops at the first failure. This is why triage amendment #2 authorizes repairing whatever the gate surfaces inside this ticket rather than filing a new one per selector: the first green run is not promised in one shot, but each iteration is a material fix on the same surface.
- [The Android native-stack `SearchView` renders collapsed to an icon] → Then the `"Search schools"` placeholder is not matchable until it is expanded, and no flow-only repair exists. That is the `TIM-265` boundary — escalate to the Founding Engineer rather than reaching into `mobile/src`.
- [A keyboard command reports success but changes route state] → Eliminate `hideKeyboard` from all
  shared flows and prove the checklist value on details before a state-preserving cold re-entry.
- [A CTA is accessibility-visible but keyboard-occluded] → Keep the institution contract unchanged,
  make the programme CTA the sole sticky sibling after the scroll inside the avoiding view, and
  retain the exact-value, reveal, bounded tap, fallback, and mandatory route gates unchanged.
- [A propagated nested wrapper is mistaken for an earlier application failure] → Ignore only a
  still-live, lower-depth failed `runFlowCommand` ancestor of the final failed startup command;
  mutation-pin same-depth, closed-ancestor, assertion, interaction, and final-epoch negatives.
- [The exact rename residue changes shape] → The correction does not run; the unchanged exact
  target gate fails before Save, preserving the server from an unrecognized corruption.

## Migration Plan

1. Add the three explicit build inputs to the four named workflow steps and extend the focused step-scoped shell proof.
2. Replace all six stale selector references — four `calendar-view-agenda` in the calendar family, `onboarding-welcome-url-cta` in `ical-import.yaml`, `onboarding-school-filter` in `onboarding.yaml` — with the shipped interactions, and update each flow's header comment to describe the contract it now relies on.
3. Add the baseline-gate selector guard with its three matching rules and an empty `KNOWN_STALE`.
4. Update testing/operator guidance and the Architecture Book changelog; no human-only inbox note is needed.
5. Run shell syntax/proof, workflow/config/YAML formatting, resolved Expo config checks for both platform contracts, the mobile Jest suite, OpenSpec validation, and the applicable baseline checks.
6. Remove the last `hideKeyboard`, add the exact checklist value gate and pre-toggle cold re-entry,
   and mutation-pin the complete add → persist → toggle → progress → delete → absent sequence.
7. Apply the initial keyboard-safe form layout to the two onboarding name screens, add their
   focused component proof, and pin both iCal exact-value → CTA-wait → CTA-tap sequences.
8. Refine the structural classifier's global veto for only a live failed flow-wrapper ancestor,
   add the captured 29-entry fixture and negatives, and align ADR 038 plus its binding/operator
   documentation.
9. Add the exact rename-residue conditional correction before the existing exact pre-Save gate,
   and mutation-pin its selector, element-relative point, one-character erase, ordering, and all
   convergence assertions.
10. Move only the programme CTA to the sticky sibling position, replace the false scroll-descendant
    proof with mutation-sensitive containment assertions, and keep the iCal flow byte-for-byte
    unchanged.
11. Push the implementation and run baseline plus Android and iOS native jobs on one exact PR head. Record the SHA and direct run/job links before review handoff.
12. Rollback is a normal revert of the workflow, flow, proof, documentation, classifier refinement,
    and bounded form-layout changes. It restores the known broken E2E routing/keyboard reachability
    and nested retry/rename termini but does not migrate data or alter production data.

## Open Questions

None. The measured programme-only `mobile/src` repair is explicitly authorized here; every other
application surface remains out of scope.
