# R07: Governance impact, delivery and verification

Date: 2026-10-01. Scope: what this project must update, how work ships, how the result is proven,
and how it rolls out. Paths are relative to the repository root unless they are links. "Fact" means
observed in the file cited; "Inference" is reasoning; "Open" needs an answer.

## 1. Governance impact

### 1.1 Facts: where the pager and three-page design are encoded

| Artifact | Encoding | Needed action |
| --- | --- | --- |
| [owned-calendar-renderer D04](../../owned-calendar-renderer/decisions/D04-view-renderer-and-gestures.md) | "native ScrollView/PagerView motion"; Skia/custom native needs a decision change | Supersede the horizontal-motion clause only. Keep "owned RN views, UI-thread header" |
| [D05](../../owned-calendar-renderer/decisions/D05-bounded-range-working-set.md) | "one settled page plus immediate neighbours and at most one replacement generation" | Supersede. A ~5-page window over a ±5-year index range changes the approved boundary |
| [D07](../../owned-calendar-renderer/decisions/D07-clean-native-cutover.md) | No dual renderer or runtime switch. Rollback is a coherent source/build revision | Keep. It governs rollout (§4) |
| [D08](../../owned-calendar-renderer/decisions/D08-evidence-and-dependency-governance.md) | Reproducible evidence; no guessed thresholds; no unsolicited top-level E2E | Keep. Apply its dependency dossier if any native code is added |
| [product.md §6.1](../../owned-calendar-renderer/product.md) (l.344-356) | One swipe or fling settles one page; the title stays old while held; no fixed 12-month limit | Clarify (see Questions): chained swipes, and whether ±5 years counts as a navigation limit |
| [product.md §13](../../owned-calendar-renderer/product.md) (l.679-700) | Never an "unexplained blank or partial frame"; the last complete layout stays until atomic replacement | Binding on the new window. Fast flings must never outrun the rendered pages |
| [design.md](../../owned-calendar-renderer/design.md) l.23, 65-80, 117-120, 243 | "Preserve one vertical owner, three pager pages"; "three-page working set" | Rewrite these sections to point to this project |
| [roadmap.md](../../owned-calendar-renderer/roadmap.md) / ticket front-matter | T05-T10 and T12 say `planned` and T11 says `implementing`, yet all are merged (`git log`: #414-#428) | Reconcile the statuses first. The project's state is stale |
| E02 tickets T05-T08 | "Preserve native pager/header synchronization, three-page retention" (T05:85, T06:88, T07:81, T08:83) | They record history. Add a pointer, don't rewrite |
| T27 / T28 | Long-session bounds; human device matrix | These remain the final gates. This project feeds them evidence |

Architecture Book (`docs/mobile/architecture-book/`):

- `calendar.md` names PagerView, three pages, idle commit and generation remount. See l.9, 13, 23-29,
  47-50, 81, 88-89, 103, 125, 143 ("no far-date pager"), 157, 208-210, 227, 303 and 339. This is the
  main rewrite.
- `decisions/033-calendar-renderer-module-boundary.md` says "native ScrollView/PagerView motion".
  Amend it in place, as the [ADR policy](../../../mobile/architecture-book/decisions/README.md) requires.
- `decisions/061-...assistive-targets.md` says "Keep ... the existing vertical scroll and pager owners".
  This needs a one-word amendment.
- `testing.md` l.45-50 and 65 cover the T06 inventory ("one pager, three pages") and the T09
  three-page planner. Rewrite both.
- `runtime.md:32` lists pager-view only for the onboarding carousel (ADR 036). That stays true, so no
  change is needed. The package stays installed (`src/features/onboarding/ui/welcome-pager.tsx`).
- `CHANGELOG.md` gets a dated entry. **The file `architecture-changelog.md` does not exist.** The
  book's changelog is `CHANGELOG.md`.

OpenSpec (`openspec/specs/mobile-calendar-timeline/spec.md`, 1,316 lines). These requirements encode
PagerView or three pages: l.124 (no "second pager"), l.185 ("Callable Reanimated progress is proven
at the PagerView boundary"), l.345 (T02 three-page working set), l.467 and 495 (T03 one native
horizontal pager), l.607 and 633 (T04 header via an animated PagerView wrapper), l.691 and 705 (T05
"exactly ... three direct native pager children" and idle settlement), l.713 and 827 (cancellation
boundaries), l.849 and 860 (T07 three pages), l.987 (T08 contract "single three-page pager"), and
l.1219 and 1229 (T12 "recycled pager slots", retained pages).

Active OpenSpec changes (`ls openspec/changes`):

- `zoom-owned-calendar-grid` (T06, merged #415). All tasks are ticked, but **it was never archived,
  and its deltas are not in the main spec.** `grep "40 px/hour"` finds 0 matches. Its delta still
  requires "one native pager, and exactly three pages".
- `render-local-timed-calendar-events` (T09, merged #418) is also unarchived. Tasks 8.5 (green CI)
  and 8.6 (owner verdict) are still `[ ]`. Its `mobile-calendar-sync` and `mobile-architecture-book`
  deltas encode the "bounded three-page" range.
- No other active change touches the calendar.

[Investigation 2026-09-21](../../../investigations/2026-09-21-calendar-rapid-swipes/README.md) has
status "diagnosed, paging fix deferred". It is a historical record. Add only a status line that links
to this project when it closes. Its [03-design-direction.md](../../../investigations/2026-09-21-calendar-rapid-swipes/03-design-direction.md)
"required evidence" list is the best acceptance seed (§3.4).

Code contract: `mobile/calendar-owned-shell.contract.test.ts` checks for the pager. It asserts
`createAnimatedComponent(PagerView)` (l.164), one `<AnimatedPagerView ref=` (l.171), and an exact
renderer file inventory that includes `pager-page-scroll.ts` (l.131, 195). It must be rewritten in
the same change. That is the R-1 encoding of the new owner model.

### 1.2 Facts: working rules

- **"R-1...R-6" do not exist in the current hub.**
  [architecture.md](../../../mobile/architecture-book/architecture.md) has Principles 1-5:
  1 encodes before documenting; 4 is "ADR only for a decision expensive to reverse".
- `.claude/rules/mobile.md` still cites "R-1...R-6", `architecture-changelog.md` and "ADRs 001-024+".
  That pointer is stale. Inference: fix it in passing. It misleads every agent that reads it.
- The book says to "amend an ADR when the decision changes; use Git for its history"
  (decisions/README.md, l.3-6). ADR numbers can be reserved by open PRs and are only discoverable
  through the README prose (l.60-79). Check `gh pr diff` before taking a number.

### 1.3 Inference: project decisions vs global ADRs

- This project's `decisions/Dxx` are the product and architecture contract with the owner, approved
  in this project's README. Each one supersedes a specific clause of D04 or D05, with
  `supersedes: [owned-calendar-renderer/D05, owned-calendar-renderer/D04 (horizontal motion)]`.
- D04 and D05 get a one-line "superseded in part by calendar-native-paging/Dxx" status. Their bodies
  stay unchanged.
- D04's own text requires this step: "Changing an approved boundary ... needs an explicit decision
  update". So does the README ("a changed architecture/product premise requires a recorded
  decision").
- The Architecture Book records the current state only. Amend ADR 033 and rewrite calendar.md.
- Write **one new ADR** for "calendar paging via a bounded native horizontal ScrollView". It meets
  Principle 4: it is costly to reverse, and the T03 rationale (PagerView chosen "because it already
  existed") lived only in an archived design.md. The reversal is the rationale that "will matter
  later".
- Book updates land in the implementing change, not in this planning project. That follows the
  planner contract (`.claude/agents/change-planner.md`: tasks must include the book update).

## 2. How work ships here

### 2.1 Facts

- `/ship` (`.claude/commands/ship.md`) runs plan → apply → simplify → review (up to 3 rounds) →
  archive → PR → green CI → **zero-touch squash merge**.
- The agents are `change-planner` (writes an apply-ready OpenSpec change and "decides, doesn't
  ask"), `change-implementer`, `change-simplifier` and `change-reviewer` (the sole merge gate).
- The reviewer requires every task to be `[x]` **or** marked `(HUMAN: see inbox/...)`. "Human-blocked
  tasks (inbox) do not block approval" (change-reviewer.md). The
  [inbox README](../../../react-native-migration/inbox/README.md) repeats this: "The reviewer
  treats inboxed tasks as expected, not as merge blockers."
- The ship invariant is "Never block on human-only work".
- [delivery.md](../../owned-calendar-renderer/delivery.md) (prior project) says the opposite: "No
  reply is not acceptance", and owner QA comes before merge.
- **Neither process enforces the other.** The device-pass worksheets for
  [T02](../../../react-native-migration/inbox/2026-09-12-calendar-week-paging-device-pass.md) and
  [T03](../../../react-native-migration/inbox/2026-09-13-calendar-full-day-device-pass.md) still read
  "pending owner entry" for every field. Their unchecked items include *"Fast-fling repeatedly ...
  every accepted fling moves exactly one week"* and *"Page forward and back at least 40 times"*.
  These are the exact checks that would have caught the rapid-swipe bug.
- [E01 completion](../../owned-calendar-renderer/research/results/E01/completion.md) l.17-21 admits
  it "does not supply ... individual checklist observations".
- The ship pipeline gives the mobile [Definition of Done](../../../mobile/architecture-book/definition-of-done.md)
  only machine checks. It says device-only checks belong "in the relevant review ticket or migration
  inbox item", which is where they were skipped.
- Each prior calendar ticket was one OpenSpec change and one PR, for example
  `2026-09-14-switch-owned-calendar-day-week-mode` (T05) and `2026-09-17-resize-owned-calendar-windows`
  (T07). Epics have no OpenSpec artifact.

### 2.2 Recommended mapping

1. **E00 housekeeping (change 0).** Archive `zoom-owned-calendar-grid` and
   `render-local-timed-calendar-events` with `openspec archive`, syncing their deltas. Reconcile the
   prior project's ticket statuses. Otherwise the paging change must MODIFY requirements (T06 and
   T09) that the main spec does not contain yet, and the archives would conflict.
2. **Spike ticket: no OpenSpec change.** A throwaway branch builds the bare horizontal-ScrollView
   pager on Android (PC) and iOS (§3.3) and runs the scripted rapid-swipe and gfxinfo harness against
   a baseline build of `main`. Results go to `research/results/`. Nothing merges. This matches the
   investigation's "start with a bounded device experiment" and D04's "an observed failure calls for
   focused investigation".
3. **One ticket = one OpenSpec change = one PR, executed serially.** The cutover change carries
   `MODIFIED`/`REMOVED` deltas for every requirement listed in §1.1, plus the `mobile-calendar-sync`
   range requirement if R04 changes the data window. It also carries the ADR 033 amendment, the new
   ADR, the calendar.md and testing.md rewrites, CHANGELOG.md, and the rewritten contract test. Each
   `REMOVED` requirement needs a Reason/Migration line. Keep cleanup of the
   generation/revision machinery in a separate later change so each review stays readable.
4. Epics stay as a grouping in this project. A ticket's canonical evidence lives in the project
   folder, and OpenSpec tasks.md links to it.

## 3. Verification strategy

### 3.1 What Jest can prove

Facts:

- The coverage gate is `npm test -- --coverage` (`.github/workflows/ci-mobile.yml:87`).
  `jest.config.js:124` gates `src/features/*/!(ui|renderer)/**` at 90% lines and branches.
- **`renderer/` is excluded** and falls to the 70% global floor. Today `owned-calendar-zoom.ts` and
  `pager-page-scroll.ts` are pure logic that escape the 90% gate.
- PagerView is mocked at its native seam (`mobile/jest/setup-pager-view.ts`). Tests fire `pageScroll`,
  `pageSelected` and `pageScrollStateChanged` (`owned-calendar-shell.test.tsx:1503-1558`).
- The Reanimated mock (`mobile/jest/setup-reanimated.ts:24-34`) routes `useAnimatedScrollHandler`
  to `handlers.onScroll` **only**. Handlers named `onBeginDrag`, `onEndDrag` or `onMomentumEnd` are
  silently dropped.
- The worklets mock runs `scheduleOnRN` synchronously
  (`node_modules/react-native-worklets/src/mock.ts:92-96`).
- `useAnimatedStyle` evaluates its updater, so transforms are observable.

Inference, the testing plan:

- **Put the pure paging math in `calendar/data`** so the 90% gate applies: index↔date mapping, range
  bounds, window membership, crossing detection, and settle-to-commit decisions. Prior tickets
  targeted 100% on pure modules (T08 evidence, `T08-current-time.md:125`). Keep `renderer/` thin.
- Drive the ScrollView pager with RNTL `fireEvent(scrollView, "scroll", { nativeEvent: {
  contentOffset: { x, y: 0 }, layoutMeasurement, contentSize } })` plus `scrollBeginDrag`,
  `scrollEndDrag` and `momentumScrollEnd`.
- **Extend the Reanimated mock** to route every `useAnimatedScrollHandler` key. Without that,
  begin-drag, end-drag and momentum-end logic is untested even though its tests "pass".
- Provable claims:
  - one `scheduleOnRN` per rounded-index crossing, including back-and-forth jitter around .5;
  - one commit per settle;
  - window contents after crossings in both directions;
  - **no remount**: the same host instance and ref persist across a commit, and keys stay stable;
  - header transform as a function of offset;
  - stale completion rejected after a mode, geometry or Today change;
  - no `setState` or JS call on the scroll path, enforced by the contract test and
    `local/no-js-call-in-worklet`.
- Jest cannot prove:
  - native paging physics or one-page-per-fling on iOS `pagingEnabled` versus Android snap;
  - whether `momentumScrollEnd` fires when a new drag interrupts deceleration (platform-specific);
  - frame time or blank frames;
  - real UI-thread versus JS-thread scheduling;
  - axis arbitration and pinch precedence;
  - screen-reader behavior.
- Run every edited suite and the full suite with `--coverage`. CI enforces it, though the
  `change-reviewer` re-runs plain `npm test`.

### 3.2 Maestro

Facts:

- There are exactly three journeys (`mobile/.maestro/01-03`), and none pages the calendar.
- ADR 057 pins "exactly three top-level business journeys". Additions replace a journey or need a
  board decision. Baseline CI enforces the inventory (`e2e/maestro-selectors.test.ts`).
- D08 says "add renderer proofs ... in reproducible dedicated measurement harnesses, not unsolicited
  top-level E2Es".
- Native E2E runs daily or on dispatch only (`ci-mobile-e2e.yml:12-14`, ADR 055).
  - Android: release APK on an `x86_64` API-34 emulator (l.240, 267-271).
  - iOS: Release *simulator* app on `macos-26` (l.301, 378-400).

Inference: don't add a fourth journey. Maestro waits for the UI to settle after each command, which
defeats "the next touch before the previous settle". Whether a `swipe` settle timeout can be lowered
enough is Open. Use the dedicated harness below instead.

### 3.3 Device performance evidence

Facts:

- There are no perf scripts in the repo (`git grep -i "gfxinfo|perfetto|framestats"` returns nothing).
- The release identity is `fr.samuelprak.timecalendar` (`app.config.ts:33-35`).
- The dev deep link `timecalendar-dev://calendar?focusDate=2026-09-14` gives a deterministic week
  (T02 worksheet).
- Store builds are local only (`mobile/EAS.md:12`, ADR 040). EAS cloud builds have a quota, and
  local builds are the documented alternative.

Recommended harness. Add a committed `mobile/perf/` folder, outside `.maestro`, with scripts run
from the PC (`ssh pc`, coordinated with the `pc-build` teammate) against a preview **release** APK:

```sh
adb shell am force-stop $PKG && adb shell am start -W -d "$DEEPLINK" && sleep 3
adb shell dumpsys gfxinfo $PKG reset
adb shell 'for i in $(seq 1 30); do input swipe 900 1300 150 1300 80; done'   # forward chain
adb shell 'for i in $(seq 1 30); do input swipe 150 1300 900 1300 80; done'   # reverse chain
adb shell dumpsys gfxinfo $PKG > out/gfxinfo-$REV.txt   # janky %, p50/p90/p95/p99, slow UI thread
adb shell perfetto -o /data/misc/perfetto-traces/paging.pftrace -t 20s -b 64mb sched freq gfx view input
```

- Record the revision, runtime fingerprint, device, OS, refresh rate, swipe cadence actually achieved
  (from the trace's input events) and page reached. Compare against the **same script on the
  current `main` build** (the baseline).
- Inference: on the OnePlus 6, officially capped at Android 11, Perfetto FrameTimeline (Android 12+)
  is unavailable, so gfxinfo framestats and atrace slices are the primary signal.
- Each `input` call spawns a process, so cadence is likely 200-400 ms. Open: whether that beats
  settle. If not, use `input motionevent` sequences or an instrumentation driver.
- Per D08, thresholds come after the baseline measurement and are recorded in a decision, not
  guessed now.

iOS options, in order:

1. **OTA to an existing binary.** If the change adds no native code, the fingerprint is unchanged
   (pager-view stays for onboarding, and ScrollView is core). An installed TestFlight preview build
   can then receive the release-mode JS bundle through the self-hosted `preview` channel (eas.md
   l.37-41, ADR 037). This is real-device release JS with no Mac build. Verify first with
   `runtimeversion:resolve` (eas.md l.121-129) against the installed binary's runtime.
2. An already-installed development client plus Metro from the Mac. This is feel only, not perf.
   Metro does not compile native code.
3. An EAS cloud iOS build, within quota. It needs the owner's credentials.
4. The CI `macos-26` Release simulator build for scripted XCUITest rapid swipes. It gives
   correctness, not device performance.

Open: whether Instruments can attach to a distribution-signed TestFlight build for hitch data.
Likely not. The owner's feel pass then remains the iOS evidence.

### 3.4 A device gate that cannot be skipped

Facts: the skip path is structural. `(HUMAN: ...)` tasks don't block review (§2.1), and the merge is
zero-touch.

Proposal (a project decision):

1. In each runtime-affecting ticket's tasks.md, the device-evidence task is an **ordinary task with
   no `HUMAN` suffix**. The reviewer's existing rule ("every task is `[x]`") then blocks APPROVE. No
   agent change is needed.
2. The evidence lives at `docs/projects/calendar-native-paging/research/results/<ticket>.md` and
   records:
   - tested revision and runtime fingerprint;
   - build kind, device, OS and refresh rate;
   - the harness output files and the baseline comparison;
   - the checklist with observations;
   - an `owner-verdict: accepted` line quoting the owner's message and date.
3. A small CI check (or contract-test case) fails if a PR touches `src/features/calendar/renderer/**`
   or `calendar/data/*paging*` and either:
   - lacks an evidence file with `owner-verdict: accepted`, or
   - has `git diff --name-only <tested-revision>..HEAD` touching anything outside `docs/`.

   This proves the accepted build is the merged code, a binding the T02 and T03 worksheets never had.
4. The PR stays **draft** until the gate passes. `/ship` step 7 already parks drafts on escalation.
5. Agent-producible evidence (the Android harness and the iOS OTA install) is done before asking the
   owner. The owner supplies only the verdict and feel observations against a short checklist seeded
   from the investigation's required evidence: chained swipes beyond the window, mid-settle reversal,
   no remount jump, out-of-order data, dense weeks, pinch plus vertical scroll, and VoiceOver and
   TalkBack with reduced motion.

## 4. Rollout

Facts:

- There is **no feature-flag or remote-config mechanism**. Firebase is used only for analytics,
  crashlytics and messaging (`package.json:7-10`). There is no `EXPO_PUBLIC_*` flag beyond the API
  URL (`src/features/environment/data/runtime.ts:15`).
- D07 and delivery.md forbid "a parallel vendor/owned path or runtime switch".
- The RN app is pre-launch. There are only `preview` and `production` channels, and the 4.0 cutover
  is pending (eas.md l.63-67). Releases stay held until T29 (delivery.md).

Inference:

- **Ship as a straight cutover.** A flag would require building flag infrastructure and would
  contradict P08 and D07. There are no store users at risk.
- For A/B measurement, compare **two builds from two revisions** (baseline `main` and the branch),
  not an in-app toggle.
- If no native code is added, the fingerprint is unchanged. Rollback is then a `git revert` plus an
  OTA republish (or an xprem rollback) to `preview` binaries, with no rebuild.
- If the design adds a native module (for example a custom pager), the fingerprint moves:
  - fresh binaries are required (eas.md l.39);
  - rollback means republishing the old JS for the *new* runtime, which works only if the native
    addition is additive;
  - the D08 dependency dossier applies.

## Recommendations for design

1. Make change 0 housekeeping: archive the T06 and T09 changes, reconcile the prior project's ticket
   statuses, and fix the stale `.claude/rules/mobile.md` pointer.
2. Write project decisions that supersede D05 and the PagerView clause of D04, with explicit
   `supersedes:` lines. Add one new Architecture Book ADR and amend ADRs 033 and 061 in the
   implementing change.
3. Run a non-merged device spike first, with the PC Android release harness plus the iOS OTA path,
   measured against a baseline `main` build.
4. One ticket = one OpenSpec change. The cutover change carries all `MODIFIED`/`REMOVED` deltas, the
   rewritten `calendar-owned-shell.contract.test.ts` and the book rewrite. Machinery cleanup is a
   later change.
5. Put the paging math in `calendar/data` (90% gate). Extend the Reanimated scroll-handler mock to
   cover all handler keys.
6. Adopt the non-skippable device gate in §3.4.
7. Cut over straight, with no flag. Prefer a no-native-code design to keep OTA rollback.

## Questions for the owner

1. Product §6.1 and §13: during chained rapid swipes, may the title and selected date stay on the
   last *settled* page until the final idle, or should they follow each page crossing? And if
   rendering falls behind a fast chain, what is acceptable: a placeholder page or limiting the chain?
2. Is a bounded index range (for example ±5 years, silently recentred at idle) compatible with "no
   fixed navigation limit"? Or must recentring be invisible at any distance?
3. Do you accept the §3.4 gate: draft PRs and no merge without your recorded verdict on the exact
   tested revision? This deliberately overrides `/ship`'s "never block on human-only work" for this
   project.
4. Which iOS route will you support for evidence: the OTA to your TestFlight preview build (needs a
   current preview binary installed), or an EAS cloud build with your credentials?
5. Should a native module be ruled out up front to keep OTA rollback and avoid a D08 dossier, or
   stay as an escalation option?
