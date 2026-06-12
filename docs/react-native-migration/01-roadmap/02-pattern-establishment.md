# Phase 02 — Pattern establishment

> **Goal:** build three deliberately-varied features that each stress a *different* architectural axis, then **extract and harden the golden-path template** the rest of the app copies. This is where the pattern is *earned*, not declared.
>
> **Depends on:** Phase 01. **Modules:** `settings`, `personal_event` (partial), `school` (read path).
>
> This is Phase 1 + 1.5 in [`migration-approach.md`](../00-exploration/migration-approach.md) §4. Order fixed by [K-4](../00-exploration/migration-approach.md#8-resolved-knobs-phase-0-kickoff-decisions).

## Rough steps

1. **Feature A — Settings.** MMKV-backed prefs (replaces `pref` + `shared_preferences`), native controls (Expo UI switches/pickers), full i18n surface, theme/dark-mode. Axis: **local KV + native controls + i18n**.
2. **Feature B — Personal events (CRUD only, no calendar overlay yet).** Drizzle/SQLite table, create/edit/delete, forms, native date/time pickers, list rendering. Axis: **structured device-local data + forms + offline writes.** *(Design the schema so the [Phase 09](./09-data-migration.md) importer can target it.)*
3. **Feature C — School selection (read path).** TanStack Query server read, offline cache via persister, nested navigation. Axis: **server state + offline read + navigation.**
4. **Harden the template (Phase 1.5).** Extract the **golden-path exemplar** + reusable scaffolding (feature folder shape, query/store/db conventions, screen/test/e2e skeletons). Update the Architecture Book to match what these 3 actually taught us. Record pattern decisions as ADRs.
5. *(Optional, if slack)* begin the **calendar spike** pre-read — it's our biggest unknown.

## Exit criteria

- All three features pass the full DoD on both platforms.
- Golden-path exemplar documented; scaffolding exists; a new feature can be started by copying it.
- Architecture Book reflects reality (not Phase-0 guesses); ADRs cover the core patterns.
- Any rule changed during this phase is logged in the Rule changelog.

## Risks & decisions

- **Don't over-freeze.** The point of three features is variety before blessing the pattern — if A's pattern doesn't fit C, that's the signal to generalize, not to force it.
- Personal events is intentionally **CRUD-only** here; its calendar overlay lands in [Phase 05](./05-personal-data.md) once the timeline exists. Clean seam, on purpose.
- Resist gold-plating: these are real features, but their job is to *teach the template*.
</content>
