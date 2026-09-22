## Context

T09 introduced a total row decoder, bounded three-page local reads, immutable timeline presentation, original-UID activation, and one committed-page accessibility tree. Its deliberate boundary rejects `end <= start`, classifies equal endpoints as unsupported instants, uses positive-duration half-open intersection everywhere, derives a tile's pressable height directly from duration, and turns a validated imported color into an alpha string. Blank titles remain empty strings and the rich details mapper still trusts several optional values.

T10 closes those narrow gaps without changing stored SQLite rows, sync writes, API contracts, renderer ownership, or details routing. The accepted product contract requires point membership, duration-faithful visuals with 44pt iOS / 48dp Android interaction targets, localized missing-title copy, deterministic readable event colors, row-isolated malformed-data handling, and content-free diagnostics. Overlap disambiguation remains T11 and final device/accessibility acceptance remains T28.

## Goals / Non-Goals

**Goals:**

- Make equal-start/end timed rows valid point events while continuing to reject reversed timed ranges and zero/reversed date-only ranges.
- Define one half-open membership rule for positive intervals and one boundary rule for point events across SQL reads, in-memory filtering, day projection, and tests.
- Keep zero/two-minute visuals faithful while providing platform-minimum interaction geometry and native cancellation behavior.
- Produce one pure, deterministic event appearance from normalized source color, theme scheme, and increased-contrast policy input, with measurable WCAG contrast.
- Normalize optional content before consumer operations, resolve missing titles only at localized presentation boundaries, and preserve full meaning in details/accessibility.
- Retain allowlisted aggregate diagnostics and immutable original-identity page models.

**Non-Goals:**

- Overlap columns, dense target disambiguation, aggregation thresholds, spanning/DST/all-day presentation, provider or recurrence rewriting, or stored-fact repair.
- A second semantic tree, compatibility renderer, new dependency, theme-token redesign, runtime-wide accessibility abstraction, or new top-level Maestro journey.
- API/generated-client, schema/migration, native/store/EAS/Firebase, CI/deploy/infrastructure, or legacy Flutter changes.
- Claiming physical touch, increased-contrast, VoiceOver, or TalkBack acceptance from host tests; T28 retains the final matrix.

## Decisions

## Decision: Equal timed endpoints are point facts with start-inclusive/end-exclusive membership

The V1 domain continues to use the `timed` tag and Date endpoints. For timed rows, `end < start` is a rejected `reversed-range`; `end === start` is an accepted point; and `end > start` is an interval. Date-only rows still require `end > start` and retain their existing invalid-date-range reason. Rejection reasons remain a closed enum; implementation may rename the existing `non-positive-range` code to the more accurate `reversed-range`, but must update every exhaustive counter/test atomically and never include a row value.

All bounded membership uses these equations:

- interval: `start < rangeEnd && end > rangeStart`;
- point: `start >= rangeStart && start < rangeEnd`.

The same disjunction is expressed in synced/personal SQL predicates and the shared in-memory predicate. A point exactly at the lower boundary belongs to the range; a point exactly at the exclusive upper boundary belongs only to the next range. Day projection therefore assigns a midnight point to the new civil day and never duplicates it across adjacent pages. The support classifier returns an explicit supported point/interval shape rather than treating equality as an unsupported instant.

Alternatives considered: widening positive intervals with `end >= rangeStart` duplicates back-to-back intervals and points; epsilon-duration rewriting mutates facts and drifts with zoom; a new persisted event kind expands the schema for a rendering projection.

## Decision: Visual geometry and interaction geometry are separate siblings

`TimedTileV1` carries explicit `shape: "point" | "interval"`, original start/end instants, start/end minutes, normalized display title, full optional location, and resolved colors. Positive intervals retain exact minute-to-pixel visual height, including a two-minute event. A point renders a fixed 4dp horizontal instant marker centered on its clock coordinate; it does not invent duration or occupy overlap time.

The visual node remains duration-faithful and clipped to its event bounds. A separate absolute interaction wrapper is centered on that visual and has a platform-selected minimum block-axis extent of 44pt on iOS and 48dp on Android. Its inline extent remains the full single-column event width. The wrapper owns the one `Pressable`, accessibility role/name/hint, test identity, and original-UID callback; the visual content is non-accessible. Wrapper overflow may extend above/below the visual but is clamped to the day's 00:00–24:00 plane so edge events remain reachable. Native ScrollView/PagerView/Gesture Handler movement continues to cancel the press; no responder or manual movement threshold is added.

When height is constrained, title is the first and only visual text. Location and checklist visuals appear only when their complete line budget fits; no location line displaces title. Point markers need not draw text, but their one accessible button and details route retain full title/time/location. T11 owns conflicts between overlapping expanded hit areas; this slice proves only single-column deterministic order and does not silently choose among dense targets.

Alternatives considered: setting `minHeight` on the tile falsifies duration and overlap geometry; `hitSlop` alone cannot prove exact platform geometry or clamp at day boundaries; rendering every tiny title outside its interval causes visual collisions; custom gesture recognition duplicates native owners.

## Decision: Localized display title is resolved after total raw-content normalization

The validated event domain represents a missing/blank/non-string title as `undefined`; it does not store English or French copy. A pure presentation helper receives the raw optional title plus the caller's localized fallback and returns the trimmed title or fallback. The Calendar screen supplies `t("calendar.event.noTitle")` while building the immutable timeline presentation; Agenda, Home summaries, and the rich details UI use the same rule at their existing presentation boundaries. The catalogs add exact English `(No title)` and French `(Sans titre)` values with typed parity.

