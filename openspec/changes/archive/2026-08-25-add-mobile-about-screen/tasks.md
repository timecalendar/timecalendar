## 1. Native dependency and app identity

- [x] 1.1 From `mobile/`, run `npx expo install expo-application` so
      `package.json` and `package-lock.json` receive the Expo SDK 56-compatible native
      module; verify `npx expo install --check` reports no dependency mismatch.
- [x] 1.2 Set `mobile/app.config.ts` version to `4.0.0`; verify development and
      production `npx expo config --type public --json` outputs both report `4.0.0`, and
      retain the fingerprint runtime policy so the native change requires a new build.

## 2. About feature data model

- [x] 2.1 Create `mobile/src/features/about/{data,ui}/` with sublayer barrels and a
      minimal feature public barrel; verify the module follows the existing feature boundary
      and import-order lint rules.
- [x] 2.2 Add the narrow `expo-application` metadata reader and a pure total derivation
      that normalizes null/empty/whitespace native version and build values into version +
      build, version-only, build-only, or unavailable cases; add colocated tests for every
      branch and verify the About data files clear the 90% lines/branches gate.

## 3. Native grouped About UI

- [x] 3.1 Export `SettingsSection`/`SettingsRow` through the Settings UI barrel and
      generalize `SettingsRow` into typed router, action-link, and non-interactive value
      variants while preserving existing pressed feedback, touch targets, wrapping, and
      decorative-element hiding; add regression tests proving navigation rows remain links
      and value rows expose no action role, hint, press handler, or disclosure.
- [x] 3.2 Implement `AboutScreen` with a safe-area-aware themed scroll surface, two short
      paragraphs, and data-driven Privacy, Contact, App, and Developers groups. Wire privacy
      plus Samuel Prak/Eddy Monnot to their exact URLs through
      `WebBrowser.openBrowserAsync`, email to `Linking.openURL` with
      `mailto:hello@timecalendar.app`, and the version row to the total metadata model; keep
      Suggestions, Debug, OTA identifiers, and Changelog absent.
- [x] 3.3 Add typed EN/FR catalog keys for the screen title, natural two-paragraph copy,
      section/row labels, link hints, all four version/build presentation cases, and
      accessibility values; verify `npx tsc --noEmit` catches any parity or key error.
- [x] 3.4 Add `about-screen.test.tsx` with mocked native seams and explicit EN/FR cases;
      verify grouped order, omitted content, exact web/email dispatch, every metadata
      fallback, one full-width accessible link per outbound row, and truthful
      non-interactive version semantics.

## 4. Settings and route integration

- [x] 4.1 Add the one-line `mobile/src/app/about.tsx` UI-barrel export, register About as
      a root Stack sibling with `headerShown: true`, and set the localized native header
      title from the feature screen; verify a cold `/about` route has the `(tabs)` back-stack
      anchor.
- [x] 4.2 Add an explicit third `app` section after Events and Preferences in the
      Settings destination model, containing one localized About row to `/about`; update the
      existing hub test that asserts About is absent and include every live destination
      (including Time zone) in the route/a11y matrix.
- [x] 4.3 Extend `mobile/src/components/settings-route-structure.test.ts` as the CI proof
      for the thin About route and root Stack registration, then run that Jest file directly
      to prove the route shape before the full suite.

## 5. End-to-end and documentation

- [x] 5.1 Add `mobile/.maestro/about.yaml`: clear state, cold-open
      `timecalendar-dev://about`, handle the optional iOS “Open” confirmation, assert stable
      localized About content, then cold-launch the tabs and reach the same screen from the
      Settings About row. Do not add the `run-e2e` label; verify the YAML follows existing
      cross-platform selector and timeout conventions.
- [x] 5.2 Update `docs/mobile/architecture-book/features.md` with standalone About
      ownership/dependencies and `navigation.md` with `/about` and its Settings entry. Record
      that no ADR is added for this reversible local choice and do not recreate the retired
      `architecture-changelog.md`; current `architecture.md` makes Git history authoritative.
- [x] 5.3 Mark Phase 07 About ✅ in
      `docs/react-native-migration/01-roadmap/07-auxiliary-features.md` using this draft PR's
      number in the existing shipped-item style, without marking Profile or Changelog shipped.
- [x] 5.4 Add a dated `docs/react-native-migration/inbox/` note tagged for a human pass
      covering light/dark, VoiceOver/TalkBack traversal and link announcements, large text,
      exact browser/mail dispatch, version/build display, native back behavior, and both iOS
      and Android; state that the device-only evidence is non-blocking on this no-KVM host.

## 6. Local green and handoff evidence

- [x] 6.1 From `mobile/`, run `npx tsc --noEmit`, `npm run lint`, Prettier checks on all
      changed supported files, and `npm test -- --coverage`; verify the 90% per-file logic
      branch gate and 70% global floor remain green and record any DoD item that is N/A.
- [x] 6.2 Run `openspec validate add-mobile-about-screen`, inspect the final diff for
      accidental OpenAPI/generated client, server migration, Firebase, infrastructure,
      workflow, or legacy Flutter edits, and record the required fresh-native-build and
      human-merge gates in the PR/handoff.
