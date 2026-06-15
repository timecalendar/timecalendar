# ADR log — TimeCalendar mobile

One short record per architectural decision: context, choice, alternatives,
"revisit if…". One of the [five living artifacts](../architecture.md#the-five-living-artifacts);
sibling of the Architecture Book, source of truth for *decisions* the way the book
is source of truth for *rules*.

## The process (mirrors migration-approach §7)

A load-bearing decision (R-4 triage: affects patterns reused across features) earns
an ADR. To add one:

1. Copy [`TEMPLATE.md`](./TEMPLATE.md) to `NNN-kebab-title.md` (next free number below).
2. Fill Context / Decision / Consequences / Revisit-if; set Status.
3. Add the row to the index.
4. If the decision changes a rule, update the Architecture Book **and** append to the
   [Rule changelog](../architecture-changelog.md) — the act of changing rules is itself recorded.

We expect to revise. A fired revisit is recorded **in place** (dated, in the ADR's
Status) — superseding an ADR means writing the new one and marking the old
`Superseded by NNN`, never deleting it.

## Index

| # | Title | Status | Revisit trigger |
| --- | --- | --- | --- |
| [001](./001-sdk-target.md) | SDK target: latest stable Expo SDK at scaffold | Accepted · revisit fired 2026-06-12 (scaffolded directly on SDK 56) | A future SDK forces a deferred breaking change, or a beta capability becomes load-bearing pre-GA |
| [002](./002-minimum-os.md) | Minimum OS: iOS 15.1 / Android API 24 | Accepted · revisit fired 2026-06-12 (effective floors iOS 16.4 / API 24) | Install base below the floors, or an SDK raises its own minimum again |
| [003](./003-coverage-threshold.md) | Coverage: 90% logic / 70% global, CI-enforced | Accepted · **enforced 2026-06-14** (wired by Settings prefs, TIM-130) | The gate drives cargo-cult tests rather than catching regressions |
| [004](./004-phase-1-feature-order.md) | Phase 1 feature order: Settings → Personal events → School selection | Accepted · not started | A dependency forces a different order, or a feature is too thin for its axis |
| [005](./005-calendar-spike.md) | Calendar spike: 3-day read-only spike opens Phase 2 | Accepted · not started | The spike clearly succeeds or fails early |
| [006](./006-eas-distribution.md) | EAS distribution: fingerprint runtime policy, human-invoked builds (CI untouched) | Accepted | Manual dogfood builds become a friction point (wire `.eas/workflows/`), or fingerprint forces rebuilds so often OTA stops paying off |
| [007](./007-drop-web-target.md) | Drop the web target: iOS + Android only | Accepted | A real web roadmap appears (a genuine browser deliverable, not the template default) |
| [008](./008-brand-color.md) | Brand color: adopt the Flutter pink hue as the `primary` token | Accepted | A designer-driven palette change, or a real surface fails the brand-color contrast |
| [009](./009-settings-feature-prefs.md) | First feature folder; Settings owns app preferences, consumed by infra seams | Accepted · **revisit fired 2026-06-14** (TIM-135; infra→feature edge resolved = allowed, B-4) | A **2nd** feature needs cross-cutting prefs (would re-open promote-to-infra) |
| [010](./010-expo-ui-chrome-wrapper.md) | `@expo/ui` adopted behind the chrome wrapper seam; universal entry the default | Accepted | A control needs a platform-specific entry / diverges, or `@expo/ui` proves unstable enough to warrant a fallback behind the same wrapper |
| [011](./011-personal-event-storage.md) | Personal-event storage: dates TEXT ISO-8601 UTC, color `#RRGGBB` TEXT, uid from `expo-crypto` | Accepted | A query/perf need genuinely requires numeric timestamps, or the Flutter wire format changes before the Phase-09 importer runs |
| [012](./012-personal-event-datetime-picker.md) | Date/time picker: `@expo/ui`'s own `DateTimePicker` behind the chrome wrapper (not `@react-native-community/datetimepicker`) | Accepted | `@expo/ui`'s control proves unstable enough to warrant the RNC fallback behind the same wrapper, or a control needs a platform-specific `@expo/ui` entry |
| [013](./013-query-persister-and-policy.md) | Offline query cache: a sync TanStack Query persister over the MMKV `@/storage` seam + the now-earned query policy | Accepted | The persisted cache grows large enough that sync MMKV writes jank (→ async/SQLite persister behind the seam), a read needs offline mutation queuing, or the query policy proves wrong for a more dynamic read |
| [014](./014-layered-feature-module-pattern.md) | The layered feature-module pattern: `src/features/<feature>/<layer>/` + sublayer/feature barrels + seam boundaries | Accepted · **lint landed 2026-06-14** (TIM-135 encoded B-1…B-4) | A *future* boundaries-encoding adjustment wants to change the shape, or a feature's axis needs a sublayer the pattern doesn't name |
| [015](./015-onboarding-flow-shape.md) | Onboarding flow shape: presentation-only `onboarding/` feature folder, welcome-first Stack, reachable but not a startup gate | Accepted | The calendar/home step wants the first-launch gate, the QR/iCal steps need onboarding to own more than presentation, or a designer multi-step intro replaces the single welcome surface |
| [016](./016-school-group-multi-select-commit.md) | School-group selection: multi-select committed by an explicit confirm, dismissing the onboarding Stack | Accepted | The calendar subscription step needs the confirm to PUT `SetSchoolGroupDto`, a school needs single-select group semantics, or ADR 015's deferred destination changes where the dismissal lands |
| [017](./017-qr-scan-camera.md) | QR scan: `expo-camera` for the camera surface, one `calendar-sources/` feature folder, no chrome wrapper, the QR yields a URL | Accepted | `expo-camera` proves insufficient (→ vision-camera), a camera surface needs a chrome wrapper, the server needs raw `webcal://` / a non-URL QR envelope, or a second input surface shows the single-folder shape doesn't fit |
| [018](./018-user-calendar-storage.md) | User-calendar storage: Drizzle (not MMKV) for the durable `user_calendars` token store; schema mirrors the Flutter `toDbMap()` verbatim (importer fidelity), `id`-is-record-key, dates TEXT ISO-8601 UTC, `visible` boolean | Accepted | A query/perf need requires numeric timestamps, the Flutter wire format changes pre-importer, a genuinely non-relational identity blob appears (re-weigh MMKV), or `visible` earns a toggle UI |

ADRs 001–005 are the Phase 0 kickoff knobs K-1…K-5 from migration-approach §8,
authored as real ADRs here (the Phase 0 exit criterion: "first ADRs written —
K-1…K-5 become real ADRs"). §8 is their origin record; this log is their canonical
home going forward.

## Pending lifts

Some change-local ADRs already live **inside their archived change** and are lifted
into this log (as the next free numbers, 006+) when they are next revised — moving
an archived change's file now would rewrite history in the archive, and these are
already authoritative where the book cites them.

| Where it lives now | What it decides | Lift when |
| --- | --- | --- |
| `openspec/changes/archive/2026-06-12-add-mobile-api-client/adr-001-committed-spec-seam.md` | The committed-spec seam (`openapi/openapi.json` as the single server↔mobile contract). Authoritative in the Architecture Book "Data layer" section. | Next revised, or when the contract seam itself changes. |
