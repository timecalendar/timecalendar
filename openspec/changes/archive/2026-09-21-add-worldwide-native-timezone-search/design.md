## Context

`mobile-timezone-preference` already stores `settings.timezonePreference` as `"system" | <ten curated identifiers>`, resolves one effective display zone, threads that zone through event formatting/day bucketing/personal-event input, and sends it with notification registration. The current `/timezone-settings` route is a universal 11-item picker. ADR 035 makes the curated closed union binding, so this change must replace that part of the decision without weakening its one-resolver, explicit-zone, floating all-day, or push-formatting rules.

The approved native-settings project requires an offline worldwide chooser whose searchable data comes from maintained packages rather than handwritten geography. `@vvo/tzdb` 6.198.0 supplies raw identifiers (including deprecated compatibility aliases), display groups, country metadata, and common cities. Unicode CLDR supplies localized exemplar cities and territory names. The installed Expo Router Stack exposes `presentation: "formSheet"`, detents, `Stack.SearchBar`, toolbar buttons, and the iOS 26 `Stack.Toolbar.SearchBarSlot`; a virtualized React Native list remains the one content scroll owner.

The current key and all curated values are already in production. A newer catalog may also contain an identifier that an older OS `Intl` database does not support. Therefore catalog membership, runtime availability, stored intent, and effective fallback are distinct facts.

## Goals / Non-Goals

**Goals:**

- Search supplied worldwide identifiers offline by common city, country, localized exemplar, source label, alias, and raw zone name with case/accent-insensitive matching.
- Preserve the exact selected identifier or alias; never replace it with a group's representative identifier.
- Keep automatic mode and the last manual choice independently, with backward-compatible reads of the current key.
- Use native Router presentation/search/back/close behavior and one lazy list owner on each platform.
- Keep all existing instant conversion, event-at-instant offset, all-day floating, and notification behavior behind the current effective-zone seam.
- Make dependency provenance, generated-data bounds, licenses, update procedure, runtime incompatibility, and downgrade behavior explicit and testable.

**Non-Goals:**

- Region-first navigation, exhaustive settlement/geocoding search, network/location access, handwritten time-zone/DST rules, custom glass or custom modal navigation.
- Replacing `date-fns-tz`/`Intl`, changing event storage or schedule semantics, adapting the fixed Paris notification schedule, or changing the server/OpenAPI contract.
- Guaranteeing that every catalog identifier is supported by every OS database.

## Decision 1 — Generate a bounded feature-owned catalog from exact package inputs

Pin `@vvo/tzdb` at `6.198.0` and the matching `cldr-dates-full` and `cldr-localenames-full` release at `48.2.0` in the mobile npm lockfile. A deterministic mobile script reads only the `en`/`fr` `timeZoneNames.json` exemplar fields and `territories.json` labels, joins them to the tzdb inventory, and writes a feature-owned generated artifact under `settings/data/`. Runtime code imports that bounded artifact, not the full CLDR distributions. The script has a `--check` mode used by tests/CI, and the generated file records package versions but no copied license prose.

The catalog inventory is the exact union of tzdb names, row names, group members (including deprecated aliases), and the library-provided UTC entry. It emits one record per exact identifier. Group metadata may supply country/common-city/search labels, but the record key and selection value are always the exact identifier. Missing CLDR labels fall back to supplied tzdb names and then a readable identifier component.

Package/license/update documentation records MIT for tzdb, Unicode-3.0 for CLDR, the exact inputs, the generation/check commands, and the rule that dependency updates regenerate the artifact and rerun representative search/runtime/server compatibility tests.

*Alternatives rejected:* shipping all CLDR locale data inflates the app for two supported locales; maintaining copied city tables violates D02; using only grouped `getTimeZones()` silently loses or substitutes aliases.

## Decision 2 — Build an immutable normalized search index, preserving every identifier

