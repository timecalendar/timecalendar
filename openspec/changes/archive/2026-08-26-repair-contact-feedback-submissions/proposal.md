## Why

Production retained 12 failed `POST /contact` traces out of 19 requests in 24 hours. Each sampled failure created a Crisp conversation successfully, then Crisp rejected the metadata update with `400 invalid_data`; the server surfaced that downstream failure as an opaque `500`, never sent the user's message, and emitted no bounded contact-delivery metric.

## What Changes

- Normalize Crisp conversation metadata and omit empty derived values so valid feedback is not rejected by optional enrichment such as an empty nickname or empty calendar-ID list.
- Classify the three Crisp delivery stages (conversation creation, metadata update, message send), count success/failure with bounded labels, and translate remaining downstream failures to a static retryable `503` response without logging submitted content or user identity.
- Document the retryable response in the committed OpenAPI contract and regenerate the React Native client when the generated output changes; never hand-edit either artifact.
- Keep the existing React Native Suggestions form values in place after a `503`, show useful accessible retry copy in both French and English, and prove that client telemetry and development request logging do not expose the e-mail or message.
- Add focused server, contract, and mobile regression coverage plus the required Architecture Book/current-state documentation and CI proof.
- Do not redesign Suggestions, modify the request DTO, persist submissions, change the database schema, touch native/store/EAS or deployment configuration, or modify legacy Flutter.

## Capabilities

### New Capabilities

- `server-contact-submission`: privacy-bounded Crisp delivery, downstream error semantics, bounded metrics, and regression coverage for `POST /contact`.

### Modified Capabilities

- `mobile-feedback`: explicitly handles the retryable server-unavailable response in FR/EN while retaining form contents and suppressing contact payloads from telemetry and development logs.

## Impact

- Server contact module: `server/src/modules/contact/` gains metadata normalization, stage-aware downstream handling, a contact metric, and focused controller/service/client tests.
- Mobile feedback and API seam: `mobile/src/features/feedback/`, localized EN/FR catalogs, and `mobile/src/api/mutator.ts` tests cover the recoverable response and payload redaction without changing the screen layout.
- Sensitive contract surfaces: response semantics change from an accidental `500` to a documented `503`, so `openapi/openapi.json` and, only if regeneration produces a diff, `mobile/src/api/generated/` are updated together and checked for drift.
- Documentation: update the mobile Architecture Book only for the reusable current privacy/error contract; no ADR is warranted because this is a leaf reliability repair.
- No server migration, native/store/EAS configuration, infrastructure, CI workflow, deployment, secret/certificate, or `app/` legacy Flutter changes.
