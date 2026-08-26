## 1. Capture and normalize the pinned eoas contract

- [x] 1.1 From `mobile/`, record `npx eoas@3.1.2 --version`, snapshot the clean config diff, then
      run `npx eoas@3.1.2 init` using only app UUID
      `e89170b9-5b32-44f0-8f78-33eadb60ec28`, server base URL
      `https://ota.timecalendar.app`, and public certificate path
      `./codesigning/certs/certificate.pem`; retain the generated diff as run-owned evidence and verify
      no login, token, password, or private-key input/output was used
- [x] 1.2 Normalize the initializer output in `mobile/app.config.ts`: keep the locked manifest URL,
      exact xprem headers, `main` / `rsa-v1_5-sha256` certificate metadata and `enabled` intent, but
      preserve the typed dynamic-config structure, existing app/Firebase/network/runtime behavior, and
      TimeCalendar naming; remove the generator's `RELEASE_CHANNEL` and `DISABLE_CODE_SIGNING` shapes
- [x] 1.3 Add a validated `OTA_CHANNEL` build-time contract: `APP_VARIANT=development` disables
      Expo Updates and stamps no release channel, while production identity requires exactly `preview`
      or `production` and fails config resolution for missing/unknown values; verify no implicit
      production fallback remains

## 2. Make request headers the one channel authority

- [x] 2.1 Configure release `updates.requestHeaders` with `expo-channel-name` from the validated
      `OTA_CHANNEL`, `expo-app-id: e89170b9-5b32-44f0-8f78-33eadb60ec28`, and empty
      `xprem-branch`; preserve `fallbackToCacheTimeout: 0`, `runtimeVersion.policy: fingerprint`, and
      `https://ota.timecalendar.app/manifest`
- [x] 2.2 Set `OTA_CHANNEL=preview` and `OTA_CHANNEL=production` in the matching
      `mobile/eas.json` build-profile environments and remove every recursive `channel` property;
      verify development remains internal simulator/APK, both release profiles remain store/iOS-store-
      archive/Android-app-bundle with auto-increment, and identity/submit fields are unchanged
- [x] 2.3 Preserve `extra.eas.projectId` as `EAS_PROJECT_ID` with committed fallback
      `3b427ef6-1aae-4175-8217-ea447ee6df6b`, and prove overriding it changes EAS linkage without
      changing the xprem manifest URL or headers

## 3. Embed and protect the signing trust root

- [x] 3.1 Configure release `updates.codeSigningCertificate` as
      `./codesigning/certs/certificate.pem` and `updates.codeSigningMetadata` as
      `{ keyid: "main", alg: "rsa-v1_5-sha256" }`; verify both release configs expose the private
      config fields while Expo's public-config render filters them as expected
- [x] 3.2 Validate the committed PEM with `openssl x509` and confirm SHA-256 fingerprint
      `D9:24:B6:3E:67:2D:0F:D3:3D:28:F9:C9:24:C5:33:89:62:8E:83:3B:92:94:08:50:01:66:1B:E8:6F:4D:64:4A`,
      `CN=TimeCalendar`, and code-signing usage; do not generate, locate, or read any private key
- [x] 3.3 Harden `mobile/.gitignore` for private-key directories and common private
      key/container extensions while retaining only the explicit
      `codesigning/certs/certificate.pem` public exception; scan tracked files and the final diff to
      confirm no private key, API token, admin password, publish credential, or second trust root exists

## 4. Encode the config matrix as a CI proof

- [x] 4.1 Add a focused CI-discovered config test that resolves isolated development, preview, and
      production environments and proves identity/Firebase/network behavior, development OTA
      disablement, release endpoint/headers/certificate metadata, retained EAS id, and rejection of
      missing/unknown release channels
- [x] 4.2 Extend the focused proof to recursively reject every `channel` key in `mobile/eas.json`
      and assert the existing development/preview/production distribution, artifact, auto-increment,
      identity, environment, and submit guarantees
- [x] 4.3 Run the focused test directly, then run production/preview/development
      `npx expo config --json` and `--type public` matrix commands; retain machine-readable summaries
      without dumping certificate contents or environment credentials

