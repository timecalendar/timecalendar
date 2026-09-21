## Why

The current mobile setting offers only a small France-focused list, so students cannot find and keep the worldwide zone in which they want their schedule displayed. This change completes the approved native-settings flow with offline city/country/identifier search while preserving the already-shipped event-time, all-day, and notification interpretation.

## What Changes

- Replace the curated picker with an offline worldwide catalog backed by pinned `@vvo/tzdb` data plus bounded French and English CLDR labels installed through npm.
- Index each supplied IANA identifier and alias independently with normalized city, country, localized exemplar, and identifier tokens; grouping may enrich display metadata but never rewrites a selected identifier.
- Split automatic mode from remembered manual selection: users can follow the device zone, return to their last valid manual choice, or seed the first manual choice from the effective device zone.
- Present automatic/manual controls on the existing `/timezone-settings` route and open a platform-native chooser: a tall iPhone form sheet with Close and iOS 26 bottom-toolbar search, native adaptations on older iOS/iPad, and a full-screen Android search/back flow.
- Use one virtualized list owner with localized empty, selected, unavailable, and no-results states. Current offsets refresh from the current instant when the screen reopens or the app resumes.
- Widen preference validation without canonicalizing aliases or erasing a stored value that the current runtime cannot interpret. Selection validates against both supplied catalog data and runtime support before persistence.
- Reconcile the previous curated-only specification and ADR, document package licenses and the update procedure, and retain `date-fns-tz`/`Intl` for conversion rather than introducing new time arithmetic.

## Capabilities

### New Capabilities

- `mobile-worldwide-timezone-search`: Offline worldwide zone catalog, normalized localized search, automatic/manual chooser behavior, native presentation, selection/cancellation semantics, and dynamic offset availability.

### Modified Capabilities

- `mobile-settings-prefs`: The display-timezone preference expands from a curated closed union to validated supplied identifiers with separate remembered-manual state and non-destructive fallback for corrupt or runtime-unsupported stored values.

## Impact

- Dependencies: `mobile/package.json` and `mobile/package-lock.json` gain exact compatible versions of `@vvo/tzdb` and the bounded CLDR JSON packages used for French/English exemplar-city and territory labels; package licenses and updates are documented.
- Mobile data/prefs: `mobile/src/features/settings/data/`, `mobile/src/features/settings/prefs/`, and `mobile/src/storage/index.ts` gain the catalog adapter, index, runtime support checks, and remembered-manual storage.
- Mobile UI/navigation: the existing timezone settings feature, root Stack registration, thin routes, native chrome/Jest seam, and FR/EN catalogs gain the mode screen and chooser.
- Existing event formatting, calendar bucketing, personal-event input, and notification registration continue through the current effective-zone resolver; focused regressions prove the wider identifiers do not change instant or all-day semantics.
- Server/OpenAPI: no contract or generated-client change. The unchanged server IANA validator is exercised as a compatibility proof for representative selectable identifiers.
- Sensitive surfaces: the binding display-timezone ADR is revised. No native/store configuration, migration, CI/deploy, OpenAPI/generated client, or legacy Flutter surface is planned.
