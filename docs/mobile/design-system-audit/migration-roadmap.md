# Migration roadmap

Date: 2026-10-25. Status: **proposal**. Sequence: defect fixes → tokens → gallery → primitives
(each with fixture + test) → lint ratchet → screen-by-screen migration → calendar last.

Every slice below is a vertical, shippable PR that passes
[definition-of-done.md](../architecture-book/definition-of-done.md): `tsc`, lint (zero warnings),
`npm test -- --coverage` (90% logic / 70% global, per-file branch gate), FR/EN parity, a device
pass in both schemes on iOS and Android, and an Architecture Book + CHANGELOG update when a rule
changes. Android device passes run on the Windows host (`ssh pc`), never on the Mac.

Sizing: **S** ≈ one PR, < 1 day; **M** ≈ one PR, 1–3 days; **L** ≈ 2–3 PRs.

## Phase 0 — Audit (this PR)

Docs only. Owner approves the proposal, answers the open questions in [README.md](./README.md),
and the ADRs below are scheduled.

## Phase 1 — Defects and tokens (no visual redesign)

Fix what is broken before building on it; these do not wait for the DS.

| Slice | Size | Content | Proof |
| --- | --- | --- | --- |
| 1.1 Android time picking | S | `DateTimeField` on Android opens date then time dialogs (`date-time-field.tsx:72-83`) | Jest: Android branch commits date+time; device pass on Android |
| 1.2 Brand text contrast | S | 8 `themeColor="primary"` label sites → `actionText` ([assessment §3](./assessment.md#issues-ranked-by-impact)) | Jest asserts token; light-scheme device pass |
| 1.3 Android status symbol + env picker | S | `StatusSymbol` gets a Material icon; environment `Alert` → `NativeListRadioDialog` / menu | Jest Android branch; device pass |
| 1.4 Token additions | S | `Spacing.twoHalf/fiveHalf`, `MinTouchTarget`, `IconSize`, `StateOpacity`, `Elevation`, `Motion`, `Layout.fabClearance`, colors `outline`, `scrim` with AA pairs documented in `tokens.ts` | `theme.test.tsx` light/dark values; contrast pairs computed |
| 1.5 Type ramp | M | `src/theme/typography.ts` platform ramp; `ThemedText` gains new variants and `tone`; old names alias; heading-role contract extended | `themed-text.test.tsx` per variant role; iOS+Android device check of sizes at default and AX5 text |
| 1.6 L1 + L8 lint | S | Ban `useColorScheme`/`Appearance` from `react-native`; ban `allowFontScaling={false}` | Inject-and-revert evidence in PR |

## Phase 2 — Gallery (the catalog)

| Slice | Size | Content | Proof |
| --- | --- | --- | --- |
| 2.1 Gallery shell | M | `src/gallery/{types,registry}.ts`, `features/gallery/ui`, `/gallery` + `/gallery/[story]` routes; `/settings-gallery` redirects; existing native-settings fixtures move to `native-settings.gallery.tsx` ([storybook-options.md wiring](./storybook-options.md#wiring-sketch)) | Registry orphan test; light/dark render test; production redirect test; no-Storybook-dependency contract test; unchanged fingerprint for four lanes recorded |
| 2.2 Fixtures for existing primitives | M | `RootPage`/`PageIntro`, `EmptyState`, error surfaces, `PrimaryAction`, `KeyboardSafeActionLayout`, numeric editor, text-entry dialog, `GlassSurface`, `MenuView`, `DateTimePicker`, typography ramp page, color/token swatch page | L10 contract test starts enforcing for `components/**` |

## Phase 3 — Primitives (each: component + fixture + test + Book entry)

Order by number of duplicates removed and by which screens they unblock.

| Slice | Size | Primitive | Unblocks |
| --- | --- | --- | --- |
| 3.1 | M | `Button` family (`PrimaryAction` becomes the `filled` alias; fix `style`-merges-first) | Onboarding, changelog, personal events, hidden events, export guides |
| 3.2 | S | `Icon` (SF/Material pair table, extending `native-settings-icons.ts`) | Button icons, header actions, checklist glyphs |
| 3.3 | M | `StatusView` (+ `EmptyState`/`ErrorState` aliases) | School selection, export guides, calendar-sources, event details, timezone chooser |
| 3.4 | M | `TextField` (+ `outline` token) | Onboarding, feedback, iCal URL, personal events, checklist |
| 3.5 | M | Rename seam to `NativeList*` with aliases; move `SettingsRow`/`SettingsSection` consumers (about, environment) to it; delete the adapters | About, environment |
| 3.6 | L | `ListRow` / `ListSection` / `Separator` (platform-adaptive, matched to seam geometry in the gallery side by side) | Timezone chooser, school picker, hidden events, activity, personal events, provider selection, group picker |
| 3.7 | S | `Badge`, `ColorDot` | Header pill, checklist pill, personal events, Home dots |
| 3.8 | M | `HeaderAction` + `FloatingAction` in chrome | Home, calendar, programme, event details, changelog sheet |
| 3.9 | M | `EventSurface` (after owner decision on agenda rail, ADR) | Home, event details, agenda |

## Phase 4 — Lint ratchet

| Slice | Size | Content |
| --- | --- | --- |
| 4.1 | M | `local/no-style-literals` rule (colors, typography, shadows, spacing/radius) with RuleTester tests |
| 4.2 | S | L2–L4 bans with generated per-file allowlist; "allowlist only shrinks" test |
| 4.3 | S | L9: remove deprecated `ThemedText` variant names and `themeColor` once unused (type-level) |

From here on each migration slice deletes its files from the allowlist in the same PR.

## Phase 5 — Screen migration (ordered by value ÷ risk)

Each row is one slice: migrate the screen to primitives, remove it from the ratchet allowlist,
pass the scoped audit greps clean, device pass in both schemes and platforms, update Maestro
selectors if any changed.

| Order | Screens | Why here | Size |
| --- | --- | --- | --- |
| 5.1 | Onboarding welcome, connect, manual import | First-run impression; 3 hand-rolled CTAs + outlined buttons; low data risk | M |
| 5.2 | Institution name, programme, iCal URL, feedback | Already exemplary; only `TextField` + `Button` swap — quick proof of the system | S |
| 5.3 | Hidden events, personal events list, personal event form | Card rows → `ListRow`; destructive button; settings-adjacent | M |
| 5.4 | Activity, changelog, changelog sheet | Section headers on new ramp; status states; header Close via `HeaderAction` | M |
| 5.5 | School picker, group picker, provider selection, guide page | `ListRow`, `StatusView`, remove 48px in-body title | M |
| 5.6 | Timezone chooser | `ListRow` inside its single `FlatList`; adds `RootPage`-equivalent insets | S |
| 5.7 | QR scan, import result, user calendars, dev-import | Outlined QR button; mostly done | S |
| 5.8 | Event details (+ event-checklists UI) | `TagBubble` → `Badge`/`EventSurface`; unicode icons → `Icon`; title on ramp | M |
| 5.9 | Home | 36 raw elements; own type scale; FAB → `FloatingAction`; cards → `EventSurface`. High visibility, wait until primitives are proven | L |
| 5.10 | Calendar **screen chrome only** | Header icons via `HeaderAction` (not pink), FAB, custom `Modal` chooser → native menu/sheet, status views. **Renderer untouched** (ADR 033 boundary) | M |
| 5.11 | Calendar renderer tiles (optional) | Only `EventSurface` color resolution if the ADR decides agenda/grid share it; worklet rules apply; separate review | M |

Paging spike: out of scope; delete or keep as-is (owner call), excluded from the ratchet.

## Phase 6 — Close-out

- Re-run the drift audit greps; record the per-category scores (escapes per 100 SLOC, expo audit
  rubric) in this folder. They must fall monotonically per phase.
- Fold the stable rules into `theming.md` / `accessibility.md` / `lint-format.md`; this folder
  becomes exploration history, like `docs/mobile/ota/`.

## ADRs to write

| # | Title | Phase | Why it is ADR-worthy |
| --- | --- | --- | --- |
| A | Design-system layer: `components/` barrel as the single primitive home, `chrome/` boundary rule, gallery as the catalog | 0/2 | Sets where every future UI part lives; reverses nothing but is costly to move later |
| B | Platform-resolved type ramp in `theme/typography.ts` | 1 | Changes every text style; amends accessibility.md heading contract |
| C | In-house CSF3-shaped gallery instead of Storybook (gate choice, i18n exemption, Storybook revisit triggers) | 2 | Rejects a dependency with native/fingerprint impact; records triggers |
| D | Rename native-settings seam to `NativeList*` and retire `SettingsRow` adapters | 3 | Amends ADR 060 |
| E | Visual-style lint ratchet (`local/no-style-literals`, raw-primitive bans) | 4 | New repo-wide gate with allowlist mechanics |
| F | Event-color surface vocabulary (agenda rail vs wash; text on data colors) | 3.9 | Product-visual decision that theming.md currently forbids in part |
| G (optional) | Visual regression lane (Maestro `assertScreenshot` over gallery deep links) | after 2 | Amends ADR 057 three-journey budget |
