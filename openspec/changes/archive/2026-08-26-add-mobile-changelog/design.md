## Context

The shipped React Native About screen is a root Stack destination that consumes the
Settings grouped-row primitives, while `(tabs)` is the stable Home/Calendar/Settings
boundary. Onboarding is a reachable welcome-first Stack rather than a first-launch gate.
The app already owns synchronous number reads/writes through `@/storage`, typed EN/FR
catalog parity, thin route entrypoints, and platform symbol maps.

Flutter is reference-only. Its changelog used integer releases 1–3, stored
`current_version`, selected newer entries for the automatic surface, showed all entries
from About, and wrote the current integer on dismissal. The RN feature deliberately starts
with one new localized 4.0 entry and must differ on a missing preference: a fresh install
silently records 4, whereas Phase 09 will import a migrated Flutter value of 3 so that
returning users see the 4.0 sheet once.

The version integer lives in the JavaScript bundle by product decision. That makes a future
OTA update capable of bumping the integer and bundled catalog without waiting for a native
binary. The persistence/gating convention and migration seam are costly to reverse, so this
change adds an ADR and updates the binding Architecture Book.

## Goals / Non-Goals

**Goals:**

- Ship one typed, bundled, localized 4.0 entry through a reusable content component.
- Provide a regular pushed history destination from About and a native modal/sheet that
  presents only unseen entries once per version.
- Make absent, older, current, corrupt, and dismissal behavior deterministic and testable.
- Make onboarding exclusion structural, retain OTA-trigger behavior, and expose one Phase 09
  import setter without implementing migration.
- Meet machine-verifiable DoD gates and preserve device-only evidence as a non-blocking
  migration inbox checklist.

**Non-Goals:**

- No Flutter entries 1–3, remote/server content, rich media, markdown, release-note
  analytics, notification trigger, or dependency upgrade.
- No Phase 09 native SharedPreferences import, first-run onboarding gate, or attempt to
  infer migrated-user status before that phase lands.
- No edit under `app/`, OpenAPI/generated-client, server/schema, Firebase, Expo/native/EAS
  configuration, infrastructure, workflow, credential, or store-submission surface.
- No `run-e2e` label and no new dev-only route solely to mutate MMKV for Maestro.

## Decisions

### Decision 1 — A feature-local typed catalog owns release data

Create `mobile/src/features/changelog/` with `data/`, `store/`, and `ui/` sublayers and
small barrels. `data/` exports `CHANGELOG_VERSION = 4`, a readonly newest-first catalog,
and pure selection helpers. Each release has a numeric gate version, a display label
(`"4.0"`), and readonly item descriptors whose title/subtitle are typed i18n keys and
whose icon is the same `{ ios, android, web }` SF Symbols / Material Symbols map consumed
by Settings rows.

The first catalog contains exactly these localized concepts:

| Icon concept | English                                                                    | French                                                                                                  |
| ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| design       | A fresh new design — A calmer, clearer experience designed for your phone. | Un tout nouveau design — Une expérience plus claire et agréable, pensée pour votre téléphone.           |
| speed        | A faster calendar — Your schedule loads quickly and stays useful offline.  | Un calendrier plus rapide — Votre emploi du temps se charge rapidement et reste disponible hors ligne.  |
| native phone | A truly native feel — Navigation and controls now follow iOS and Android.  | Une expérience vraiment native — La navigation et les commandes s’adaptent maintenant à iOS et Android. |

The exact natural-language copy may be polished during apply while preserving meaning and
FR/EN parity. I18n keys rather than embedded translated objects keep the established typed
catalog gate authoritative. Server data was rejected because offline startup, deterministic
OTA bundling, and a one-entry history do not justify fetching or caching infrastructure.
Carrying Flutter entries 1–3 was rejected by the fixed fresh-start product decision.

### Decision 2 — A total store and pure decision model separate reads from effects

The `store/` sublayer owns the flat MMKV key `changelogSeenVersion` and reaches it only
through `@/storage`. It exports imperative read/write functions, including the single
public `setChangelogSeenVersion(version)` migration hook required by Phase 09. Reads accept
only finite, non-negative safe integers; any missing or malformed value is treated as
absent so corruption cannot throw or unexpectedly show release notes.

A pure gate helper returns one of three decisions:

