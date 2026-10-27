# Design

## Context

Slice 5.5 covers four routes. Each route file is a one-line re-export:

| Route | Screen and private modules |
| --- | --- |
| `mobile/src/app/onboarding/school.tsx:6` | `features/school-selection/ui/school-picker-screen.tsx`, `school-row.tsx`, `school-logo.tsx` |
| `mobile/src/app/onboarding/groups.tsx:4` | `features/school-selection/ui/school-group-picker-screen.tsx` (dormant: deep link only, spec `mobile-school-selection` → "retained dormant") |
| `mobile/src/app/onboarding/export-guide/providers.tsx:1` | `features/export-guides/ui/provider-selection-screen.tsx`, `guide-status.tsx` |
| `mobile/src/app/onboarding/export-guide/[pageIndex].tsx:1` | `features/export-guides/ui/guide-page-screen.tsx`, `export-guide-image.tsx`, `guide-status.tsx` |

`screen-inventory.md:249-310` and `duplication-and-drift.md` (A1, A17, B) describe the tree before
slices 3.3 (`StatusView`), 3.6 (`ListRow`) and 3.8 (`useHeaderActions`). The current state at
`39f2a233`:

- **School picker** is done except its logo. `school-picker-screen.tsx` composes `RootPage`,
  `PageIntro` (caption only), `ListRowSeparator`, `Button variant="text"`, four `StatusView`s and
  `useHeaderActions` (`:6-16`, `:65-77`, `:139-196`). `school-row.tsx:16-58` is a `ListRow`.
  `school-logo.tsx` holds every drift hit: `useColorScheme` (`:7`, `:14`), `themeColor="primary"`
  (`:27`), `fontSize: 17` / `fontWeight: "600"` (`:60-61`), absolute-fill offsets (`:77-78`,
  `:85-88`) and `StyleSheet.hairlineWidth` (`:89`).
- **Group picker** is untouched by phase 3: raw `Pressable` Confirm with `backgroundSelected` fill
  (`:139-153`), raw `Pressable` leaves and branches (`:180-215`), `type="smallBold"` (`:150`,
  `:197`, `:214`), `minHeight: 48` (`:252`, `:258`), `hitSlop={Spacing.two}` (`:143`). Its
  `StatusView`s are already in place (`:78-119`).
- **Provider selection** renders `ListRow`s with `listRowPosition` (`:135-176`) and a
  `PageIntro` **with a title** (`:125-129`) under the native title "Export guide" (`:58`); the
  thumbnail is an ad-hoc `expo-image` with `Radii.small` (`:149-167`, `:192`).
- **Guide page** renders `ThemedText type="title"` with `page.title` (`:242`) under the native title
  "Export timetable" (`:171`), `themeColor="textSecondary"` on progress (`:246`), and focuses the
  heading View on each page (`:165-166`). `export-guide-image.tsx` uses `themeColor` (`:39`, `:53`).
- **Status** for both guide routes is `StatusView` (`guide-status.tsx:6-48`) with Retry
  (`export-guide-retry`, single-flight `busy`) and Back.

**Drift census** (the contract's `DRIFT_PATTERNS`, `screen-migration.contract.test.ts:48-96`, run
over every candidate file at `39f2a233`):

| File | Hits |
| --- | --- |
| `school-logo.tsx` | scheme-access `:7,:14`; theme-color-prop `:27`; typography `:60`; font-weight `:61`; spacing `:77,:78,:85-88`; hairline `:89` |
| `school-group-picker-screen.tsx` | legacy-type-alias `:150,:197,:214`; touch-target `:252,:258` |
| `guide-page-screen.tsx` | theme-color-prop `:246` |
| `export-guide-image.tsx` | theme-color-prop `:39,:53` |
| route files, `school-picker-screen.tsx`, `school-row.tsx`, `provider-selection-screen.tsx`, `guide-status.tsx` | clean |