## 5. Measure fingerprint behavior without weakening compatibility

- [x] 5.1 Using the SDK-56 project-local command
      `node ./node_modules/expo-updates/bin/cli.js runtimeversion:resolve`, resolve managed-workflow
      runtime versions with debug sources for iOS and Android under `OTA_CHANNEL=preview` and
      `OTA_CHANNEL=production`; record exact commands, hashes, equality/difference, and responsible
      sources in the issue and Architecture Book
- [x] 5.2 In a `PAPERCLIP_RUN_SCRATCH_DIR` copy, add one harmless, documented native-config probe,
      rerun the same platform fingerprint command, and prove the hash changes; discard only the exact
      run-owned scratch copy and confirm the working tree never contains the probe
- [x] 5.3 If and only if preview/production differ for a safely isolatable channel-only file,
      evaluate the narrowest `.fingerprintignore`; never ignore `app.config.ts`, `eas.json`, package
      manifests/locks, plugins, native trees, or the certificate, and retain the correction only when
      the native probe still changes the hash. Otherwise add no ignore and document the SDK's result

## 6. Render clean native configuration

- [x] 6.1 Create separate run-owned scratch copies for preview and production, reuse the installed
      dependencies without copying credentials, and run clean Expo SDK-56 config/prebuild renders for
      both platforms; inspect generated iOS/Android update metadata for the matching channel, manifest
      URL, app id, empty branch override, certificate, and signing metadata
- [x] 6.2 Attempt the smallest EAS profile validation for preview and production without exposing
      credentials; if the CLI requires login, record the exact login-gated command in a tagged
      `docs/react-native-migration/inbox/` human note and the issue rather than weakening automated
      config/prebuild proof

## 7. Update binding and operator documentation

- [x] 7.1 Update `docs/mobile/architecture-book/eas.md` from deferred to implemented: document the
      release matrix, `OTA_CHANNEL` local/EAS source, no `eas.json` channels, exact endpoint/headers,
      development disablement, signing certificate/metadata/custody, retained EAS id, and the measured
      iOS/Android fingerprint commands/results
- [x] 7.2 Extend ADR 037 (not onboarding ADR 036) with Decision sections for the concrete client
      endpoint/header/channel/signing contract and fingerprint result, while preserving the exact
      imperative channel/rollout rule and keeping publish/rollback/channel administration out of Git
- [x] 7.3 Update `mobile/EAS.md`, the Architecture Book `CHANGELOG.md`, and Phase 10 roadmap step 5
      with current build commands (`OTA_CHANNEL` explicit for local release builds), implemented trust
      state, evidence, and remaining human device proof; do not duplicate the Architecture Book or
      create publish automation

## 8. Local green, sensitive-surface audit, and CI proof

- [x] 8.1 Run `npx tsc --noEmit`, `npm run lint`, and Prettier check/format for every touched
      mobile/config/Markdown file; run `git diff --check`
- [x] 8.2 Run `npm test -- --coverage` so the focused config proof executes in the same CI posture
      and existing 90% logic/70% global thresholds remain green; Maestro is N/A because this is
      build/runtime configuration and real signed-channel behavior belongs to the final human device
      ticket
- [x] 8.3 Run `openspec validate wire-mobile-xprem-signed-channels --strict` and
      `openspec validate --all --strict`; review the final diff against scope and explicitly confirm no
      OpenAPI/generated client, migration, Firebase file, server, Terraform/Kubernetes, EAS/GitHub
      build or publish workflow, credential, publish/channel/rollback automation, or Flutter legacy
      change; permit only the existing generic Expo type-generation CI step to declare
      `APP_VARIANT=development` without `OTA_CHANNEL`
- [ ] 8.4 Push the implementation on the existing issue branch/PR and use exact-head GitHub CI as
      the proof test; first prove `APP_VARIANT=development npx expo customize tsconfig.json` locally
      and verify the workflow declaration is step-local with no `OTA_CHANNEL`; do not mark apply
      complete until required mobile checks are green or a concrete pipeline blocker is escalated
