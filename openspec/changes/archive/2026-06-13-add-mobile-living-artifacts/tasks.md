## 1. ADR log (`.claude/rules/mobile/decisions/`)

- [x] 1.1 Create `decisions/TEMPLATE.md`: the standard ADR shape — `# NNN — Title`, then
  `## Status` (Accepted / Superseded / with any fired revisit dated), `## Context`,
  `## Decision`, `## Consequences`, `## Revisit if`.
- [x] 1.2 Create `decisions/001-sdk-target.md` from K-1 (§8): decision (latest stable Expo
  SDK at scaffold; landed on SDK 56), why, and the **fired revisit** (SDK 56 stable before
  Phase 0 → scaffolded directly on 56, interim 55→56 upgrade skipped).
- [x] 1.3 Create `decisions/002-minimum-os.md` from K-2: iOS 15.1 / Android API 24 decision,
  why, and the **fired revisit** (SDK 56's own iOS minimum 16.4 prevails → effective floors
  iOS 16.4 / API 24; Liquid Glass baseline iOS 16.4–25 fallback).
- [x] 1.4 Create `decisions/003-coverage-threshold.md` from K-3: 90% logic / 70% global,
  CI-enforced; status notes the threshold is **deliberately unset today** (reported not
  gated) and is owned by the first logic feature (Settings); revisit clause (cargo-cult).
- [x] 1.5 Create `decisions/004-phase-1-feature-order.md` from K-4: Settings → Personal
  events → School selection, why (one new axis each), revisit clause.
- [x] 1.6 Create `decisions/005-calendar-spike.md` from K-5: 3-day read-only spike opens
  Phase 2, adopt/fork/build gate, revisit clause.
- [x] 1.7 Create `decisions/README.md`: index table (number · title · status · revisit
  trigger) of 001–005; the ADR process (mirror migration-approach §7); and a "pending lifts"
  note listing the change-local ADRs that live in their archived change and are lifted on
  next revision — notably `add-mobile-api-client`'s `adr-001-committed-spec-seam.md`
  (future ADR number, with a one-line pointer; not physically moved — design D2).

## 2. Definition of Done (`.claude/rules/mobile/definition-of-done.md`)

- [x] 2.1 Write the §5 checklist as the spine; state the **✅ Done / ➖ N/A + one-line reason /
  no third state** rule and that the DoD is itself a living artifact (changed when a quality
  axis is added/removed).
- [x] 2.2 Annotate each axis with the obligations existing book sections defer to the DoD,
  each **pointing at** its owning book section / live gate (R-1), not re-deriving it:
  a11y (manual VoiceOver/TalkBack, touch targets 44pt/48dp, Dynamic Type, contrast, reduced
  motion — name step 13/splash as the reduced-motion inheritor); coverage (K-3, set by the
  first logic feature; reported-not-gated today); observability/analytics (Crashlytics, key
  actions logged, no PII, events verified on-device via DebugView); native correctness
  (R-3, Liquid Glass iOS 16.4–25 fallback); i18n (FR+EN complete, lint-enforced strings).

## 3. Rule changelog (`.claude/rules/mobile/architecture-changelog.md`)

- [x] 3.1 Write the header (what it is, the §7 discipline: every rule change appends here)
  and seed dated, append-only entries (newest-last) for each prior rule era — scaffold,
  api-client, test-harness, lint-format, i18n, a11y, firebase — each: date · change · what
  rule moved · why · link to its Architecture Book section. Dates from the archived change
  dir names.
- [x] 3.2 Append this change's entry (the four living artifacts created; K-1…K-5 ADRs
  authored; the book gained its artifacts pointer section).

## 4. Golden-path placeholder (`.claude/rules/mobile/golden-path.md`)

- [x] 4.1 Write the honest signpost: exemplar is **earned in Phase 1.5** from features 1–3
  (§4, principle 5), not declared now; list the axes a future exemplar must demonstrate
  (folder layout, data/query seam, navigation, i18n/a11y wiring, test + e2e shape); point at
  today's closest references (`schools-screen`, the test/e2e harness); state it is not to be
  copied yet.

## 5. Architecture Book wiring (`.claude/rules/mobile/architecture.md`)

- [x] 5.1 Add a short `## The five living artifacts` section: list all five with a one-line
  role + relative link to each sibling (R-1 pointer style — link, don't duplicate).
- [x] 5.2 Resolve the existing forward-references in place: the data-layer "to be lifted into
  the `decisions/` log when the five-artifacts step creates it" → link `decisions/`; the
  i18n/a11y "owned by the DoD (roadmap step 12)" notes → link `definition-of-done.md`; the
  header's "five artifacts foundation step" / "Rule changelog" prose → point at the real
  files. No rule text changes — wiring only.

## 6. Roadmap

- [x] 6.1 Mark step 12 done in `docs/react-native-migration/01-roadmap/01-foundation.md`
  (mirror the prior steps' `✅ Done (add-mobile-living-artifacts) — …` annotation style).

## 7. Local verification (docs-only, but prove nothing broke)

- [x] 7.1 In `mobile/`: `npx tsc --noEmit` clean (no source touched — confirms the tree is
  still green).
- [x] 7.2 In `mobile/`: `npm run lint` clean with `--max-warnings 0`.
- [x] 7.3 In `mobile/`: `npm test` green (unchanged suite).
- [x] 7.4 **No CI proof test is applicable** — this is a pure-docs change with no runtime
  behavior to encode or prove (R-1: nothing here is encodable; the artifacts are human-read
  governance docs). Recorded explicitly so the implementer/reviewer do not look for one.

## 8. Validate

- [x] 8.1 `openspec validate add-mobile-living-artifacts` passes.
