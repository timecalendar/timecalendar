## Why

The React Native app has no “What’s new” experience, so returning Flutter users cannot
discover the 4.0 rebuild and About has no release-history destination. Phase 07 now needs
both the user-invoked history and the forward-compatible once-per-version presentation
before Phase 09 imports Flutter's last-seen value.

## What Changes

- Add one typed, bundled, localized 4.0 changelog entry and reusable native presentation
  shared by a full history screen and a once-per-version modal/sheet.
- Add a `CHANGELOG_VERSION = 4` gate backed by the `changelogSeenVersion` MMKV key:
  silently seed a missing value to 4, present only entries newer than an older value,
  skip presentation for a current value, and persist 4 for every dismissal path.
- Mount the auto-show trigger at the tabs boundary so onboarding routes can never be
  covered, while retaining JavaScript-bundle versioning so a future OTA bump can trigger
  the same flow.
- Export the typed seen-version setter that Phase 09 will use to import Flutter's
  `current_version`, without implementing the native migration in this change.
- Add a localized Changelog row to About, a regular pushed history route, and an Expo
  Router modal/sheet route using native headers, platform symbols, and a Continue action.
- Add typed-catalog parity, gating/store/component/route tests, an About-to-history
  Maestro flow, current-state Architecture Book and roadmap updates, an ADR for the
  versioning/gating contract, and a non-blocking human device-pass inbox note.

## Capabilities

### New Capabilities

- `mobile-changelog`: Bundled localized release entries, history and modal surfaces,
  once-per-version persistence/gating, tabs-root presentation, and migration/OTA hooks.

### Modified Capabilities

- `mobile-about-screen`: Add a working native grouped-row destination from About to the
  full Changelog history route and extend its automated/device proof obligations.

## Impact

- Mobile feature/navigation/storage: `mobile/src/features/changelog/`, thin history and
  sheet routes under `mobile/src/app/`, the root and tabs layouts, the About row model,
  typed EN/FR catalogs, tests, and `mobile/.maestro/about.yaml` (or a dedicated history
  flow if clearer).
- Persistence: one new MMKV number key through `@/storage`; no SQLite or server schema
  migration. Phase 09 documentation gains the exported setter/import contract only.
- Documentation: `features.md`, `navigation.md`, `storage.md`, the ADR index and new ADR,
  `CHANGELOG.md`, Phase 07/09 roadmap pages, and a migration inbox device checklist.
- Sensitive surfaces: the binding Architecture Book and its load-bearing ADR are changed.
  Legacy `app/` is read-only parity input and must remain untouched. No
  `openapi/openapi.json`, generated API client, server migration, native/store/EAS config,
  Firebase config, infrastructure, workflow, credential, or dependency change is expected;
  any such expansion must be flagged before implementation continues.
