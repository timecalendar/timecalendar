## Context

The Activity fixture imports one baseline row, marks it read, then imports exactly 52 newer logs.
The newer fixture's fixed same-timestamp UUID pair straddles the explicit 50-row client boundary:
`e2e-activity-tie-higher` is the last row of page one, while `e2e-activity-tie-lower` and
`e2e-activity-older-anchor` require the following response. The production screen intentionally
renders each server log as one `SectionList` group and virtualizes its children, as required by the
`mobile-activity-ui` contract.

At source SHA `44247509b980f8d8f9340def5d63f56deaab37ba`, the iOS job in
[run 33409431164](https://github.com/timecalendar/timecalendar/actions/runs/33409431164) passed the
clean native build, imports, exact unread count, detail navigation, changed-row navigation,
cancelled-row inertness, and pull-to-refresh assertions. Its final screenshot after the full
60-second `scrollUntilVisible` timeout showed a healthy Activity list at filler rows 24–27. The
command had therefore traversed the list but could not reach row 50 within one bounded command.
[Run 33378324774](https://github.com/timecalendar/timecalendar/actions/runs/33378324774) failed at
the same selector.

This distinguishes three things:

- The server seed and newest-page response contain the tie-higher row in the contractual order.
- The app is rendering and scrolling the cached first page; no terminal state or request failure is
  visible.
- A single iOS Maestro traversal over roughly 50 tall, grouped, virtualized rows exceeds its
  existing 60-second command budget.

The host cannot reproduce iOS native execution locally because it has no simulator or KVM. Local
proof is therefore the focused source-level regression test plus lint/Jest; exact-head native proof
belongs to CI.

## Goals / Non-Goals

**Goals:**

- Make the existing first-page tie-higher row deterministically reachable on iOS.
- Preserve the exact tie-order and following-page assertions, the real development-backend import,
  and the one-attempt terminal-failure policy.
- Encode the required traversal structure in a focused Jest regression test.
- Keep the shared flow unchanged between iOS and Android.

**Non-Goals:**

- Changing Activity ordering, SQLite state, pagination cursors, the 50-row page size, or list UI.
- Adding sleeps, retries, optional assertions, weaker visibility thresholds, or longer timeouts.
- Changing CocoaPods, `.github/workflows/ci-mobile-e2e.yml`, backend lifecycle, dependencies, or
  generated/native output.
- Touching any sensitive surface or the Architecture Book for this leaf proof repair.

## Decision 1 — Split the first-page traversal at a positively asserted seeded midpoint

Add a `scrollUntilVisible` plus `assertVisible` for
`activity-new-e2e-activity-filler-025` immediately before the existing tie-higher traversal. Keep
the existing tie-higher, tie-lower, and older-anchor scroll/assert pairs unchanged after it.

The failing artifact proves filler 025 is reachable inside the current command budget, and the
fixture places the tie-higher row approximately another half-page of logs below it. Each command
therefore traverses a bounded portion of the same native list. The checkpoint is a real seeded row,
not a timing signal, so success still requires the app to render the correct first-page content.

Alternatives rejected:

- Increasing the 60-second timeout or retrying the command hides a terminal failure behind more
  time and is explicitly out of scope.
- Increasing Maestro speed or lowering visibility percentage changes gesture/detection tolerance
  without proving the underlying row path.
- Tuning `SectionList` batching/window props or disabling virtualization changes product rendering
  without evidence of an app defect and risks the large-group virtualization contract.
- Shrinking headers/rows would trade away readability, wrapping, and accessibility to satisfy the
  harness.
- Removing the first-page assertion or jumping directly to the older anchor would weaken the
  timestamp-tie proof.

## Decision 2 — Make the traversal structure an executable source contract

Extend `activity-maestro-selectors.test.ts` to require, in order:

1. midpoint `scrollUntilVisible` and positive assertion;
2. tie-higher `scrollUntilVisible` and positive assertion;
3. tie-lower `scrollUntilVisible` and positive assertion; and
4. older-anchor `scrollUntilVisible` and positive assertion.

The test must also keep these commands non-optional. This catches removal, reordering, or
optionalization locally before spending a native CI run. Existing server integration coverage
continues to own seed repeatability and exact page membership; the source test owns the Maestro
journey shape.

An additional app component test is rejected because no component behavior changes. A test that
only searches for the midpoint ID anywhere in YAML is also insufficient because it would not
protect the ordering that bounds the two traversal legs.

## Decision 3 — Document the bounded checkpoint without changing architecture

Update the Activity fixture section of `mobile/e2e/README.md` to state why the stable midpoint is
observed before the page-boundary pair on long iOS lists. This is harness operating context, not a
reusable architectural rule or costly-to-reverse decision, so no ADR or Architecture Book change is
warranted under R-4. The ticket also explicitly keeps `docs/mobile/architecture-book/` out of scope.

## Risks / Trade-offs

- **The fixture shape changes and filler 025 stops being a midpoint** → keep the checkpoint UID
  deterministic and protect its position relative to the tie selectors in the focused flow test;
  existing server tests remain the authority for exact page membership.
- **Two scroll commands take longer than one on fast platforms** → accept the small deterministic
  runtime cost; the flow gains a real observation rather than a sleep or retry.
- **The checkpoint passes while pagination later fails** → retain all three existing boundary and
  older-page assertions; the checkpoint only makes the first of them reachable.
- **Local tests cannot prove iOS gesture behavior** → require `Run mobile E2E (iOS)` success on the
  exact implementation head and record the direct job link and SHA before review completes.

## Migration Plan

No data or deployment migration is required. Apply the shared-flow, focused-test, and README edits
in one commit; run the focused Jest test and lint locally; then label the draft PR `run-e2e` so the
existing native workflow proves the exact head. Rollback is the ordinary revert of those three
files.

## Open Questions

None. The failing artifact identifies a stable midpoint already reached inside the existing budget,
and the ticket fixes the allowed verification path and exclusions.
