## ADDED Requirements

### Requirement: Test-only fixtures cover the complete integrated export-guide matrix
The test/E2E server SHALL seed immutable FR and EN schema-v1 catalogue data for ADE, Hyperplanning
(`hplanning`), Celcat, and Generic in canonical selectable order. It SHALL expose stable listed
schools for an exact mapping, a valid unknown-provider mapping which reaches the mobile resolver,
required Connect with safe, missing, and unsafe URLs, an unlisted selection path, and one controlled
broken page image. The export-guide feature flag SHALL be enabled only in the isolated test/E2E
database. No fixture, flag state, or object mutation SHALL reach development, preproduction, or
production.

#### Scenario: Exact and substituted listed schools load through the real server
- **WHEN** the mobile proof reads the seeded schools and catalogue through NestJS and Postgres
- **THEN** the exact school resolves its configured provider and the unknown valid slug resolves
  Generic with the bounded substitution reason
- **AND** both use the same immutable fixture catalogue version

#### Scenario: Connect fixture variants remain safe
- **WHEN** the proof selects schools whose required Connect URL is safe, missing, or unsafe
- **THEN** only the safe URL exposes Connect and the other two continue to guide resolution with
  their bounded skip diagnostics

#### Scenario: Broken image degrades without blocking
- **WHEN** the approved-origin fixture image cannot be loaded
- **THEN** the native text-only placeholder appears with non-duplicated meaning
- **AND** the guide can still reach the guarded manual selector

#### Scenario: Normal environments remain untouched
- **WHEN** database seeding or server boot runs outside the test/E2E environment
- **THEN** the proof schools and enabled proof flag are absent
- **AND** no catalogue, object-storage, or environment mutation is performed

### Requirement: Release-configuration development variants execute shared real-server flows
The export-guide proof SHALL run shared Maestro YAML on Android and iOS release-configuration
development variants with no Metro. Both platforms SHALL use one exact implementation SHA, the
same server image/source revision and fixture catalogue version, and the real NestJS/Postgres/Redis
boundary. Syntax or selector validation alone SHALL NOT count as execution evidence.

#### Scenario: Listed exact and Generic substitution complete
- **WHEN** the Android and iOS proof suites select the exact-mapped and unknown-provider schools
- **THEN** each traverses its resolved pages, exercises ordinary Back, and reaches the existing
  manual selector only after final Next

#### Scenario: Unlisted selection is server-driven
- **WHEN** the proof enters an unlisted institution and opens provider selection
- **THEN** every valid selectable provider appears in server order without a client allowlist
- **AND** selecting a provider pins its pages and completes through the guarded handoff

#### Scenario: Blocking Retry restores the required path
- **WHEN** first-run loading has no usable response or LKG and later connectivity is restored
- **THEN** the blocking screen offers Back and single-flight Retry
- **AND** Retry loads the guide rather than exposing manual, QR, or iCal import

### Requirement: Production-identity release builds fail closed on protected deep links
Both Android and iOS proof SHALL build a production-identity Release configuration for local
emulator/simulator execution without changing store/native configuration or contacting a live
backend. Direct cold links to manual import, QR, and iCal SHALL recover to School without exposing a
create action, and the development completion seed SHALL return false. A development identity,
`__DEV__`, route parameters, restored navigation, or persisted data SHALL NOT be accepted as
production completion proof.

#### Scenario: Protected cold links cannot bypass the guide
- **WHEN** a state-empty production-identity Release build opens each manual, QR, and iCal route
- **THEN** each recovers to School without rendering the protected destination or creating a
  redirect loop

#### Scenario: Development seed is absent
- **WHEN** the production-identity build invokes the bounded completion-seed probe
- **THEN** the seed is rejected and protected route legality remains false

### Requirement: Automated evidence is bound to one immutable implementation head
Every automated proof SHALL emit machine-readable and readable summaries containing the exact
commit SHA, workflow run, UTC date, suite, app identity and runtime variant, build configuration,
server/fixture catalogue version, runner image, emulator or simulator model, OS/runtime, relevant
tool versions, and pass/fail per flow and guard axis. Missing, cancelled, or skipped required axes
SHALL remain failed or not-run. Evidence from another SHA SHALL NOT satisfy the current head.

#### Scenario: Both platform jobs pass at the requested SHA
- **WHEN** one manual export-guide dispatch completes successfully
- **THEN** its Android and iOS summaries name the same resolved SHA and fixture version
- **AND** retained artifacts link each result to raw Maestro and server diagnostics

#### Scenario: Evidence is stale or incomplete
- **WHEN** a required job is skipped, cancelled, failed, or names a different SHA
- **THEN** the evidence checker refuses a complete result and identifies the missing safe axis IDs

### Requirement: Named physical-device evidence uses a complete auditable matrix
The repository SHALL provide a `(HUMAN: ...)` procedure and result template for one supported
physical iPhone with VoiceOver, one supported physical iPad in portrait at compact and
readable-width boundaries, and one representative supported low-end physical Android phone with
TalkBack. Across the named matrix it SHALL record light/dark mode, largest text/font scale, touch
targets, focus/progress announcements, native Back/swipe/system Back, offline first run, fresh and
stale LKG, Retry after restoration, safe/missing Connect URL, broken image,
background/foreground, process death, and final guarded QR/iCal transition. Each observation SHALL
include actual model, OS, build SHA/variant, fixture version, UTC date, and pass/fail/not-run.

#### Scenario: A physical observation is recorded
- **WHEN** an authorized operator executes an axis on a named device
- **THEN** the result records all provenance fields and one explicit outcome for the same
  implementation SHA

#### Scenario: An axis has not run
- **WHEN** no physical observation exists for a required device/axis pair
- **THEN** the template reports `NOT RUN` and SHALL NOT infer a pass from Jest, Maestro syntax,
  simulator/emulator execution, or another device

#### Scenario: The implementation head changes
- **WHEN** code or fixture changes after a physical matrix was recorded
- **THEN** the previous matrix is retained as historical evidence but no longer satisfies the new
  head until the complete applicable matrix is rerun

### Requirement: Proof collection performs no rollout act
The proof implementation and its execution SHALL NOT activate or deploy a catalogue, enable a live
flag, mutate production/preproduction, upload an object, submit or install through a store, use live
credentials, or change Flutter/web behavior. The repository merge SHALL remain governed by the
normal reviewer and green-CI policy; missing physical execution SHALL be recorded honestly in the
human inbox rather than converted into a repository-merge approval gate.

#### Scenario: Repository proof is reviewed
- **WHEN** the final diff and automated jobs are inspected
- **THEN** all runtime writes are confined to disposable test/E2E services and run artifacts
- **AND** sensitive native/store, Firebase, deployment, credential, Flutter, and web surfaces are
  unchanged