The feature data layer maps each catalog record to a presentation record and precomputes normalized search fields. Normalization uses Unicode decomposition, removes combining marks, lowercases, converts `_`, `/`, punctuation, and repeated whitespace into token boundaries, and never mutates display text. Search tokens include the exact identifier and path components, tzdb alternative name, all supplied main cities, source country, both bounded FR/EN exemplar aliases, and both bounded FR/EN territory labels. Including both languages lets `London` and `Londres`, or `Montreal` and `Montréal`, reach the same exact result regardless of the active UI locale.

Queries are trimmed and tokenized; every query token must match at least one indexed field. Ranking is deterministic: exact identifier/exemplar matches, then prefixes, then other token matches, with localized label and exact identifier as tie-breakers. An empty query pins the current/manual result when present and then exposes the supported catalog in localized country/city order, so browsing is useful without rendering the whole data set eagerly.

The index is module-owned immutable data. Query evaluation returns lightweight record references for `FlatList`; it performs no logging, network, or location lookup.

*Alternatives rejected:* locale-sensitive fuzzy search adds unstable ranking and unnecessary dependencies; region-first browsing is a non-goal; indexing only group representatives violates identifier preservation.

## Decision 3 — Separate stored intent, runtime support, and effective fallback

Keep `settings.timezonePreference` as the active compatibility key: `"system"` means automatic, and any selected catalog identifier means manual. Add the environment-independent `settings.lastManualTimezone` key for manual memory. Reads classify raw values without rewriting storage:

- `system`: automatic mode;
- catalog identifier supported by the current `Intl` runtime: available manual mode;
- catalog identifier not supported by the current runtime: recoverable unavailable manual intent;
- any other/corrupt value: invalid intent, resolved safely without deletion.

Runtime support is checked with `Intl.DateTimeFormat(..., { timeZone: id })` behind a cached total predicate. A chooser selection must be an exact catalog identifier and runtime-supported before either key is written. Existing curated identifiers therefore survive byte-for-byte, and deprecated aliases remain aliases when the runtime accepts them.

Turning automatic on stores the current available manual identifier as remembered state when needed, then writes only `"system"` to the active key. Turning it off restores a runtime-supported remembered identifier; on first use it seeds from the effective device identifier; if neither is selectable it uses the existing safe Paris fallback. A recoverable unsupported remembered value is not erased merely to choose a usable active fallback. Explicit chooser selection writes both active and remembered keys. A newer value observed by an old build therefore falls back under that build's old parser but remains stored for the newer build to recover.

`resolveTimezone` remains the sole effective-zone seam. An available manual identifier wins. Automatic, invalid, or runtime-unavailable manual state uses the supported device zone and finally `Europe/Paris`; UI exposes the unavailable/fallback state rather than pretending the saved identifier was accepted. Downstream calendar, event, personal-event, and notification consumers remain unchanged.

*Alternatives rejected:* replacing the existing key requires a migration and breaks downgrade recovery; canonicalizing with `Intl` or tzdb groups silently changes saved names; deleting unsupported values destroys recoverable intent.

## Decision 4 — Derive offsets at the instant that owns them

Chooser rows call the existing `date-fns-tz` primitives with a screen-owned `now` snapshot and format signed hour/minute offsets, including UTC, half-hour, and quarter-hour zones. The snapshot refreshes when the chooser gains focus and when the app returns to the foreground, so DST/current-offset labels do not become stale during a mounted session.

No event-time path changes: event formatting continues to pass the event instant to the existing formatter/resolver, and all-day values continue on the UTC floating-day path. Tests cover Paris winter/summer, UTC, Kathmandu, a half-hour zone, cross-midnight timed events, and all-day invariance.

*Alternative rejected:* tzdb's raw or import-time “current” offset is unsuitable for event instants and can become stale while the app remains open.

## Decision 5 — Keep `/timezone-settings` as the mode owner and add one native chooser route

