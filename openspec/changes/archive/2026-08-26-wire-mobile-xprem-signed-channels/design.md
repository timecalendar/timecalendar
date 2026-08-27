## Context

`mobile/app.config.ts` currently derives Expo's hosted update URL from the public EAS project id,
and `mobile/eas.json` owns `preview`/`production` through `channel` fields. That shape does not work
for `eas build --local`, because a local binary does not consume `eas.json` channel metadata. It also
leaves the live xprem endpoint, app identity, and public certificate unused.

The deployed contract is fixed: xprem v3.1.2, manifest URL
`https://ota.timecalendar.app/manifest`, app UUID
`e89170b9-5b32-44f0-8f78-33eadb60ec28`, and the committed public certificate at
`mobile/codesigning/certs/certificate.pem`. xprem owns the corresponding private key in its
encrypted database-key store. Expo SDK 56 accepts `updates.requestHeaders`,
`updates.codeSigningCertificate`, and code-signing metadata in app config; the pinned eoas CLI emits
the header names `expo-channel-name`, `expo-app-id`, and `xprem-branch`, plus key id `main` and
algorithm `rsa-v1_5-sha256`.

This change touches native/store configuration and a signing trust boundary. It must preserve the
production identity, Firebase selection, store artifacts, EAS credential linkage, fingerprint
safety, and the runtime behavior delivered by ADR 037. The brief's reference to ADR 036 is a
numbering error: ADR 036 owns the onboarding pager; ADR 037 is the OTA decision this change extends.

## Goals / Non-Goals

**Goals:**

- Give EAS and local builds one build-time source for release channel selection.
- Make preview and production poll xprem with the exact app/channel/branch headers it expects.
- Disable automatic OTA for the development identity and retain its Metro/dev-client loop.
- Reject unsigned or incorrectly signed downloaded updates using the committed public certificate.
- Preserve `extra.eas.projectId` for EAS Build/Submit while decoupling it from update delivery.
- Measure the preview/production fingerprint result on both platforms and preserve native-change
  protection.
- Encode the config matrix in a CI-discovered focused test and record reusable evidence in the
  Architecture Book.

**Non-Goals:**

- Publishing, republishing, rollback, channel/branch creation or mapping, progressive rollout,
  source-map upload, or release automation.
- Store builds/submission, credentials, device installation, or real-device OTA proof.
- xprem, R2, Postgres, Terraform, Kubernetes, Cloudflare, server, OpenAPI, Firebase file,
  EAS/GitHub build or publish workflow, or Flutter legacy changes. The existing generic mobile CI
  config render may declare development identity; it must not declare a release channel.
- A `beta` channel, runtime channel picker, environment switcher, or weakening Expo anti-bricking
  measures.

## Decisions

## Decision 1 — Run the pinned initializer as evidence, then normalize its diff

From `mobile/`, run `npx eoas@3.1.2 init` with the public app UUID, server base URL
`https://ota.timecalendar.app`, and certificate path `./codesigning/certs/certificate.pem`. Capture
the before/after diff and CLI version without logging any credential. Treat the generated output as
upstream contract evidence, not the final repository shape: retain the exact endpoint, headers,
certificate metadata, and private-key ignore intent, then rewrite the result into the existing typed
dynamic config and TimeCalendar naming.

The CLI currently suggests `RELEASE_CHANNEL` and a `DISABLE_CODE_SIGNING` guard. TimeCalendar uses
`OTA_CHANNEL` to avoid conflating OTA routing with app identity, and disables updates for the dev
identity instead of conditionally weakening signature verification in a release binary.

Alternatives considered: hand-writing config without running the requested initializer would miss
generator drift; accepting the generated AST diff blindly would replace established comments and
environment contracts; using unpinned `npx eoas` would make the result irreproducible.

## Decision 2 — `OTA_CHANNEL` is required for release config and ignored for development

`APP_VARIANT=development` remains the identity boundary. It resolves the `.dev` app, dev Firebase
files and network exceptions, with Expo Updates disabled so development remains Metro/dev-client
only and no channel is stamped.