**Ratchet census** (`rg -n "school-selection|export-guides" tools/eslint-rules/*-allowlist.js`):
`raw-button-allowlist.js:10` (group picker, ceiling 5 in `raw-button-allowlist.test.js:10`) and
`style-literal-allowlist.js:53-56` (`school-logo.tsx` `typographyLiteral`, ceiling 7 in
`style-literal-allowlist.test.js:8-14`). `raw-primitive`, `raw-text-input`, `ad-hoc-status`,
`ad-hoc-separator`, `header-action` and `raw-event-color` list no 5.5 file. The deprecated
`ThemedText` aliases and `themeColor` have no allowlist; the migrated-screen contract is their gate.

**Maestro.** `.maestro/01-fresh-user-import.yaml` taps the school by its visible name ("My Gaming
Academia"), waits for `export-guide-page`, taps `export-guide-next` until `onboarding-import-url`.
`e2e/maestro-selectors.test.ts:300-311` pins those ids. None changes.

**Parity reference.** Flutter has no export guide and no group tree (`app/lib/modules/` has
`school/screens/school_selection/` and a free-text `add_grade` step only), so the native platforms
are the reference for these screens (R-3), and the existing journey specs pin behaviour.

**Parallel work.** Slice 5.4 (Activity, changelog, changelog sheet) runs in another change. It also
appends to the contract and raises `MIGRATED_FILE_FLOOR`, may take the next ADR number, and adds a
`CHANGELOG.md` entry; rebase conflicts on those three lines are expected and resolved by union.

## Goals / Non-Goals

**Goals:**

- Every 5.5 file passes the migrated-screen contract and leaves every ratchet allowlist, ceilings
  lowered in the same PR.
- The native title is the only route-level heading on all four routes, encoded in `PageIntro`'s type.
- The export guide loads on preprod once the backend owner flips the flag and uploads assets, with
  no further app change.

**Non-Goals:**

- Deleting the dormant group step (spec says that is its own cleanup).
- Changing journey logic, telemetry, retry semantics, copy or the visible Back button on the guide
  page.
- Changing the server, the feature-flag rows or bucket contents (owner actions, inbox).
- Making the blocking-error copy depend on the failure class ("Check your connection" is shown for
  a 503 too). Noted in the inbox, not done here.

## Decisions

### D1. `Thumbnail`: a design primitive for list-leading images (ADR)

**Decision.** Add `src/design/thumbnail/thumbnail.tsx`, exported from `@/design`:

```ts
type ThumbnailProps = {
  source: { light: string | undefined; dark?: string | undefined }
  size: "medium" | "large"            // 40 / 56, from a new ThumbnailSize token
  monogram?: string | undefined       // first grapheme shown when there is no image or it fails
  onError?: (() => void) | undefined
  testID: string                      // image: `${testID}`, monogram: `${testID}-monogram`
}
```

It resolves `dark ?? light` in dark scheme through `useColorScheme` (allowed in `src/design`),
draws the logo chip (`logoSurface`, `Radii.medium`, overflow hidden, 1-pt overshoot so artwork is
full-bleed without an Android sub-pixel gap) with a `separator` hairline ring overlaid above the
image, and the fallback as `primarySoft` with the letter in `onPrimarySoft` on the `headline` step
with `allowFontScaling={false}` (fixed leading box; decorative). It keeps the failed URI in state
and compares it to the resolved URI, so a scheme or source change retries without the caller's
`key` remount (`school-row.tsx:22-23` today). The whole tile is hidden from assistive technology:
`ListRow` already hides leading elements and names the row.

School rows use `size="medium"` + `monogram`; provider rows use `size="large"` without monogram and
keep their own failed-image subtitle (`provider-selection-screen.tsx:140-171`) through `onError`.

**Alternatives.** (a) Keep `school-logo.tsx` in the feature and add it to the contract with an
exemption: the contract has no exemptions and the file is exactly the drift the slice removes.
(b) A `ListRow` `leading: { image }` variant: couples row geometry to image loading and failure
state, and the guide page image (not a row) could not share it later. (c) `tone="action"` for the
monogram: `actionText` on the pink wash is not a documented pair; `onPrimarySoft` is
(`tokens.ts:111-116`, 5.79:1). The `mobile-a11y` scenario permits `primary` but does not require it.

**Why ADR.** It is a new member of the primitive catalog that every future image-led row (calendar
sources, school header on Home) is expected to use. Take the next free number in
`docs/mobile/architecture-book/decisions/` at implementation time (079 unless 5.4 took it).

### D2. `ListRow` `expanded`: disclosure as a row state

**Decision.** Extend `ListRowAction` with an exclusive disclosure variant:

```ts
type ListRowAction =
  | { hint?; selected?; disabled?; trailing?: "chevron"; expanded?: never }
  | { hint?; disabled?; expanded: boolean; selected?: never; trailing?: never }
```

An `expanded` row draws a trailing disclosure glyph on both platforms with the size, color and
text-scaling cap of the existing iOS `DisclosureChevron` (`list-row.tsx:441`), testID
`${testID}-disclosure`: iOS `chevron.down` when expanded, `chevron.right` when collapsed; Android
`expand_less` / `expand_more`. Generalize `DisclosureChevron` to take the glyph rather than adding a
second component.
It reports `accessibilityState={{ expanded, disabled }}` and no `selected`. `expand_more` (0xe5cf)
and `expand_less` (0xe5ce) join `MATERIAL_GLYPHS`; `icon.test.tsx` pins their codepoints against the
font table (verify the values there, do not trust these).

**Alternatives.** (a) Always-expanded `ListSection` per branch: removes behaviour from a step the
spec freezes. (b) Drill-down push per branch: a new route and shared selection state for a dormant
step. (c) Keep the feature `Pressable`: the raw-button rule forbids it and it is the allowlisted file.

### D3. Group picker composition

One `ListSection` per tree level. `GroupLevel({ nodes })` renders a `ListSection` with one `ListRow`
per node: a leaf is `selected={isSelected}` + `onPress` toggle, `accessibilityLabel`
`onboarding.group.nodeLabel`; a branch is `expanded={isExpanded}` + `onPress` toggle,
`accessibilityLabel` `onboarding.group.expandLabel`. After the section, each expanded branch of that
level renders its own `GroupLevel` with `ListSection title={branch.text}`. Expanded state moves from
per-node `useState` to a `Set<string>` in the screen, so sections can be emitted at the level that
owns them. `ListSection` assigns row positions (`list-section.tsx:46-53`), so rows must be its
direct children; this is why the tree is not rendered recursively inside one section.

Confirm is `Button variant="filled" testID="onboarding-group-confirm" label={confirm}
accessibilityLabel={confirmLabel}`; `hitSlop` and the 48 literals go. The action region keeps
`View style={[laneStyle, styles.actions]}` with `FieldError` above the button. TestIDs
`onboarding-group-leaf-<value>`, `onboarding-group-branch-<value>`, `onboarding-group-*` states and
all translation keys are unchanged. The `mobile-school-selection` dormant requirement is modified to
allow presentation-only change (the colocated test may change only where it asserts presentation).

### D4. `PageIntro` is caption-only, by type (R-1)

`theming.md:521` and `accessibility.md:198-200` already say `PageIntro` contains caption text only.
Provider selection is the last feature caller passing `title`. Remove `title` from
`PageIntroProps`; `caption` becomes required (a `PageIntro` with nothing renders nothing today,
`root-page.tsx:70`). The gallery fixtures (`root-page.gallery.tsx:16-19,46-49,64-68,82-86`,
`keyboard-safe-action-layout.gallery.tsx:72-75`) drop the title; `root-page.test.tsx:131-142`
("renders an optional heading") is replaced by a `@ts-expect-error` type test that `title` is
rejected. `gallery.rootPage.introTitle` and `exportGuide.provider.title` are deleted from both
locales if `rg` shows no other user. The rule is enforced by `tsc`.

**Alternative.** A lint rule banning the `title` prop: weaker than removing it.

### D5. Guide page: page title in the native header

**Decision.** While a valid page renders, `Stack.Screen options.title` is `page.title`; the loading
and blocked states keep `exportGuide.page.title`. The in-body heading is removed. The focus target
(`heading` ref, `:50`, `:165-166`) becomes the progress caption View: `accessible`,
`accessibilityLabel` = `"<page.title>, <progress>"`, no header role (the native title is the
heading), `ThemedText tone="secondary"` showing only the progress text. Description, image, Next and
visible Back follow unchanged.

**Why.** The user directive and the roadmap row ask for the navigation title (HIG: a pushed step's
title names it; Material 3: the top app bar title names the destination). Page titles are short
(longest catalogue title "Sélectionnez toutes les semaines", 32 characters,
`initial-export-guide-catalogue.ts:152`), so the compact bar fits them. Programmatic focus skips the
native title, so the caption's name carries the title once.

**Alternatives.** (a) Keep an in-body content heading at `title2`: `accessibility.md:200` would allow
it as domain content, but it duplicates the purpose of the bar and the roadmap row removes it.
(b) Drop the programmatic focus and rely on the native push focus: VoiceOver and TalkBack differ on
what receives focus after a push; the existing spec requires a deterministic focus.

### D6. `tone` replaces `themeColor`

`guide-page-screen.tsx:246` and `export-guide-image.tsx:39,53` take `tone="secondary"`. No other
color change.

### D7. Ratchets and contract

Delete `raw-button-allowlist.js:10` and lower `RAW_BUTTON_ALLOWLIST_CEILING` 5 → 4; delete
`style-literal-allowlist.js:53-56` and lower `typographyLiteral` 7 → 6. Append to
`MIGRATED_SCREENS`:

```
{ slice: "5.5", files: [
  "src/app/onboarding/school.tsx",
  "src/app/onboarding/groups.tsx",
  "src/app/onboarding/export-guide/providers.tsx",
  "src/app/onboarding/export-guide/[pageIndex].tsx",
  "src/features/school-selection/ui/school-picker-screen.tsx",
  "src/features/school-selection/ui/school-row.tsx",
  "src/features/school-selection/ui/school-group-picker-screen.tsx",
  "src/features/export-guides/ui/provider-selection-screen.tsx",
  "src/features/export-guides/ui/guide-page-screen.tsx",
  "src/features/export-guides/ui/guide-status.tsx",
  "src/features/export-guides/ui/export-guide-image.tsx",
] }
```

and raise `MIGRATED_FILE_FLOOR` 23 → 34 (plus 5.4's count if it merged first). Route-file comments
are reduced to present tense (`school.tsx:1-5` narrates history).

### D8. Export guide on preprod: root cause and fix

**Request.** `GuidePageScreen` page 0 with a listed draft calls `useExportGuideLoad`
(`guide-page-screen.tsx:101-117`) → coordinator (`coordinator.ts:40-58`) → repository
(`repository.ts:127-141`) → `GET {PREPROD_API_URL}/v1/export-guides?locale=<en|fr>&clientSchema=1&catalogueVersion=2026-09-07.1`
(`backend-environment.ts:13`, generated URL `api/generated/export-guides/export-guides.ts:88`;
`catalogueVersion` from the school's `exportGuide` reference in `/schools`).

**Observed (read-only, 2026-10-27).**

| Probe | Result |
| --- | --- |
| `GET https://preprod-api.timecalendar.app/v1/export-guides?locale=en&clientSchema=1` (also `fr`, also with `catalogueVersion=2026-09-07.1`) | `503 {"message":"Export guide catalogue unavailable"}` |
| same on `https://api-v2.timecalendar.app` | `503`, same body |
| `GET https://preprod-api.timecalendar.app/feature-flags/evaluate?keys=export-guides-v1` | `{"export-guides-v1":false}` (production: same) |
| `GET https://preprod-api.timecalendar.app/schools` | 200; both schools carry `exportGuide.catalogueVersion "2026-09-07.1"`; logo origin `https://timecalendar-preprod-public.fra1.digitaloceanspaces.com` |
| `GET https://api-v2.timecalendar.app/schools` | 200; logo origin `https://timecalendar-public.fra1.digitaloceanspaces.com` |
| `HEAD <bucket>/export-guides/2026-09-07.1/en/ade/groups.png` | dev 200; preprod 403; production 403 |

**Cause 1, backend config.** `ExportGuideService.get` throws `ServiceUnavailableException` when the
flag is off (`export-guide.service.ts:42-53`). `/schools` works, and it depends on the export-guide
snapshot (inbox `2026-10-26-export-guide-bootstrap-empty-schema.md`), so the catalogue store is
populated and the flag is the 503 source. The app maps the 503 to `http`
(`repository.ts:226`), no LKG exists, and the journey blocks. The app behaves as specified. The
flag is a database row (`database-feature-flag.provider.ts`; only the test fixtures
`feature-flag.fixtures.yml` seed it `enabled: true`). Enabling it and uploading the assets are
owner actions: inbox note.

**Cause 2, app bug.** `EXPORT_GUIDE_ASSET_ORIGINS` holds only the dev bucket (`constants.ts:5-7`);
`parseImage` fails the declaration for any other origin (`parser.ts:89-102`), which invalidates
every provider including Generic and blocks the catalogue. The server builds image URLs from
`S3_PUBLIC_BUCKET_CLIENT_URL` (`initial-export-guide-catalogue.ts:35,45`,
`export-guide-url-policy.ts:9-11`). Preprod and production serve school logos from their own
buckets; we infer (unverified: the values live in the platform repo) that their
`S3_PUBLIC_BUCKET_CLIENT_URL` is the same bucket. **Fix:** the compiled list becomes
`[dev, preprod, production]` public-bucket origins. Exact origins, HTTPS, no wildcard, still a
compiled first-party set (spec `mobile-export-guide-data` → image declarations).

**Alternatives.** (a) Origin per backend environment: stricter, but the parser would need runtime
environment plumbing into a pure data module for no gain; all three buckets are team-owned. (b) Let
the server-reported origin be trusted: defeats the client boundary.

The blocking state already uses `StatusView` with Retry and Back; it stays.

## Risks / Trade-offs

- [Preprod/production `S3_PUBLIC_BUCKET_CLIENT_URL` differs from the logo bucket] → the inbox note
  asks the owner to confirm; a wrong guess still blocks with the same error and the parser test
  names the accepted list.
- [Removing `PageIntro.title` breaks a caller added by slice 5.4 in parallel] → `tsc` catches it at
  rebase; 5.4's screens have no `PageIntro` title today (`rg` in task 0).
- [Page title truncates in the compact bar on narrow devices at large text] → titles are ≤ 32
  characters; the focus caption carries the full title to screen readers; device pass in the inbox.
- [Merge conflict with 5.4 on the contract floor, ADR number and CHANGELOG head] → union on rebase.
- [`Thumbnail` monogram does not scale with text] → it is decorative, the row label scales; same
  rationale as `ColorDot`.

## Migration Plan

One PR, three commits: (1) design layer (`Thumbnail`, `ListRow` `expanded`, `PageIntro` caption-only,
glyphs, galleries, tests); (2) screens, export-guide origins, ratchets, contract; (3) Book, ADR,
CHANGELOG, inbox. Rollback is a revert; nothing is persisted or migrated.
