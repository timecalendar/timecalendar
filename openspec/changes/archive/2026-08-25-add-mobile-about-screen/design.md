## Context

The React Native Settings hub currently owns two destination sections and explicitly
omits About until a working route exists. Its `SettingsSection` and `SettingsRow`
components provide the established grouped-list visuals and accessibility baseline,
but `SettingsRow` currently supports only Expo Router destinations. The legacy Flutter
screen supplies the product copy and destinations, not the target composition: current
mobile architecture requires a thin Expo Router entrypoint, feature ownership, native
grouped presentation, typed localization, and deterministic proofs.

This change also introduces `expo-application` native code and changes
`mobile/app.config.ts`, so it changes the Expo fingerprint, needs a fresh native build,
and remains human-gated at merge even after reviewer approval and green CI.

## Goals / Non-Goals

**Goals:**

- Make About reachable both from a third Settings section and the `/about` deep link.
- Preserve the useful Flutter meaning in concise EN/FR copy and native grouped rows.
- Dispatch web, email, and installed-version information through their correct native
  seams with truthful nullable-value behavior.
- Leave a data-driven row seam where the follow-up Changelog destination can be inserted.
- Meet the mobile machine DoD and record device-only verification without blocking code.

**Non-Goals:**

- Suggestions/feedback, Debug access, OTA update identifiers, analytics events, or a
  Changelog row/route.
- Visual parity with the prose-heavy Flutter screen.
- OpenAPI, generated-client, server/schema, Firebase, infrastructure, workflow, or
  legacy Flutter changes.
- A new ADR: the ownership and row-shape choices below are local and inexpensive to
  reverse.

## Decisions

### Decision 1 — About owns a standalone `features/about` module

Create `mobile/src/features/about/` with only `data/` and `ui/` sublayers plus their
small public barrels. `data/` owns the pure native-version normalization model and the
narrow `expo-application` read; `ui/` owns the screen, grouped row model, and native link
dispatch. `mobile/src/app/about.tsx` remains a one-line UI-barrel export.

This gives privacy/contact/version/developer content a clear product-domain owner and a
natural home for its tests and the later Changelog composition. Keeping the screen under
`features/settings/ui` was considered, but would make Settings own unrelated product
content and make the follow-up less coherent. The dependency stays acyclic: Settings
knows only the `/about` route string, while About consumes exported Settings list
primitives.

### Decision 2 — Generalize the existing row primitive with explicit variants

Export `SettingsSection` and `SettingsRow` through the Settings UI barrel and evolve the
row props into a discriminated destination/action/value shape:

- router destinations retain `href`, link semantics, pressed feedback, and disclosure;
- web/email actions receive an `onPress` callback and retain one full-width accessible
  link target;
- the installed-version row is non-interactive, has no disclosure glyph or navigation
  hint, and exposes a combined localized label/value to assistive technology.

Existing Settings navigation behavior remains the default and is regression-tested.
This avoids duplicating list styling while preventing a static value from pretending to
be a link. About defines section/row arrays as data and renders them through these
variants, so the Changelog ticket can add one router row without restructuring the
screen.

### Decision 3 — Register About as a root Stack sibling

Add `<Stack.Screen name="about" options={{ headerShown: true }} />` beside the other
non-tab Settings destinations. The screen sets its localized native header title, and
the route file only re-exports `AboutScreen` from the About UI barrel. Add an `app`
section to the Settings hub destination model after `events` and `preferences`, with one
About row targeting `/about`.

This follows ADR 034's rule that every Settings row has a working route and an explicit
section owner. Nesting About inside the Settings tab Stack was rejected because the
existing architecture registers non-tab destination screens as root Stack siblings and
uses that shape for cold deep links and a stable back stack.

### Decision 4 — Use purpose-specific native link dispatch

Privacy and both developer URLs call `WebBrowser.openBrowserAsync` with these constants:

- `https://timecalendar.app/privacy-policy`
- `https://www.samuelprak.fr/`
- `https://www.eddymonnot.com/`