For the production identity, app config accepts exactly `OTA_CHANNEL=preview` or
`OTA_CHANNEL=production` and fails closed for missing or unknown values. `mobile/eas.json` supplies
those values in the matching profile's `env` object and contains no `channel` key anywhere. Local
release builds use the same explicit environment input, so they cannot silently become production
or lose channel membership.

The existing profile distribution, artifacts, `autoIncrement`, identity selection, submit
skeleton, and `APP_VARIANT` rules remain unchanged. A default of `production` was rejected because
it recreates the silent preview-to-production failure this change exists to remove. Keeping EAS
`channel` beside request headers was rejected because it creates two authorities.

## Decision 3 — Release request headers encode channel routing, app identity, and no override

Release configs set:

- `expo-channel-name` to the validated `OTA_CHANNEL` value;
- `expo-app-id` to `e89170b9-5b32-44f0-8f78-33eadb60ec28`;
- `xprem-branch` to the empty string, meaning the server's channel mapping decides the branch.

The update URL is the locked manifest endpoint. `xprem-branch` remains present because Expo's
runtime header override can only override keys embedded at build time, but TimeCalendar does not add
branch-surfing UI or runtime overrides here. Hard-coding preview or production in app config was
rejected because local and EAS builds must share one source. Omitting `xprem-branch` was rejected
because it would remove the pinned v3 contract and close the future override seam.

## Decision 4 — Release binaries always verify xprem's one public trust root

Release config sets `updates.codeSigningCertificate` to
`./codesigning/certs/certificate.pem` and `updates.codeSigningMetadata` to
`{ keyid: "main", alg: "rsa-v1_5-sha256" }`. Those values match eoas v3.1.2 and Expo SDK 56.
Downloaded unsigned bundles or signatures that do not verify against the embedded certificate are
rejected by `expo-updates` before application.

The implementation verifies the certificate's recorded SHA-256 fingerprint and public X.509
shape without reading or generating a private key. Ignore rules cover private-key directories and
common key/container extensions while retaining the one explicit public-certificate exception.
`DISABLE_CODE_SIGNING` in release config and a second Expo-generated key pair are both prohibited:
either would weaken or fork the deployed trust root.

## Decision 5 — Preserve EAS linkage but remove it from delivery routing

`extra.eas.projectId` continues to resolve from `EAS_PROJECT_ID` with the committed EAS project id
fallback `3b427ef6-1aae-4175-8217-ea447ee6df6b`. It remains public metadata needed by EAS
Build/Submit. `updates.url` no longer derives from it; xprem delivery and EAS project linkage are
separate responsibilities.

Removing the EAS id was rejected because no evidence shows EAS Build/Submit no longer requires the
link. Allowing `EAS_PROJECT_ID` to change the xprem endpoint was rejected because an EAS account
selection must not redirect production update traffic.

## Decision 6 — Fingerprint evidence is two-platform, source-inspected, and controlled

Use the SDK-56 project-local `expo-updates` CLI to resolve managed-workflow runtime versions for iOS
and Android under `OTA_CHANNEL=preview` and `OTA_CHANNEL=production`; capture hashes, commands, and
debug fingerprint sources. Repeat one case after a harmless native-affecting fixture change in a
run-owned scratch copy, then prove the fingerprint changes and discard the scratch tree.

The semantic target is that fingerprints continue to protect every native dependency and config
input. If the two channels match, record that routing headers do not split compatibility. If they
differ, inspect the reported sources before deciding: retain and document conservative lane-specific
runtime versions when the resolved native header config is the cause. Add `.fingerprintignore` only
if the differing input is a dedicated channel-only file that can be excluded without ignoring
`app.config.ts`, `eas.json`, package manifests/locks, config plugins, native trees, or the signing
certificate, and only if the native-change control still moves the hash. Never add a broad ignore to
force equality.

