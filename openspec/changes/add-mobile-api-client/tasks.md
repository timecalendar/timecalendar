# Tasks — add-mobile-api-client

## 1. Server: spec emission

- [x] 1.1 Extract the `DocumentBuilder` config from `server/src/config/swagger.ts` into a shared `createOpenApiDocument(app)`; keep `setupSwagger` (and `/api-json`) behavior identical
- [x] 1.2 Add `server/src/generate-openapi.ts` (lyrochat pattern): `NODE_ENV=test`, `NestFactory.create(AppModule)` without listening, write pretty-printed `openapi/openapi.json`, `app.close()`, exit non-zero on failure
- [x] 1.3 Add a `generate:openapi` npm script in `server/package.json`; note the docker-compose prerequisite (same as `npm test`) next to it or in the script's failure output
- [x] 1.4 Run it against the local compose services; commit the first `openapi/openapi.json` and sanity-check it (paths/DTOs present, valid OpenAPI 3, stable on a second run)

## 2. Mobile: Orval codegen

- [x] 2.1 Install `orval` (dev) and `@tanstack/react-query` v5 in `mobile/` (pin current versions; resolve against npm)
- [x] 2.2 Add `mobile/src/api/config.ts` (base URL: `EXPO_PUBLIC_API_URL` ?? `https://api.timecalendar.host:1443`; document the Android-emulator `10.0.2.2` gotcha here) and `mobile/src/api/mutator.ts` (typed `customFetch`: base-URL prefix, JSON headers, non-2xx → typed `ApiError` with status + parsed body)
- [x] 2.3 Add `mobile/orval.config.ts`: input `../openapi/openapi.json`, output `src/api/generated/` (tags-split), `client: 'react-query'`, `httpClient: 'fetch'`, mutator from 2.2, prettier post-hook; add a `generate` npm script
- [x] 2.4 Run generation; fix any spec/codegen rough edges (prefer fixing the server spec at the source; orval `override` only for leaf issues per R-4); commit `src/api/generated/`
- [x] 2.5 Verify `npx tsc --noEmit` is clean in `mobile/` with the generated code

## 3. Mobile: query runtime + smoke

- [x] 3.1 Mount `QueryClientProvider` (module-scoped `QueryClient`, stock defaults) in `mobile/src/app/_layout.tsx`
- [x] 3.2 Smoke-verify end-to-end (D8): with the local dev server running, temporarily call one generated GET hook (e.g. schools list) from a template screen with `EXPO_PUBLIC_API_URL` pointing at it, confirm data renders on simulator, then remove the temporary call

## 4. CI drift gates

- [x] 4.1 Server gate: in `build.yaml`'s `test` job (after compose-up), run the emit script and `git diff --exit-code openapi/openapi.json`; failure output names `generate:openapi`; resolve the open question about test-DB bootstrap order here
- [x] 4.2 Mobile gate: add a minimal `test-mobile` job to `build.yaml`: `npm ci`, `npm run generate`, `git diff --exit-code mobile/src/api/generated`, `npx tsc --noEmit`; failure output names the regen command
- [ ] 4.3 Push the branch and confirm both gates pass green, then flip one side locally (e.g. touch a DTO) to confirm each gate actually fails on drift before reverting

## 5. Documentation (Architecture Book)

- [x] 5.1 Add the data-layer entries to `.claude/rules/mobile/architecture.md`: committed-spec seam, Orval→generated/ pattern (regen command), single fetch mutator rule, base-URL config — each pointing at its enforcing CI gate per R-1
- [x] 5.2 Triage for ADR (R-4): the committed-spec + dual-drift-gate seam is load-bearing — record it (context, alternatives: live-URL gen, generate-on-demand; revisit-ifs) in the change or the ADR log location established by the five-artifacts step