- absent/malformed → `seedCurrent` (write 4, do not navigate);
- integer `< 4` → `present` with releases whose numeric version is greater than it;
- integer `>= 4` → `skip`.

The selector orders releases newest-first and never mutates the catalog. Keeping selection
and state classification pure gives the 90%-gated logic deterministic absent/older/current,
future-version, corrupt-value, and boundary tests. A boolean “seen” key was rejected because
it cannot express future releases or the Phase 09 import. An installed-native app version was
rejected because it would break OTA-trigger behavior.

### Decision 3 — Mount the automatic gate inside `(tabs)`, not the global root

Add a renderless `ChangelogGate` component from the feature UI public surface to
`mobile/src/app/(tabs)/_layout.tsx`. It evaluates once per tabs-layout mount after the tab
navigator exists. `seedCurrent` writes 4 synchronously and stops; `skip` does nothing;
`present` pushes `/changelog-sheet`. A ref/effect guard prevents duplicate pushes during
rerenders before dismissal.

This placement is the executable onboarding exclusion: cold onboarding deep links render
the sibling onboarding Stack without mounting `(tabs)`, so the sheet cannot cover the
welcome/source-selection flow. Returning to tabs becomes the first eligible point. A global
root effect plus pathname checks was rejected because it creates timing races between route
resolution and presentation. Writing 4 before navigation was rejected because the sheet
must still derive unseen entries and dismissal, not attempted presentation, is the durable
acknowledgement.

### Decision 4 — Two thin routes compose one release-content component

Add two root Stack siblings:

- `/changelog` is a regular card/pushed destination with `headerShown: true`, reached from
  About, and renders every bundled release.
- `/changelog-sheet` is registered with a visible native header and platform-selected
  presentation: iOS `formSheet` (large detent/grabber using Expo Router SDK 56 options),
  Android `fullScreenModal`/native modal fallback. It renders only releases newer than the
  stored seen integer and ends with a full-width primary Continue action.

Both route files are one-line exports through `features/changelog/ui`. The history and
sheet screen wrappers compose one `ChangelogContent` component that owns grouped version
sections and item rows; they differ only in entry selection and sheet-only controls. A
single route with a query-mode flag was rejected because it makes presentation semantics
deep-link-controlled and weakens route-structure proofs. Duplicated screen markup was
rejected because the two surfaces must not drift.

`ChangelogContent` uses theme tokens, safe-area-aware scrolling, semantic version headings,
wrapping title/subtitle text, hidden decorative symbols, and minimum-height controls. The
history relies on the native back affordance. The sheet exposes a localized close header
action and localized Continue button; both are one accessible button target.

### Decision 5 — Every sheet exit acknowledges version 4

The sheet reads the seen version before rendering, selects only newer releases, and owns an
idempotent `acknowledgeAndDismiss` callback that writes `CHANGELOG_VERSION` before calling
Expo Router dismissal. Both the explicit close action and Continue call it. A mount cleanup
also writes 4, covering native swipe-to-dismiss, Android back, and parent removal paths that
bypass the explicit callbacks. Repeated writes are harmless and make every dismissal path
converge on the same state.

Component tests prove close and Continue write before dismissal and prove unmount cleanup
persists. The gate/store tests prove the next evaluation skips. Preventing native dismissal
was rejected because swipe/back are expected platform idioms; relying only on a custom close
button would violate the “every dismissal path” requirement.

### Decision 6 — About gains the history row through its existing row grammar

Add a router `SettingsRow` to About's App section adjacent to the installed-version value,
using a platform history/sparkles symbol map, `/changelog`, a localized label and navigation
hint, and stable `about-changelog` test ID. This consumes the existing router variant; no
Settings primitive generalization is required. About remains the only manual history entry,
and the Settings hub continues to expose only About rather than duplicating Changelog.

Update the existing About test from “Changelog absent” to grouped order, full-width link
semantics, and exact route dispatch. Update its Maestro flow to enter About from Settings,
tap the new row, and assert the 4.0 history content. The current harness cannot seed MMKV
cross-platform, so the automatic sheet Maestro case is explicitly N/A unless apply finds an
existing supported preference-seeding seam; unit/component coverage owns the gate and sheet.

### Decision 7 — Typed localization and focused proofs cover the contract

