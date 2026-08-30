## Why

A calendar token that begins or ends with `-` is exported **verbatim** over OTLP on every
`EntityNotFoundError` path. Roughly **3.1%** of tokens are affected. This is pre-existing on
`main` and reachable today through `GET /calendars/by-token/:token`.

The chain, each link verified against the real code in this repo:

1. `TypeOrmExceptionFilter` (`@lyrolab/nest-shared/database`, wired at
   `server/src/config/configure-main-app.ts:28`) runs
   ``this.logger.debug(`Original TypeORM error: ${exception.message}`)``.
2. TypeORM builds that message with `JSON.stringify(criteria, null, 4)`, so it contains
   `"token": "<value>"`.
3. `TelemetryLogger.debug()` (`server/src/config/observability/telemetry-logger.ts:54`) calls
   `this.otelLogger.emit(...)` **unconditionally — there is no log-level gate on the OTel
   path**, so a console-level filter does not stop the export.
4. `sanitizeText` (`server/src/config/observability/sanitize-log.ts:24`) is the only thing
   between the token and the backend, and it misses.

Two independent gaps, both reproduced against the real module:

- **A — the id rule's `\b` anchors fail on a leading/trailing `-`.** Tokens are `nanoid()`:
  21 chars over an alphabet whose only non-word character is `-`. With a leading `-` there is
  no `\b` at the first character and a match starting one char later is only 20 long, so
  `{21,}` fails; with a trailing `-` the closing `\b` fails and `{21,}` cannot backtrack below
  21. Either way the whole rule no-ops.
- **B — the sensitive-key rule never matches JSON.** It requires `token` followed by optional
  whitespace then `:`. In JSON the key is quoted, so the closing `"` sits between `token` and
  `:`. This is general: **no JSON-serialized secret key is redacted by the key rule today**,
  for any of its listed keys.

Reproduced against the real `sanitizeLog` with the real `EntityNotFoundError` message shape:

```
ok     V1StGXR8Z5jdHi6BmyTaa   (plain)
LEAK   -1StGXR8Z5jdHi6BmyTaa   (leading -)
LEAK   V1StGXR8Z5jdHi6BmyTa-   (trailing -)
ok     V1StGX-8Z5jdHi6BmyTaa   (internal -)
ok     V1StGX_8Z5jdHi6BmyTaa   (underscore)
```

## What Changes

- Replace the id rule's word-boundary anchors with character-class lookarounds so the
  **delimiter**, not word-ness, bounds an opaque identifier — applied **per alternative**, so
  the opaque-token alternative treats `-` as part of the token while the long-digit
  alternative still accepts a `-` at its edges. (See `design.md` Decision 1: the single
  lookaround pair suggested in the ticket brief closes the token leak but silently *opens* a
  new one on hyphen-edged digit runs.)
- Allow an optional closing quote before the separator in the sensitive-key rule, and read the
  replacement callback's label from a capture group on the key alternation, so a JSON-quoted
  `"token"`/`"password"`/`"secret"` key is redacted and the emitted label stays clean.
- Add regression tests in both directions: every affected token shape is redacted, and the
  values that must survive today still survive unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-telemetry-integrity`: Strengthen sanitized OTLP application logging so opaque-token
  redaction is delimiter-independent and JSON-serialized sensitive keys are redacted, while
  the existing bounded-attribute and survival behavior is unchanged.

## Impact

- Affected repository areas: `server/src/config/observability/sanitize-log.ts` and its test
  suite. No other module changes.
- **Sensitive surface**: `server/src/config/observability/` is the redaction seam for every
  exported log line. Over-redaction here silently destroys debuggability; under-redaction
  leaks. Both directions are tested, and the change is verified not to redact **less** than
  today on any input.
- No API behavior, OpenAPI contract, generated mobile client, dependency, database
  schema/migration, native/store config, deployment infrastructure, or legacy Flutter change.
- No Architecture Book update: that book governs `mobile/`, and this change is server-only.

## Out of scope

- **Adding a log-level gate to `TelemetryLogger`'s OTel path.** Arguably the more principled
  fix, but changing which severities reach the backend is an observability-policy change, not
  a redaction bug. Explicitly held out by the ticket; this proposal does not move it.
- Changing token transport (path vs body) on any endpoint — adjudicated on TIM-390.
- Any change to `@lyrolab/nest-shared`.
