# Tasks

Conventions:
- Flutter SDK is not on `PATH`: `export PATH="/home/dev/flutter/bin:$PATH"`,
  run Flutter commands from `app/`.
- Widget tests follow `app/test/README.md` and the existing exemplars
  (`test/modules/onboarding/screens/onboarding_screen_test.dart`).

## 1. App — graceful school-logo error handling

- [ ] 1.1 In `app/lib/modules/school/screens/school_selection/school_item.dart`
  give the `FadeInImage` an `imageErrorBuilder` that renders the
  `assets/images/school.png` placeholder. Share the placeholder asset between
  `placeholder:` and `imageErrorBuilder:` so it is declared once.
- [ ] 1.2 Run `flutter analyze` on the file — no new issues.

## 2. E2E determinism — remove the external image host

- [ ] 2.1 In `server/src/config/environments/test.ts` change
  `S3_PUBLIC_BUCKET_CLIENT_URL` from `https://timecalendar-test.example.com` to
  a loopback URL (no DNS lookup), with a comment explaining why.

## 3. Widget-test coverage for the error path

- [ ] 3.1 In `app/test/support/fixtures.dart` add an overridable `imageUrl`
  parameter to `buildSchoolForList`.
- [ ] 3.2 Add
  `app/test/modules/school/screens/school_selection/school_item_test.dart`
  (widget test via `pumpApp` + `ChangeNotifierProvider<SettingsProvider>`):
  it renders the school name, and the `FadeInImage`'s `imageErrorBuilder` is
  non-null and returns a placeholder `Image` when invoked.

## 4. Verification

- [ ] 4.1 Run `flutter test test/modules/school/` from `app/` — green.
- [ ] 4.2 Run `flutter analyze` from `app/` — no new issues from the change.
- [ ] 4.3 Run `app/integration_test/run_e2e.sh` and confirm the onboarding flow
  passes deterministically (independent of emulator DNS).
