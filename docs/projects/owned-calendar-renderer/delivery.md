# One brick at a time

## Approved working agreement

The product owner approved D01–D08 on 2026-09-12 and requested small vertical slices: implement
one brick, test it, receive feedback, confirm it works, merge, then move to the next brick.
This agreement controls execution even where two tickets are technically independent.

The roadmap's numbered sequence is the execution order. A ticket's `depends-on` lists real code,
contract or integration prerequisites; it does not disguise the owner's serial review policy as a
technical dependency. No downstream implementation starts while the current slice awaits feedback,
acceptance or merge. Read-only investigation and preparation may continue without building the
next capability. Planning completion is distinct from accepting an implementation ticket.

## The loop for every ticket

1. **Brief the owner.** Name the ticket, the one visible result, how to reach it, what is intentionally
   absent at this stage, test fixture and recommended device. Revalidate listed work sites against
   current code; earlier accepted tickets will have changed them.
2. **Implement just that slice.** Wire the feature through the real Calendar screen. Include the
   minimum data/state/presentation work needed to demonstrate it. Avoid separate hidden engine
   epics, speculative abstractions or a large batch of future features.
3. **Agent verification.** Run relevant tests, every edited test suite, type/lint/format checks and
   affected native-contract checks. Add meaningful properties for pure semantics. Review actual
   results rather than equating an exit code with evidence of accessibility or performance.
4. **Deliver a testable result.** Provide the installed/buildable app or exact launch instructions,
   fabricated fixture setup, build/revision, the ticket's checklist, agent results and limitations.
   Build/install authorization is handled by the implementation session; the planning skill only
   creates documents and does not perform Git, tracker, merge or release operations.
5. **Pause for owner QA.** The owner performs the checklist on the agreed device(s), provides
   observations, and can request revisions. No reply is not acceptance. The agent fixes issues in
   this same slice and supplies a focused retest checklist. Do not quietly move bugs into a later
   ticket merely to unblock progression.
6. **Record the outcome.** Explicit owner acceptance identifies the tested build and checklist
   results. Record unavailable device checks separately; only an explicit owner decision may defer
   an intermediate check, and a named later ticket must carry it. Final product gates stay binding.
7. **Merge, then continue.** After checks and explicit owner acceptance, the implementation workflow
   performs or requests the merge within its authorization. Record the merged revision. Start the
   next numbered ticket only when both acceptance and merge are evidenced.

If a ticket no longer fits one straightforward demo, split it before expanding implementation.
Preserve its stable ID for the first part, allocate a new unused ID for another part, and explicitly
update execution order, dependencies, epic index, evidence mapping and QA. Number order is the
initial convention; the roadmap remains authoritative after a split. Changing an epic's outcome,
product scope or approved architecture requires a recorded decision, not just a ticket edit.

## What counts as a small, healthy merge

One brick may be an empty scroll surface or a single event tile. It need not satisfy the entire
final Calendar contract. It must satisfy its own checklist and preserve earlier accepted bricks.
The app must build, relevant checks must pass, and retained routes/storage/agenda/details must work.
No disabled tests, placeholder handlers, silent catches or vendor compatibility layer are acceptable
ways to get there. Do not leave enabled controls that cannot work at the current milestone.

The owned shell replaces calendar-kit in T01. The day/week timeline is intentionally incomplete
until later slices land; stored events and the existing agenda/details flows are preserved.
Each review describes those temporary capability limits. No second runtime renderer or flag is
introduced. This pre-launch sequence is not eligible for store release until T29 passes. Reverting
a defective slice restores the last accepted coherent build; it does not authorize vendor launch.

## QA without making the owner do engineering research

The agent prepares fixtures, comparisons, automated checks, traces and recommendations. The owner
checks visible behavior and feel; a human accessibility tester may help with native assistive tools.
Each ticket has a concrete checklist with expected outcomes, not a request to choose an algorithm.
The agent supplies content-free instrumentation and explains findings in plain words.

Use an agreed owner device for ordinary slice QA. Gesture, layout, native configuration and
accessibility tickets identify where early iOS/Android or tablet testing is especially valuable.
Record the device/OS/build actually tested; never label a simulator check as a physical-device pass.
T28 closes the full binding device/accessibility/window matrix and any explicitly deferred checks.
Performance claims use release builds; development builds can demonstrate behavior but cannot pass
release timing gates. T26/T27 collect complete latency/resource evidence; early tickets collect
focused measurements so obvious failures are found while their code is small.

All owner steps use fabricated events. The agent seeds a disposable local test installation through
test-support/harness code outside production paths. The ticket handoff supplies exact setup/reset
instructions and expected dates. Never use personal calendar content, the unrelated workspace ICS
file, or an unreviewed production export as benchmark/test evidence.

## Common agent checks

Read `mobile/AGENTS.md`, the Architecture Book testing/definition-of-done pages and package scripts
at execution time. From `mobile/`, use `npm test -- --runTestsByPath <actual edited suites>` for
focused proof, plus the applicable coverage run, `npx tsc --noEmit`, `npm run lint`, scoped Prettier
checks and React Doctor review. Replace the command's argument with existing suite paths in the
handoff; it is not a literal runnable command. Every edited test file must be run. Pure modules
covered by the approved contract require 100% statement and branch coverage plus properties as
introduced; do not postpone their correctness to the final ticket. Reuse the established three
Maestro journeys and helpers rather than creating extra top-level journeys per brick.

Native-config work runs source tests plus `npm run test:ios-device-contract` and
`npm run verify:ios-device-contract` against the updated source contract. Run release-specific
measurement commands when implementing instrumentation and record exact tool versions/commands.
No universal made-up benchmark command is claimed here.

## Per-ticket evidence record

Each ticket starts as planned with QA not run and no acceptance/merge. During execution record:

- code/build revision and runtime fingerprint where relevant;
- fixture version/seed and exact setup/launch instructions;
- device model, OS, physical/simulator and development/release build;
- agent checks with commands and outcomes;
- each owner checklist item: pass, fail, or explicitly deferred with destination ticket;
- feedback and retest evidence;
- explicit owner acceptance source/date;
- merged revision and remaining product-wide gates.

Put results under `research/results/<ticket-id>/<run-id>/` or link durable content-free artifacts
with checksums from the ticket. The path convention reserves future evidence; no result is claimed
by an empty directory or unchecked list. The acceptance research plan supplies trace retention and
privacy rules. Final launch evidence cannot rely on expired artifacts or undocumented recollection.
