## 1. Exporter and regression proof

- [ ] 1.1 In `server/src/config/observability/tracer.ts`, make the production metric factory construct an `OTLPMetricExporter` subclass whose public temporality selection returns `AggregationTemporality.DELTA` for every `InstrumentType`; verify the configured gRPC endpoint still reaches the factory.
- [ ] 1.2 In `server/src/config/observability/tracer.test.ts`, test the same factory used by the production SDK against every `InstrumentType` value. Explicitly assert both UpDownCounter kinds are DELTA so replacing the subclass with the stock DELTA preference fails this test; run the focused Jest test.

## 2. Documentation

- [ ] 2.1 Update `docs/server/observability.md` to replace per-pod cumulative metric and reset examples with collector-merged series, aggregate `rate`/`increase` queries, and a post-rollout comparison of upstream attempt volume against outbound client span volume; check the queries against the collector contract.
- [ ] 2.2 Update the existing server-observability boundary in `docs/mobile/architecture-book/calendar.md` to note that stored app metrics are collector-merged DELTA-derived series while mobile sync and API behavior are unchanged; verify the Architecture Book still links to the server runbook.

## 3. Verification and delivery

- [ ] 3.1 Run the server test suite with `--coverage`, server lint, and server typecheck; record exact commands and results in the handoff.
- [ ] 3.2 Confirm the focused production-factory regression test runs in the existing CI server test job on the PR head, and use its result as the CI proof gate before merge. The current job runs `npm run test` without `--coverage`, so retain the separate local coverage run from 3.1; do not change workflow scope in this ticket.
- [ ] 3.3 Confirm the PR body describes the manual production image-tag bump and the post-deploy hourly metric comparison. State that no platform dashboard or alert query assumes per-pod cumulative application metrics; the infrastructure pod queries are separate.