Add EN/FR keys for both route titles, version heading, all item copy, About row/hint, close,
Continue, and accessibility labels. EN remains the compile-time source and bidirectional
catalog parity remains the `tsc` gate.

Automated proof is split by responsibility:

- `data/` tests: newest-first/all/newer-than selection and release-version boundaries;
- `store/` tests: key round trip plus total missing/malformed reads and the exported setter;
- gate tests: absent seeds silently, older navigates exactly once, current/future skips;
- UI tests: shared history/sheet content, EN/FR copy, semantic headings, symbol decoration,
  close/Continue/unmount persistence, and safe-area/large-content behavior;
- route-structure test: two thin route exports, root Stack registration/presentation, and
  gate placement under `(tabs)` rather than onboarding/root;
- Maestro: About → Changelog history on the shared iOS/Android EN flow.

Run focused suites while implementing, then `npx tsc --noEmit`, `npm run lint`, formatting,
and `npm test -- --coverage`. Logic files must clear the configured 90% per-file branch/line
gate and the project must retain the 70% global floor.

### Decision 8 — Record the long-lived version/migration contract

Add ADR 039 for integer gate versioning, absent-value suppression, tabs ownership, JS-bundle
OTA semantics, and the Phase 09 setter contract. Update `features.md`, `navigation.md`, and
`storage.md`; add ADR 039 to the decision index and one line to the existing uppercase
Architecture Book `CHANGELOG.md`. Mark Phase 07 Changelog shipped with the eventual draft PR
number and add to Phase 09: read `flutter.current_version`, validate the integer, and call
`setChangelogSeenVersion` before the first tabs eligibility check.

Add a dated `(HUMAN: …)` inbox note for iOS form-sheet and Android modal presentation,
light/dark, close/Continue/swipe/back behavior, history navigation, VoiceOver/TalkBack order
and announcements, large text, touch targets, and the migrated-value 3 → one presentation →
4 sequence. The no-simulator host makes this evidence non-blocking.

## Risks / Trade-offs

- **[The gate presents while another root route is active]** → Mount it only in the tabs
  layout and test that the root/onboarding layouts contain no gate wiring.
- **[A rerender pushes duplicate sheets]** → Evaluate in a guarded effect and test repeated
  renders against one navigation call.
- **[Swipe/back dismissal fails to persist]** → Share one idempotent write callback across
  explicit controls and add unmount cleanup as the native-dismiss backstop.
- **[A corrupt MMKV number causes a surprise sheet or crash]** → Total-parse safe integers;
  invalid data follows the fresh-install silent-seed path.
- **[A future OTA bumps the integer without matching content]** → Keep the version and typed
  catalog in one data module, test catalog/current consistency, and document that every bump
  must add at least one matching release.
- **[Phase 09 imports too late]** → Document the exact exported setter and require migration
  before the tabs gate; the current change intentionally does not guess migration state.
- **[iOS form-sheet content clips under large type]** → Use a large detent, scrollable shared
  content, safe areas, and the human large-text pass; Android uses full-screen modal form.
- **[Automatic presentation lacks device E2E in this harness]** → Cover all state/dismissal
  branches under Jest and record the device sequence; add a seeded Maestro flow only if a
  supported seam already exists, without inventing production/debug scope.

## Migration Plan

1. Add the catalog, pure selectors, MMKV store, and focused logic tests.
2. Add shared content, history/sheet wrappers, gate, routes, About integration, catalogs,
   component tests, and route-structure proof.
3. Update Maestro, Architecture Book/ADR/roadmaps, and the human device-pass note.
4. Run focused proofs, full local mobile green with coverage, and strict OpenSpec validation.
5. Ship as a JS-capable feature with no native dependency/config change. Phase 09 later calls
   the exported setter before mounting tabs; no migration runs in this release.

Rollback removes the routes, gate, feature module, About row, catalog keys, and MMKV
documentation. An existing `changelogSeenVersion` value is harmless orphaned local data and
may remain; no destructive cleanup or server/native rollback is required.

## Open Questions

None. Catalog scope, version integer, fresh-install behavior, migration hook, surfaces,
presentation, onboarding exclusion, QA posture, and sensitive-surface boundaries are fixed by
the issue brief and established mobile architecture.
