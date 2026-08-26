## 1. Feature model and MMKV contract

- [ ] 1.1 Create `mobile/src/features/changelog/{data,store,ui}/` with sublayer barrels
      and a minimal feature public barrel; verify sibling layers import sublayer barrels and
      routes/layouts use only the intended public surfaces.
- [ ] 1.2 Add the readonly typed catalog with `CHANGELOG_VERSION = 4`, one newest-first
      release labeled `4.0`, three platform symbol maps, and typed title/subtitle i18n keys;
      add pure helpers for all-release and newer-than selection.
- [ ] 1.3 Add catalog/selector tests for ordering, strict greater-than boundaries, empty
      selection, immutability, and current-version/catalog consistency; verify every new
      `data/` logic file clears 90% line and branch coverage.
- [ ] 1.4 Add the `changelogSeenVersion` store over `@/storage`, including total safe-integer
      reads and the exported `setChangelogSeenVersion` migration hook; do not import
      `react-native-mmkv` directly.
- [ ] 1.5 Add store tests for missing, valid, negative, fractional, non-finite/malformed,
      current, and future values plus the Phase 09 setter round trip; verify every new
      `store/` logic file clears 90% line and branch coverage.

## 2. Once-per-version eligibility gate

- [ ] 2.1 Implement the pure absent/older/current gate decision and unseen-release derivation:
      absent/malformed seeds 4 silently, older presents only greater releases, and
      current/future skips without lowering storage.
- [ ] 2.2 Implement a renderless `ChangelogGate` with a once-per-mount navigation guard and
      mount it only in `mobile/src/app/(tabs)/_layout.tsx`; keep it out of the root and
      onboarding layouts so cold onboarding routes cannot be covered.
- [ ] 2.3 Add focused gate tests proving absent seeding with no navigation, version 3 → one
      `/changelog-sheet` push, version 4/future → no push, corrupt → silent seed, rerender →
      no duplicate push, and eligibility only after tabs mount.

## 3. Shared native Changelog UI

- [ ] 3.1 Implement one themed, safe-area-aware, scrollable `ChangelogContent` component
      with semantic version headings, wrapping localized item title/subtitle copy, and
      decorative SF Symbols / Material Symbols hidden from assistive technology.
- [ ] 3.2 Implement the history wrapper to render all releases and set its localized native
      title, relying on regular Stack back navigation without writing seen state.
- [ ] 3.3 Implement the sheet wrapper to render only unseen releases, expose localized close
      and full-width Continue controls, write version 4 before both explicit dismissals, and
      idempotently write version 4 on unmount for native swipe/back/parent removal.
- [ ] 3.4 Add UI tests for EN/FR content, newest-first sections, shared history/sheet markup,
      heading/accessibility order, hidden symbols, wrapping/safe-area behavior, and empty
      unseen selection; prove close, Continue, and unmount cleanup all persist before/while
      dismissing and a later gate skips.

## 4. Root routes and platform presentation

- [ ] 4.1 Add one-line `mobile/src/app/changelog.tsx` and
      `mobile/src/app/changelog-sheet.tsx` exports through the Changelog UI barrel; register
      both as root Stack siblings of `(tabs)`.
- [ ] 4.2 Configure `/changelog` as a visible-header regular push and `/changelog-sheet` as
      a visible-header iOS `formSheet` with large detent/grabber and Android full-screen
      modal, using only Expo Router SDK 56-supported options.
- [ ] 4.3 Extend the route-structure test to prove both thin exports, root registrations and
      presentation strings/options, tabs-layout gate ownership, and absence of the gate from
      root/onboarding; run this focused Jest file as the CI proof test.

## 5. About integration and typed localization

- [ ] 5.1 Add a Changelog router row to About's App section beside installed-version data,
      using the existing `SettingsRow` variant, a native platform symbol map,
      `/changelog`, localized label/hint, and stable `about-changelog` test ID; do not add a
      duplicate Settings-hub row.
- [ ] 5.2 Add exact EN/FR parity for route titles, Version 4.0 heading, all three item titles
      and subtitles, About row/hint, close, Continue, and accessibility copy; use natural
      localized text and verify `tsc` rejects missing/extra keys.
- [ ] 5.3 Update About component tests from Changelog-absent to stable row/group order,
      full-width link semantics, exact `/changelog` dispatch, and complete English/French
      rendering while preserving every privacy/contact/version/developer regression proof.

## 6. Maestro and durable documentation

- [ ] 6.1 Extend `mobile/.maestro/about.yaml` to enter About from Settings, activate
      `about-changelog`, and assert stable English 4.0 history copy on the shared iOS/Android
      flow. Do not add `run-e2e`; record the seeded auto-sheet flow as N/A unless an existing
      supported cross-platform MMKV seeding seam is found, and do not add a new dev route.
- [ ] 6.2 Update Architecture Book `features.md` with Changelog ownership and the Phase 09
      setter/OTA contract, `navigation.md` with both routes and tabs-only trigger,
      `storage.md` with the key and total-read rules, and `CHANGELOG.md` with one current
      architecture-change line.
- [ ] 6.3 Add ADR 037 for integer versioning, absent-value suppression, tabs-root gating,
      JS-bundle OTA behavior, and the Phase 09 import ordering; add it to
      `decisions/README.md` and follow the accepted ADR template/revisit-condition policy.
- [ ] 6.4 Mark Phase 07 Changelog ✅ with this draft PR's number and add the Phase 09 step
      that validates `flutter.current_version` then calls `setChangelogSeenVersion` before
      tabs eligibility; state that migration implementation remains Phase 09 scope.
- [ ] 6.5 Add a dated `(HUMAN: …)` migration inbox note covering iOS form-sheet and Android
      modal presentation, light/dark, history/back, close/Continue/swipe/back persistence,
      fresh-install suppression, migrated 3 → once → 4 behavior, VoiceOver/TalkBack focus
      and announcements, large text, and platform touch targets; keep device-only evidence
      non-blocking on this no-simulator host.

## 7. Local green, scope audit, and handoff evidence

- [ ] 7.1 Run Prettier on all changed supported files, then from `mobile/` run
      `npx tsc --noEmit`, `npm run lint`, the focused Changelog/About/route suites, and
      `npm test -- --coverage`; verify 90% per-file logic branch/line gates and the 70%
      global floor remain green.
- [ ] 7.2 Run `openspec validate add-mobile-changelog --strict` (or the repository CLI's
      strict equivalent), inspect the final diff, and confirm there are no accidental
      OpenAPI/generated-client, server migration, Flutter, dependency, native/store/EAS,
      Firebase, infrastructure, workflow, credential, or secret changes.
- [ ] 7.3 Record DoD evidence in the PR/handoff: machine checks, Maestro committed but not
      runnable on the no-KVM host, automatic-sheet Maestro N/A rationale if applicable,
      human inbox checklist, no analytics/observability event needed for bundled static
      content, Architecture Book/ADR updates, and no `run-e2e` label.