The existing route becomes a T01-native settings page. It shows a localized “Use device time zone” switch. In automatic mode it also shows a noninteractive readable effective-zone row; in manual mode a navigation/action row shows the exact saved identifier and opens a new thin chooser route.

The root Stack registers the chooser with platform-owned presentation: iOS uses `formSheet`, a tall detent, grabber, localized Close toolbar action, and swipe dismissal; Android uses a full-screen modal/native Stack header and system back. iPad and older iOS use Router's native form-sheet/header-search adaptation. The chooser renders one controlled `Stack.SearchBar`; on iOS 26+ a bottom `Stack.Toolbar.SearchBarSlot` hosts it, while earlier iOS and Android use the native header placement. No nested navigator or custom overlay is introduced.

The content has exactly one `FlatList` with automatic inset adjustment. Its rows are lightweight React Native cells with selected/disabled accessibility state, not one Expo UI host per result. Search clear, keyboard dismissal, Close, Android back, and sheet swipe only discard transient query state. Selecting an available row validates, writes both preference keys, and performs one `router.back()`; it cannot race a second navigation.

*Alternatives rejected:* the old universal Picker cannot search or scale; one hosted native control per result violates lazy-list ownership; a custom sheet/search overlay violates D01.

## Decision 6 — Treat the native integration as an early proof, not a separate delivery

The first implementation slice registers the chooser route with a small fixture list and proves form-sheet detents, toolbar/header search placement, `FlatList` inset ownership, close/back/swipe behavior, and Jest mocks before wiring the full catalog. If the installed SDK 56 APIs cannot provide D01 fidelity on a supported device, implementation stops and escalates to the Founding Engineer instead of substituting a custom overlay. The proof remains part of this same chooser change and PR.

Automated tests cover pure catalog generation/indexing, preference transitions, runtime-unavailable behavior, route structure, selection/cancellation, and existing formatter/notification seams. The project-owner device checklist is recorded as a `(HUMAN: project owner)` inbox note under D05 and is not a repository merge gate.

## Risks / Trade-offs

- [Expo Router toolbar/search composition is alpha and may differ on installed patch versions] → Verify against the installed SDK 56 types and a supported device in the first implementation slice; keep all usage behind the route/chrome boundary and escalate rather than emulate.
- [A tzdb release can contain identifiers absent from an older OS] → Show disabled/unavailable records, validate before save, keep stored intent intact, and use a safe effective fallback.
- [Grouping metadata can map an alias to a representative zone] → Generate one exact-ID record and prohibit group names from becoming persisted values unless that exact name was selected.
- [Generated catalog drift or accidental full-CLDR bundling] → Exact pins, deterministic generated artifact, `--check` proof, dependency/bundle review, and documented update steps.
- [Large search results could cause input or scroll jank] → Precompute normalized tokens once, return lightweight references, use `FlatList`, and include a representative performance/device check.
- [Offset labels become wrong over a DST transition] → Refresh the `now` snapshot on focus/resume; keep event offsets tied to event instants.
- [A downgrade cannot understand a newly selected identifier] → Reuse the old key without destructive migration; the old parser falls back while leaving the raw string recoverable.

## Migration Plan

1. Land exact data dependencies, deterministic generation/check tooling, and the catalog/index tests.
2. Widen the preference decoder and add manual-memory transitions without rewriting existing storage; prove all ten previous values and corrupt/unavailable states.
3. Prove the native chooser fixture route on supported iOS/Android presentation paths, then connect the catalog, search, offsets, and persistence.
4. Update ADR 035, Architecture Book pages/changelog, current OpenSpec contract, dependency/license/update documentation, and the owner device-pass inbox note.
5. Rollback is code-only: an older build keeps reading the same active key, falls back to automatic for newer identifiers, and does not erase them. The extra manual-memory key is ignored safely.

## Open Questions

None blocking. Exact toolbar/search props must be confirmed against the installed `expo-router` patch during the early proof; failure to meet D01 is an escalation condition, not permission for a custom fallback.
