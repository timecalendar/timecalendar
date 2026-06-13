# Firebase config files (committed, required for native builds)

`app.config.ts` points `googleServicesFile` here, switched by `APP_VARIANT`. The
four files below are **not generated** — drop them in from the Firebase console /
the Flutter app and commit them. They carry only client API keys, which are not
secret (they ship inside the app binary), so committing them is fine and matches
the Flutter app (`app/android/app/google-services.json`,
`app/ios/Runner/GoogleService-Info.plist` are committed too).

One Firebase **project per environment** (Google best practice — Analytics,
Crashlytics, quotas and billing are project-scoped):

| Variant (`APP_VARIANT`)        | appId                            | Firebase project          | Files here |
| ------------------------------ | -------------------------------- | ------------------------- | ---------- |
| `development` (`npm run ios/android`, e2e) | `fr.samuelprak.timecalendar.dev` | `timecalendar-dev`        | `google-services.dev.json`, `GoogleService-Info.dev.plist` |
| production (EAS, store)         | `fr.samuelprak.timecalendar`     | `timecalendar-samuelprak` | `google-services.json`, `GoogleService-Info.plist` |

## How to produce them

**Dev (`timecalendar-dev` project):** in the Firebase console add an **Android**
app with package `fr.samuelprak.timecalendar.dev` and an **iOS** app with bundle
id `fr.samuelprak.timecalendar.dev`, then download:

- `google-services.json`  → save as `firebase/google-services.dev.json`
- `GoogleService-Info.plist` → save as `firebase/GoogleService-Info.dev.plist`

**Production (`timecalendar-samuelprak` project):** copy the Flutter app's
already-registered files (same bundle id `fr.samuelprak.timecalendar`):

- `app/android/app/google-services.json` → `firebase/google-services.json`
- `app/ios/Runner/GoogleService-Info.plist` → `firebase/GoogleService-Info.plist`

Until the active variant's pair exists here, `npx expo prebuild` / a native build
will fail (type-check, lint and Jest don't read these files, so CI `test-mobile`
is unaffected — only native builds and the on-demand e2e jobs need them).