Optional location/description strings are trimmed and omitted when unusable. Teacher arrays retain only trimmed strings. Tag arrays retain only object entries whose required display fields narrow safely; rich-details tags cannot reach `.map` rendering with malformed name/color/icon members. No normalizer writes a corrected value back to SQLite. Full resolved title, full formatted time, and full optional location feed the accessible name and details even when the visual tile omits or clips lower-priority content.

Alternatives considered: localizing in the decoder couples storage validation to runtime language and freezes the wrong locale; storing the fallback mutates imported facts; leaving `title: ""` makes blank states easy to forget at consumers; discarding a row for malformed optional data violates row-isolation scope.

## Decision: Event appearance is a pure contrast-verified policy, not alpha-string styling

`event-color.ts` becomes the single pure resolver. Its inputs are untrusted color, active scheme (`light`/`dark`), and `increasedContrast`; its immutable output contains normalized source/accent, opaque surface, foreground, and outline colors. It uses only sRGB parsing, alpha composition, relative luminance, and WCAG contrast helpers—no hook, platform global, renderer, or theme mutation.

The policy is deterministic:

1. Accept only `#RRGGBB` (case-insensitive, normalized uppercase); otherwise use the neutral source fallback `#64748B`.
2. Composite the source over the active theme canvas at 35% in normal mode and 20% in increased-contrast mode, producing an opaque wash.
3. Choose the higher-contrast of the theme's black/white foreground endpoints for text and require at least 4.5:1 against the wash. Tests exhaust boundary colors and representative arbitrary inputs; failure to meet the invariant is a test failure, not a runtime best effort.
4. Preserve source identity through an accent/outline. If the normalized source is below 3:1 against the canvas, mix it toward the selected foreground in deterministic 5% steps until it reaches 3:1. Increased-contrast mode also draws the selected foreground outline so event geometry is not color-only.

The renderer consumes the resolved foreground explicitly rather than relying on `ThemedText` defaults. Missing/invalid colors therefore remain theme-safe, light/dark are equal designs, and increased contrast strengthens boundary separation without changing event identity or persisted color. A small calendar-owned hook may translate supported platform high-contrast signals into the boolean policy input; it must unsubscribe on unmount and degrade deterministically to `false` where no signal exists. It does not become a shared app-wide accessibility abstraction.

Alternatives considered: appending alpha leaves contrast implicit and renderer-dependent; always using white fails light colors; always using theme text does not prove arbitrary direct fills; replacing all event colors with neutral surfaces loses source identity; adding global tokens makes user data a theme-token concern.

## Decision: Rejection diagnostics are closed aggregate facts and cannot capture content

Decoders remain total per row and return accepted events plus an exhaustive reason-count record. Required identity/date failures and reversed/date-only ranges increment only their allowlisted reason. Optional-content normalization never rejects the row. The snapshot reporter emits at most one event per non-zero reason and completed revision, constructed exclusively from a static diagnostic code, the allowlisted reason, and integer count under the fixed `calendar-local-read` tag.

The diagnostic function accepts no row, UID, title, date, source/calendar identity, caught error, query input, or arbitrary metadata parameter, making raw-content forwarding structurally unavailable. Tests use sentinel private strings in every malformed field and inspect serialized calls to prove none escaped. Valid Maths remains published beside all malformed fixtures.

Alternatives considered: forwarding caught exceptions may leak payloads in messages; one diagnostic per row leaks cardinality and increases noise; a whole-array catch erases valid siblings; silently dropping required-date failures removes operational evidence.

## Decision: Extend the existing V1 seams and current documentation without a new ADR

This change refines approved D01/D04/D06/D08 boundaries: data still owns validation and immutable presentation, the owned renderer still owns one native motion tree, accessibility remains one committed-page representation, and evidence remains reproducible/content-free. No costly-to-reverse architecture changes, new dependency, or external contract is introduced, so no ADR is warranted.

The implementation updates the existing Calendar/data/testing Architecture Book sections and changelog only to describe the new current state and executable proof. It does not change global theming rules or claim the final device matrix. If implementation requires a sensitive surface or a different ownership boundary, the Applier stops and returns the issue for scope review before editing it.

## Risks / Trade-offs

- [Expanded hit areas can overlap before T11] → Limit this slice to single-column behavior, preserve deterministic source order, test identity, and leave dense-target choice explicitly to T11.
- [A point near midnight could extend outside the clock plane] → Clamp only the interaction wrapper, not the point's membership or visual clock coordinate.
- [Platform high-contrast APIs differ] → Keep the resolver platform-free, isolate runtime signal mapping in a small hook, and cover unavailable-signal fallback; final behavior remains T28 device evidence.
- [Color mixing can drift through rounding] → Define channel rounding once, test exact vectors plus contrast invariants, and return opaque uppercase hex values.
- [Making title optional affects existing consumers] → Migrate Timeline, Agenda, Home, and Details in one change and run every affected suite; do not add a compatibility alias that permits blank display text.
- [Host tests cannot prove physical targeting or press cancellation feel] → Assert geometry and event routing structurally, retain native owners, and report device-only limitations honestly.

## Migration Plan

Land decoder/range/color/title helper tests first, then immutable presentation changes, renderer geometry, consumer localization/details hardening, fixtures, and current-state documentation. No data migration, backfill, API rollout, native rebuild requirement, or deploy act exists. Rollback is a source revert; persisted rows remain byte-for-byte compatible.

## Open Questions

None. T11 owns overlapping target arbitration, T25 owns final density/visual tuning, and T28 owns the complete native accessibility/device matrix.
