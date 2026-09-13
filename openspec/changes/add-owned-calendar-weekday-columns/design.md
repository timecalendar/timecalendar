## Context

T03 leaves the real Calendar route with one native vertical `ScrollView`, one fixed hour gutter, and a native three-page `PagerView` whose pages are undivided 00:00–24:00 clock planes. The screen/controller owns a Monday-first committed week anchor, display zone, seven-day Agenda range, transition revisions, and settled vertical offset. The formatting seam already exposes localized weekday/date parts, and Settings already owns total typed preferences over reactive MMKV reads.

T04 adds the final empty-week slice. The product contract requires one complete Monday-first civil week, seven visible days by default, a Settings > Calendar weekend switch, five visible weekdays when disabled, and no effect on paging distance or Agenda dates. D02 requires headers and page content to stay on one committed date context; D04 keeps the native scroll/pager owners; the existing settings/storage seams must remain the only persistence path. The implementation must use display-zone civil-day arithmetic rather than fixed durations or device-local `Date` fields.

## Goals / Non-Goals

**Goals:**

- Derive stable Monday-to-Sunday display-zone dates and filter weekends by weekday identity under explicit policy inputs.
- Present localized weekday/date headers and matching equal-width vertical columns at five- and seven-day widths.
- Mark Today with a visible non-color cue and useful semantics.
- Persist a default-on weekend preference and expose it as an accessible switch in the existing Calendar section of Settings.
- Keep one-week paging equal to seven civil dates, preserve the three-page bound and settled vertical offset, and leave Agenda dates/events unchanged.
- Preserve T01–T03 transition, cancellation, accessibility, localization, and native-motion contracts with focused automated and owner-device proof.

**Non-Goals:**

- Day-mode switching, selectable dates, events or all-day lanes, current-time presentation, zoom, configurable or locale-derived week start, configurable weekend definitions, or Agenda redesign/filtering.
- Persisting the selected date or vertical offset, changing event/store facts, or changing API/generated-client/database contracts.
- Adding a route, dependency, alternate renderer, synchronized secondary pager, custom gesture owner, or native configuration.

## Decisions

## Decision: Build one pure civil-week column model from explicit policies

Add a pure Calendar data helper that accepts the committed anchor, display zone, explicit first weekday, and `showWeekends`. It normalizes the anchor with `startOfWeekInZone`, advances with `addDaysInZone`, derives weekday identity from the civil day key, and returns stable column records for all seven dates or for the five records whose weekday is neither Saturday nor Sunday. Each record carries the date/day key and weekend identity; presentation derives localized labels separately through the existing formatter seam.

Monday remains the launch input at the controller/screen boundary, not a hidden invariant in the helper. Paging continues through `shiftWeekInZone(..., 1)` and therefore always advances seven civil dates. Filtering changes only the visible column collection; it never changes the committed anchor, Agenda range, page identity, or transition revision.

Alternatives considered:

- Slice the first five array elements: rejected because it encodes Monday-first and “weekend” as position rather than identity.
- Use `Date#getDay()` on display instants: rejected because device-local projection can disagree with the effective display zone.
- Change page stepping to five dates when weekends are hidden: rejected because a page remains one complete launch week and must not drift across week boundaries.

## Decision: Keep one committed header outside vertical motion and share the column model with every grid page

Render one header row between the native month/year title and the vertical clock viewport. It contains an hour-gutter-width spacer and one equal-flex cell for each visible committed-week date. The row remains vertically pinned and committed during a held horizontal transition, matching D02. On accepted settle, the screen anchor and header labels update with the same revision that replaces the centered three-page generation.

Each previous/current/next pager page derives its own column records with the same `showWeekends`, first-weekday, and display-zone inputs. Its clock plane draws vertical boundaries from those equal-flex cells while retaining T03’s horizontal lines and full-day geometry. The shared ordered model and gutter width, rather than independently calculated percentages, are the alignment contract at narrow and tablet widths. Development page tints/labels remain diagnostic only and production pixels remain identical across the edge-to-center remount.

A separate header `PagerView` is rejected because synchronizing two native pagers would add another motion owner and introduce a split-settlement race. Putting headers inside the vertical ScrollView is rejected because dates would disappear while reading later hours. Keeping one static committed header also preserves the approved rule that held motion does not relabel the old settled date context.

## Decision: Represent Today by identity with both visual and semantic non-color cues

Compare each column day key with the current display-zone day key. The matching committed header uses typography plus a shape cue such as a border/underline or outlined badge; color may reinforce it but cannot be the only distinction. It also exposes localized Today meaning in its accessible label/state without creating a second page-level heading or making the date selectable. Tests control the clock and zone explicitly so midnight and timezone boundaries are deterministic.

An unlabelled color fill is rejected because it fails the product’s non-color requirement. A live current-time line or automatic scroll is rejected because T08 owns those capabilities.

## Decision: Add one total default-true boolean to the existing settings/storage seam

