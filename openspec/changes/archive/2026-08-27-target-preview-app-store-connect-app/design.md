## Context

`mobile/eas.json` currently gives both iOS submit profiles the literal value
`"$EXPO_ASC_APP_ID"`. EAS Submit does not interpolate that field as repository intent expects, so
the `preview` profile can reach the release operation without a deterministic App Store Connect
destination. TimeCalendar's existing App Store record is publicly identified by `1479613630`; this
is routing metadata, not a credential. Apple authentication, account identity, team identity, and
signing material remain separately protected inputs.

The affected Jest test currently parameterizes preview and production as identical submit objects.
The documentation repeats that all three iOS values are environment references and therefore must
be corrected alongside the executable config. This is a sensitive Tier-H store-targeting change,
but the ticket authorizes no deploy act: the Applier must not build, sign, upload, or submit an IPA.

## Goals / Non-Goals

**Goals:**

- Make the committed preview submit destination exact and reviewable.
- Encode a focused regression proof that distinguishes preview from production and rejects the old
  unresolved placeholder.
- Preserve every credential boundary and all unrelated build/submit behavior.
- Keep current-state, operator, readiness, and Architecture Book guidance truthful.
- Provide local and exact-head CI evidence suitable for Tier-H human review.

**Non-Goals:**

- Changing `submit.production`, Android submission, build profiles, OTA lanes, app identity, or
  signing configuration.
- Adding or reading Apple credentials, keys, certificates, or generated native artifacts.
- Building, signing, uploading, submitting, promoting, assigning tester groups, or installing an
  artifact.
- Changing dependencies, APIs/generated clients, schemas/migrations, Firebase, infrastructure,
  workflows, or the legacy Flutter app.

## Decision 1 — Commit the public preview destination at the narrowest EAS field

Replace only `submit.preview.ios.ascAppId` with the JSON string `1479613630`. Retain
`submit.preview.ios.appleId` and `appleTeamId` as environment-backed inputs, and leave the entire
production submit profile untouched.

The App Store Connect numeric app identifier is public routing metadata already present in public
TimeCalendar artifacts and links; committing it removes ambiguity without disclosing authentication
material. Replacing all iOS placeholders was rejected because Apple account/team values participate
in authorization and remain operator-managed. Changing production was rejected because the defect
and acceptance criteria are preview-only.

## Decision 2 — Make the Jest proof lane-specific and pair it with a direct JSON assertion

Refactor the existing config-shape assertion only as far as necessary to give preview and
production separate expected submit objects. Require preview `ascAppId` to equal `1479613630` and
explicitly reject `$EXPO_ASC_APP_ID`; require its Apple account/team fields and Android object to
retain their current values. Preserve the existing production expectation verbatim so an accidental
production edit fails the same focused test.

Run the focused Jest file from `mobile/`, then independently run
`jq -e -r '.submit.preview.ios.ascAppId == "1479613630"' eas.json`. The two proofs cover different
failure modes: Jest guards the full surrounding shape and lane separation, while `jq` demonstrates
the exact committed acceptance value without application/runtime resolution. Adding a new test file
or invoking EAS Submit was rejected as unnecessary and, for submission, unauthorized.

## Decision 3 — Correct current guidance without broadening release scope

Update the EAS Architecture Book page and rule changelog, the mobile EAS operator guide, the first
preview procedure, and the release readiness audit wherever they describe preview as an unresolved
submit skeleton. State that `1479613630` is committed public destination metadata, while Apple
account/team authentication and other credential-bearing inputs remain outside git. Do not describe
the profile correction as a completed upload or as authorization to perform one.

No ADR is added: the durable store-distributed preview policy is already captured by ADR 040, and
this change corrects a leaf configuration defect within it rather than selecting a new costly-to-
reverse architecture.

## Risks / Trade-offs

- **[Wrong app receives a future upload]** → Bind the exact public identifier in source, assert it
  with both Jest and `jq`, flag `mobile/eas.json` as sensitive, and require Tier-H human review.
- **[A credential is mistaken for public metadata]** → Limit the committed value to `ascAppId` and
  verify Apple account/team values, keys, and certificates remain outside git.
- **[Production changes accidentally]** → Keep an exact production expectation in the focused test
  and audit the final diff for preview-only targeting.
- **[Docs imply a deploy act occurred]** → State explicitly that build/sign/upload/submit remains on
  the separately authorized release operation.
- **[Placeholder regression passes a loose assertion]** → Assert both exact equality and absence of
  the old literal placeholder in the preview object.

## Migration Plan

1. Change the single preview app-id field and split the focused submit-profile expectations.
2. Update the directly affected Architecture Book, operator, preview, and readiness prose plus the
   Architecture Book changelog.
3. Run the focused Jest test, direct `jq` assertion, formatting/diff checks, and strict OpenSpec
   validation; then run the repository-prescribed local mobile gate proportionate to the config
   change.
4. Push to the existing draft PR and require green CI at the exact reviewed head.
5. After Reviewer sign-off, wait for a human merge. The separate release operation may later select
   a reviewed green `main` SHA and submit its exact signed IPA.

Rollback is a normal source revert before any subsequent store action. Because this ticket performs
no deploy act, it creates no external state to unwind.

## Open Questions

None. The target app identifier, credential boundary, preview-only scope, and human merge gate are
explicit in the issue.