Contact calls `Linking.openURL("mailto:hello@timecalendar.app")`. URL constants and the
row/action model stay together in the About UI module so tests can assert exact dispatch
without coupling to row order. Expo Router external hrefs and the system browser were
rejected because the acceptance contract requires the in-app browser surface for HTTP(S)
and the platform URL handler for mail.

### Decision 5 — Normalize native version/build into a total presentation model

Install `expo-application` with Expo's SDK-compatible installer. A pure helper accepts
`nativeApplicationVersion` and `nativeBuildVersion`, trims values, and returns one of
four cases: version + build, version only, build only, or unavailable. UI translations
format each case; when neither value is usable, the row says a localized “Unavailable”
rather than falling back to app config or exposing an empty accessibility value.

Set the Expo config version to `4.0.0`. The displayed native value still comes only from
the installed binary, because substituting config or OTA identifiers could misdescribe
the build actually running.

### Decision 6 — Keep content native, localized, and accessibility-complete

Render the two product paragraphs before four grouped sections: privacy, contact, app
information, and developers. Use theme tokens, minimum rather than fixed row heights,
wrapping text, safe-area-aware scrolling, localized section/row labels and hints, one
assistive target per interactive row, hidden decorative icons/separators/disclosures,
and no role/hint that implies the version row is actionable. EN remains the typed key
source and FR must have exact parity.

The Flutter Suggestions prose, hidden Debug tap, and Changelog button are intentionally
absent. Developer names and destinations remain Samuel Prak and Eddy Monnot at the URLs
above.

### Decision 7 — Prove behavior at the narrowest reliable layers

- Data tests cover all four version/build states, including blank-string normalization.
- About RNTL tests mock `expo-application`, `expo-web-browser`, `expo-linking`, and the
  router/native symbol edges; they cover EN/FR render, exact dispatch, grouped order,
  accessible roles/hints/values, and non-interactive version behavior.
- Settings tests cover the third-section order and About navigation; the route-structure
  test proves the thin route and root Stack registration.
- A new Maestro flow cold-deep-links to `/about`, handles the optional iOS custom-scheme
  confirmation, asserts stable localized content, then cold-launches the tabs and reaches
  the same screen through the Settings About row.
- Run TypeScript, lint, Jest with coverage, and the Settings route-structure proof. Do not
  add `run-e2e`; native flows run on `main` in simulator-capable CI.

Update `features.md` and `navigation.md`, mark Phase 07 About shipped with the existing
draft PR number, and add the required inbox note. Do not recreate
`architecture-changelog.md`: current `main` intentionally removed it and
`architecture.md` now says Git retains chronology while current-state pages carry only
live guidance.

## Risks / Trade-offs

- **[Native dependency or config is installed without a matching binary]** → Use
  `npx expo install expo-application`, commit the lockfile, accept the fingerprint
  change, and require a fresh native build plus human merge.
- **[Nullable or blank native metadata produces a false version]** → Normalize both
  inputs into a total four-case model and test every branch; never substitute an OTA or
  configured version at runtime.
- **[Generalizing `SettingsRow` regresses existing navigation rows]** → Preserve the
  router variant as the default contract and extend existing Settings screen tests with
  row-role, disclosure, and route assertions.
- **[External apps/browser cannot be fully exercised in Jest]** → Assert exact native
  API dispatch in unit tests and inbox the real-device link behavior with the broader
  device pass.
- **[Long translations or large text clip dense rows]** → Reuse the established
  minimum-height/wrapping grammar and include EN/FR RNTL plus large-text device checks.

## Migration Plan

1. Install the SDK-compatible native dependency and bump app config version.
2. Add the About data/UI module and generalize/export the grouped-row primitives.
3. Register the thin route and Settings destination.
4. Add catalogs, automated proofs, Maestro flow, and current-state documentation.
5. Build a new native binary through the normal post-merge flow; no data migration or
   runtime rollout action is required.

Rollback removes the About route/row/module and native dependency and restores the
previous config version in a new native build. There is no persisted or server data to
migrate.

## Open Questions

None. Product scope, destinations, QA posture, and human merge routing are resolved in
the Founding Engineer handoff.
