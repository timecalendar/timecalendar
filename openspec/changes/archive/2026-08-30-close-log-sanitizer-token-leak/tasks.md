## 1. Close the two redaction gaps

- [x] 1.1 In `server/src/config/observability/sanitize-log.ts`, replace the id rule
  `/\b(?:[A-Za-z\d_-]{21,}|\d{10,})\b/g` with the per-alternative form from `design.md`
  Decision 1:
  `/(?<![A-Za-z\d_-])[A-Za-z\d_-]{21,}(?![A-Za-z\d_-])|(?<![A-Za-z\d_])\d{10,}(?![A-Za-z\d_])/g`.
  Keep the two alternatives' boundary classes **different** — the opaque-token alternative
  excludes `-`, the digit alternative does not. Do not collapse them into one shared
  lookaround pair; that form reopens the leak on hyphen-edged digit runs (Decision 1 table).
  - Verification: `cd server && npx jest src/config/observability/sanitize-log --maxWorkers=2`.
- [x] 1.2 In the same chain, add `["']?` before `\s*[:=]` in the sensitive-key rule **and**
  promote its key alternation from `(?:…)` to a capture group, so the replacement callback
  reads the matched key from its second argument — `(_match, key) => \`${key}=[redacted]\`` —
  and the emitted label is `token=[redacted]`, not `token"=[redacted]` (Decision 2). Both
  edits land together: widening the regex without the callback reintroduces the stray quote.
  - Verification: the JSON-key test from 2.3 passes and prints no stray quote.
- [x] 1.3 Leave rule order, `[^\r\n]*` greediness, `MAX_SCALAR_LENGTH`, `MAX_LOG_BODY_LENGTH`,
  `ALLOWED_STRUCTURED_KEYS`, and every other rule in the chain untouched. No log-level gate on
  `TelemetryLogger` — explicitly out of scope.

## 2. Regression tests — the under-redaction direction

- [x] 2.1 In `server/src/config/observability/sanitize-log.test.ts`, add a table-driven case
  over all five token shapes named in the ticket — plain, leading `-`, trailing `-`, internal
  `-`, underscore — plus the both-ends `-` shape. Each is a default-length (21-char) `nanoid`
  alphabet string embedded in the real `EntityNotFoundError` body shape
  (``Could not find any entity of type "Calendar" matching: {\n    "token": "<t>"\n}``).
  Assert the body contains `[id:redacted]` and does **not** contain the token.
- [x] 2.2 Assert the two shapes that leak on `main` today — leading `-` and trailing `-` —
  fail against the unpatched rule. Confirm this by reverting 1.1 locally and watching 2.1 go
  red on exactly those rows, then restore. This proves the test binds the defect rather than
  passing vacuously.
- [x] 2.3 Add a case asserting a JSON-quoted `"token"`, `"password"`, and `"secret"` key is
  redacted by the **key** rule, with a value short enough that the id rule cannot be what
  redacted it (e.g. `"abc"`). Assert the output label is exactly `<key>=[redacted]`.

## 3. Regression tests — the over-redaction direction

- [x] 3.1 Add cases pinning the survival table in `design.md` Decision 4 to the values the
  **current** sanitizer produces: a short id (`user 12345 order ab12cd34`), a hyphen-edged run
  of ten or more digits, an ISO-8601 timestamp, and a 16-hex `span_id` — each unchanged.
- [x] 3.2 Add a case pinning the allow-listed structured keys `school`, `queue`, `action`,
  `service.name`, and `service.instance.id` as surviving with their values verbatim.
- [x] 3.3 Pin `trace_id` as **`[id:redacted]`**, matching current behavior — a 32-hex value is
  already redacted today because allow-listed structured values still pass through
  `sanitizeText`. Do **not** exempt trace ids from the id rule to make a "survives verbatim"
  assertion pass; that is an unrelated behavior change on the sensitive surface
  (Decision 4). Trace correlation is asserted separately via `spanContext`.

## 4. The exporter-seam proof

- [x] 4.1 In `server/src/config/observability/telemetry-logger.test.ts`, add a test that
  constructs a real TypeORM `EntityNotFoundError` for a `Calendar` with a **hyphen-edged**
  token, pushes it through `TelemetryLogger.debug()` using the file's existing mocked
  `otelLogger`, and asserts `otelLogger.emit.mock.calls[0][0].body` contains no substring
  equal to the token (Decision 3). Reuse `createLogger()`; add no Postgres or Nest HTTP boot.
  - Verification: `cd server && npx jest src/config/observability/telemetry-logger --maxWorkers=2`.

## 5. Local-green verification

- [x] 5.1 Run `cd server && npx jest src/config/observability/ --maxWorkers=2`; confirm all
  pre-existing tests in the directory stay green alongside the new ones. (Baseline before this
  change: 6 suites, 59 tests passing.)
- [x] 5.2 Run `cd server && npm run build` and `npm run lint`; confirm tsc and ESLint are clean
  on the touched files.
- [x] 5.3 Run the full server suite `cd server && npm test -- --runInBand` with the documented
  local Postgres/Redis prerequisites, and confirm no unrelated suite regressed — in particular
  any suite that asserts on log output.
- [x] 5.4 Run `openspec validate close-log-sanitizer-token-leak` and inspect
  `git diff --check`; confirm no TODO/debug artifact, no OpenAPI or generated-client drift, no
  secret, no migration, no native/store config, no deployment or legacy Flutter change, and
  that the diff touches only `sanitize-log.ts`, the two test files, and this change folder.