Add a namespaced weekend key to the centralized storage inventory and classify it as environment-independent. The settings preference API reads a boolean through `@/storage`, interprets missing as `true`, writes only booleans, and exposes a reactive `{ showWeekends, setShowWeekends }` hook backed by `useStoredBoolean`. A reinstall or absent legacy key therefore shows weekends, while process restart retains an explicit false value. Backend environment reset must preserve it alongside theme, language, and display timezone.

Expose the value as a native accessible `Switch` in the existing top Calendar section of `SettingsScreen`, adjacent to calendar management. This keeps the product path at Settings > Calendar and avoids a one-control route. The Calendar screen consumes the same reactive hook and passes the boolean down; renderer/data modules never access MMKV directly.

Alternatives considered:

- Encode the boolean as a string preference: rejected because the storage seam already provides typed boolean reads/writes and missing-vs-false semantics.
- Put the switch under generic Preferences or create a new route: rejected because the approved product owner is Calendar and one control does not earn another screen.
- Store the preference in the Calendar controller only: rejected because it would not survive restart and would bypass Settings ownership.

## Decision: Preserve one accessible committed week context

The existing adjustable canvas remains the single operable week context with translated previous/next actions. The committed day-header row is readable in chronological source order and exposes localized weekday/date text, including Today on the matching day, while neighbour-page grids and all decorative boundaries remain hidden from the accessibility tree. Changing weekend visibility does not announce a date transition; accepted week settlement continues to announce the destination exactly once.

Automated tests cover label order, Today semantics, switch role/state, and hidden decoration. Real French/English narrow-width readability, Dynamic Type, contrast, VoiceOver/TalkBack traversal, and page/header alignment remain revision-bound owner-device observations; Jest does not claim those native results.

## Decision: Prove the slice through focused contracts and current-state documentation

Pure tests cover civil weeks across month/year/DST boundaries, Saturday/Sunday identity under alternate explicit first-weekday inputs, five/seven output, stable order/keys, and unchanged seven-day shifts. Preference tests cover missing/true/false reads, reactive writes, restart-shaped remounts, and environment-reset preservation. Renderer and screen tests cover header/grid alignment structure, five/seven widths, Today cue, previous/current/next pages, accepted settle, vertical offset preservation, and unchanged seven-day Agenda range. Settings and i18n tests cover the accessible switch and FR/EN key parity.

The owned-shell repository contract continues to reject vendor/fallback/duplicate renderers and unapproved motion/dependency/sensitive-surface changes. The Architecture Book updates Calendar, storage/settings ownership, the feature map, and changelog. A `(HUMAN: owner device verification)` inbox note binds the build/revision, fabricated week, language and restart instructions, owner checklist, and unavailable native axes. No ADR is needed unless implementation evidence changes an approved costly-to-reverse boundary.

## Risks / Trade-offs

- **Five narrow columns can still truncate under large text** → Keep labels compact, preserve scaling, test supported narrow widths, and require device Dynamic Type evidence rather than disabling font scaling.
- **Header and clock boundaries can drift by subpixels** → Reuse one ordered column count/model and equal-flex layout beside the same fixed gutter; test measured structure at five and seven columns.
- **A timezone change can change which column is Today** → Derive Today from the effective display zone on render and cover midnight/zone boundaries with a controlled clock.
- **A missing boolean is indistinguishable from a first install** → This is intentional: missing always means the approved default `true`; explicit `false` remains distinct and durable.
- **Preference changes during native motion could alter width** → Apply one boolean consistently to the header and all three pages in one render; do not create a date revision or second pager. If native evidence shows an incoherent held transition, cancel/recenter through the existing generation path rather than adding synchronization machinery.
- **T04 could absorb later interaction or event scope** → Keep headers non-selectable and exclude event tiles, current time, day mode, zoom, and Agenda changes.

## Migration Plan

1. Add and fully cover the pure civil-week column model and retain existing week arithmetic/formatting contracts.
2. Add the default-true persisted setting through centralized storage classification, typed settings APIs, and reactive hooks.
3. Add the Calendar-owned Settings switch and localized copy without adding a route.
4. Wire the preference into Calendar and render the committed header plus matching five/seven-column clock planes on all three pages.
5. Update focused tests, repository contracts, Architecture Book current state/changelog, and revision-bound T04 owner evidence.
6. Run local-green, strict OpenSpec validation, exact-head CI proof, and the ticket’s testable-build handoff; pause for the required owner QA and review path.

Rollback is a source/build rollback to the accepted T03 revision. Removing the new MMKV key is unnecessary: older code ignores it, and a reinstall resets it to the default-on state. There is no server, schema, API, native-binary, or dependency migration.

## Open Questions

The exact border/underline geometry and compact label typography remain implementation tuning against the approved theme and owner device feedback. If five-column alignment or supported Dynamic Type cannot satisfy the product contract without clipping, stop and return measured evidence before hiding text, disabling scaling, or adding horizontal scrolling.
