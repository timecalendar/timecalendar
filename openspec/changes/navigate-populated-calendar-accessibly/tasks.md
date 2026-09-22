## 1. Prove the approved native tree before expanding it

- [x] 1.1 Add the pure committed-page `CalendarAccessibilityEntryV1` projection plus deterministic 01:00, 10:00, 23:00, tied-order, overlap, and tiny-target fixtures; verify total date/start/end/source/UID order, one identity each, duplicate rejection, neighbour-page exclusion, and zoom/viewport independence with 100% statement and branch coverage for introduced pure logic.
- [x] 1.2 Wire only the minimum real-route existing-tree experiment: each visible tile is its sole semantic event button, conflict pointer overlays are non-semantic, adjacent pages/child visuals stay hidden, and test-only diagnostics report content-free identity/order/frame/route results without adding a second semantic tree.
- [ ] 1.3 Run the probe on actual iOS and Android paths with VoiceOver/TalkBack plus applicable Voice Control and Switch Control over the offscreen/dense fixture; record exact commit, build, device/OS, preparation, traversal, geometry, and routed UID. If either platform cannot reach every event once or activate the intended visible identity, stop, commit the diagnostic result, return the issue for a scoped D06 revision, and do not perform sections 2–6.

## 2. Complete chronological event semantics after the gate passes

- [ ] 2.1 Make the committed projection the source order for the same visual event targets, preserving complete translated title/time/location/checklist labels and original identities while keeping adjacent pages, grid/gutter/current-time decoration, filtered events, and conflict overlays out of the event tree; verify direct and dense components expose the exact expected node sequence and activation UIDs.
- [ ] 2.2 Retain the current page's complete semantic targets through the bounded vertical owner so 01:00 and 23:00 remain reachable from the 10:00 viewport at minimum/default/maximum zoom; verify scroll-to-reveal uses the existing owner, releases old page refs, retains no session history, and applies no event cap.
- [ ] 2.3 Preserve T11 pointer disambiguation with one non-semantic union overlay and the existing localized focus-contained chooser while assistive activation opens the focused original identity directly; verify cancellation, generation replacement, background isolation, exact option order, and no duplicate semantic node.

## 3. Preserve identity focus and settled context

- [ ] 3.1 Add a bounded source/UID target-ref registry and focus state at the screen/renderer boundary; verify registration/cleanup, last-focused identity/date capture, and rejection of neighbour-page, unmounted, duplicate, and obsolete-revision targets.
- [ ] 3.2 After an accepted complete revision, reveal then focus the surviving identity once; otherwise focus its relevant committed date heading or the committed page heading. Verify details return, forward/back paging, Day/Week changes, removed identity, rapid supersession, and offscreen restoration without index- or pager-slot-based focus.
- [ ] 3.3 Retain one accepted-context announcement and the existing accessible page/zoom alternatives; add French/English typed-key parity only for genuinely new copy and verify zoom, vertical movement, focus restoration, cancelled transitions, and stale settlements do not duplicate announcements.

## 4. Preserve accessibility and repository contracts

- [ ] 4.1 Extend focused renderer and Calendar screen tests for chronological labels/order, one identity, direct and chooser paths, largest-text-safe complete semantics, meaningful target geometry, exact route activation, offscreen reachability inputs, focus fallback, and every previously accepted interaction touched by the slice.
- [ ] 4.2 Extend `mobile/calendar-owned-shell.contract.test.ts` as the CI proof test to assert one native vertical owner, one pager/three pages, one semantic target per committed identity, hidden adjacent pages/decorations/overlays, bounded focus refs, and absence of a hidden list, alternate renderer, experimental focus-order API, compatibility path, or per-frame React accessibility work.
- [ ] 4.3 Review the implementation against the binding Architecture Book Calendar/accessibility/testing contracts and record the update as N/A while this scope remains conforming and read-only. If implementation requires a reusable rule change, stop and return for an ADR plus explicit Reviewer scrutiny rather than editing `docs/mobile/architecture-book/` in this slice.

## 5. Run local-green verification

- [ ] 5.1 From `mobile/`, run every edited pure/component/screen suite with introduced pure coverage at 100%, then run the repository's canonical `npx tsc --noEmit`, `npm run lint`, scoped Prettier checks over all changed source/test/JSON/Markdown files, `npm run react-doctor:changed`, and the applicable Maestro selector/harness static checks; record exact commands, suite/test counts, coverage, and results without claiming native behavior.
- [ ] 5.2 Run `openspec validate navigate-populated-calendar-accessibly --strict`, inspect the final diff for out-of-scope or sensitive surfaces, and run the repository disclosure scan before every public PR write. No OpenAPI/generated client, migration, native/store/EAS/Firebase, deploy/CI/infrastructure, or legacy Flutter path may enter the change without returning it for re-scope.

## 6. Prove the exact final head and hand off

- [ ] 6.1 Commit and push the implementation head, wait for green CI including the owned-shell contract proof on that exact SHA, and record the PR head/build plus all local and CI command results. Relevant edits after native testing invalidate the affected device evidence and require reruns.
- [ ] 6.2 Run and record the complete native checklist on the exact final build: traverse each event once in chronological order; reach 01:00 and 23:00; retain labels/order through zoom and mode; operate page/zoom controls without gestures; activate the intended visible class with voice/switch; restore the surviving event or relevant date heading after details/paging; verify largest text and dense overlap; and repeat every touched prior interaction. Missing iOS or Android evidence remains Applier rework and is never inferred from earlier epics.
- [ ] 6.3 Update the canonical T12 execution-evidence section with the exact tested head/build, privacy-safe fixture measurements, command results, every checklist verdict, and the D06 gate outcome; leave Reviewer merge autonomous after green exact-head evidence and record the merged revision before successor promotion.
