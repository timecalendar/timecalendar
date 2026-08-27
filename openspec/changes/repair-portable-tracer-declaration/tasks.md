## 1. Portable tracer declaration boundary

- [x] 1.1 Import the public `NodeSDKConfiguration` type from the direct
  `@opentelemetry/sdk-node` dependency and annotate `createNodeInstrumentations` with its
  instrumentation property type; do not change the returned array, configuration, hooks,
  or runtime instrumentation behavior.
- [x] 1.2 Build the server and inspect the emitted tracer declaration to confirm it names
  only a portable public SDK type and contains no physical or nested
  `node_modules/@opentelemetry/instrumentation` path.

## 2. Focused regression and documentation

- [x] 2.1 Run the focused tracer suite; add a compiler-level type fixture only if it
  provides a stable regression proof beyond declaration emit, and do not add source-text
  assertions or dependency-hoisting manipulation.
- [x] 2.2 Review `docs/mobile/architecture-book/architecture.md` and `testing.md` against
  the final implementation. Record this item as N/A with the reason if the repair remains
  a server-local type boundary with no reusable mobile architecture/testing rule; update
  the topical Architecture Book page and changelog only if that conclusion changes.
  **N/A:** The final implementation is a server-local exported type annotation and adds
  no reusable mobile architecture or testing rule.

## 3. Local-green and contract proof

- [x] 3.1 Confirm `node --version` is exactly `v24.13.0`, then run the focused tracer Jest
  suite and `npm run build` from `server/` with no TypeScript/declaration errors.
- [x] 3.2 Run `npm run generate:openapi` from `server/`, then require
  `git diff --exit-code -- openapi/openapi.json`; stop and report rather than staging any
  formatting, nondeterministic, or semantic contract drift.
- [x] 3.3 Review the final path diff and confirm no contact code, generated mobile client,
  controller/DTO semantics, dependency/lockfile, migration/schema, native/store/EAS,
  deploy/CI/infrastructure, secret/certificate, or legacy Flutter change entered scope.
- [x] 3.4 Push the implementation head and require the existing `build-server` image build
  plus server test/OpenAPI drift job in `.github/workflows/ci-build-deploy.yml` to pass as
  the CI proof; no workflow edit is intended.