Alternatives considered: assuming the result from documentation would not satisfy the empirical
acceptance criterion; ignoring all app config would defeat the fingerprint policy; comparing only
one platform could miss platform-specific native evaluation.

## Decision 7 — A focused config proof owns the build matrix

Add a CI-discovered test that resolves the dynamic config for development, preview, and production
with isolated environment state, and parses `eas.json`. It proves: dev identity and automatic OTA
disablement; release endpoint, exact headers, certificate and metadata; preview/production channel
selection; retained EAS id; absence of all `channel` keys; and unchanged distribution/artifact/
identity guarantees. Keep native embedding proof separate via clean Expo prebuild/config renders in
a run-owned scratch copy for both release lanes.

This test proves deterministic JavaScript/config behavior, not device transport or cryptography.
Real signature rejection and channel delivery remain part of the downstream human device ticket.

## Decision 8 — Generic CI config rendering declares development identity explicitly

The existing `Generate Expo type declarations` step in `.github/workflows/ci-mobile.yml` sets only
`APP_VARIANT=development`. `npx expo customize tsconfig.json` resolves dynamic Expo config while
generating gitignored development type declarations, so the caller must explicitly select the
Metro/development identity instead of falling into the release identity that requires an
`OTA_CHANNEL`.

This is a caller declaration, not a fallback in `mobile/app.config.ts`: release configuration keeps
failing closed when its channel is missing or invalid. The step does not set `OTA_CHANNEL`, and the
workflow does not gain a job-wide/default channel, EAS/native build, publish, channel mutation,
rollout, rollback, or credential. Special-casing `CI` or this command inside app config was rejected
because it would make release identity depend on caller detection rather than explicit inputs.

## Risks / Trade-offs

- **[A release command omits or misspells `OTA_CHANNEL`]** → fail config resolution before a binary
  or update is produced; document exact commands for each lane.
- **[eoas rewrites established dynamic config incorrectly]** → capture and review its diff, then
  normalize only contract fields into the existing file.
- **[Development accidentally polls production xprem]** → disable Expo Updates for the development
  identity and prove it in the focused config matrix.
- **[A forged or unsigned update is accepted]** → embed the exact public certificate and metadata,
  verify its fingerprint, and prohibit release-time signature disablement.
- **[Channel headers unexpectedly split runtime versions]** → inspect SDK-56 fingerprint sources;
  document conservative separation unless a narrow, proven exclusion exists.
- **[A fingerprint correction weakens native safety]** → prohibit broad ignores and require a
  native-affecting control change to move the hash after any correction.
- **[Secrets appear while inspecting CLI output]** → use only public inputs, never fetch/read a
  private key, scan the diff and logs, and keep credential-bearing build/publish work out of scope.
- **[Generic CI config rendering is mistaken for a release build]** → declare
  `APP_VARIANT=development` only on the Expo type-generation step; never supply `OTA_CHANNEL` or
  weaken the release config's fail-closed contract.

## Migration Plan

1. Run and capture the pinned eoas initializer diff using only public inputs.
2. Normalize app config, EAS profile environments, validation, and ignore rules; preserve all
   unrelated identity/artifact/linkage fields.
3. Run the config matrix, clean prebuild renders, certificate checks, and two-platform fingerprint
   experiment with native-change control.
4. Update operator/current-state docs, ADR 037, Architecture Book changelog, and Phase 10 roadmap;
   record exact commands/results on the issue.
5. Run local green and CI-equivalent validation, then hand the unchanged issue/branch/PR through the
   remaining pipeline stages.

Rollback is a normal code revert followed by fresh native builds. Already shipped binaries retain
their embedded xprem endpoint, channel, and trust root, so reverting source alone does not retarget
installed clients. No publish, rollout, data migration, or deploy act occurs in this change.

## Open Questions

The preview/production fingerprint equality is intentionally resolved by the implementation
experiment rather than guessed here. Its result and any narrowly justified correction become part
of ADR 037 and `eas.md` before application is complete.
