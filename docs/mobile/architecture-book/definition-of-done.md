# Definition of Done — TimeCalendar mobile

One of the [five living artifacts](./architecture.md#the-five-living-artifacts).
The per-feature finite-perfection checklist (migration-approach §5) — the gate every
feature passes before the next one starts (R-6, serial in Phases 0–1).

This is itself a living artifact: when a quality axis is added or removed, change it
here and append a [Rule changelog](./architecture-changelog.md) entry.

## The one rule that keeps it honest

A feature is **done** when every axis below is **✅ Done** or **➖ N/A + one-line
reason**. **No third state** — no "mostly", no "later", no silent skip. "N/A with a
reason" is what keeps the checklist finite: we don't fire a pointless analytics
event just to tick a box, but we *do* have to say so and why. The reason is the
audit trail.

The spine is migration-approach §5 verbatim; each axis below carries the concrete
obligations the Architecture Book sections defer here, each **pointing at** its
owning section or live gate (R-1) rather than re-deriving it.

## The axes

- [ ] **Architecture** — follows the [Architecture Book](./architecture.md); respects
  import/module boundaries; **novel decisions recorded as ADRs** in
  [`decisions/`](./decisions/README.md) (R-4 triage).
- [ ] **Types** — zero LSP/type errors (`npx tsc --noEmit` clean); no `any` escapes
  without justification. *Gate:* tsc, `test-mobile` job.
- [ ] **Lint** — passes ESLint incl. all custom rules; Prettier clean. *Gate:*
  `npm run lint` (`--max-warnings 0`), `test-mobile` job. (Rule inventory: Architecture
  Book "Lint & format".)
- [ ] **Unit/component tests** — meaningful coverage of logic and component behavior;
  green. **The K-3 `coverageThreshold` is enforced in CI** (90% on logic globs / 70%
  global floor; landed 2026-06-14, TIM-130) — logic sublayers must clear 90%,
  presentational screens the 70% floor. *Gate:* `npm test -- --coverage`, `test-mobile`
  job. See [ADR 003](./decisions/003-coverage-threshold.md) and the Architecture Book
  "Testing".
- [ ] **E2E** — at least one Maestro happy-path flow (+ key edge cases) **on iOS and
  Android**. *Gate:* `ci-mobile-e2e.yml` (on-demand; Architecture Book "E2E — Maestro").
- [ ] **i18n** — **zero hardcoded strings** (lint-enforced: `i18next/no-literal-string`),
  **FR + EN complete** (`tsc`-typed key parity, both directions). See Architecture Book
  "i18n".
- [ ] **Accessibility** — a11y props on interactive elements; passes a11y lint. Plus
  the obligations lint **can't** encode (Architecture Book "Accessibility → What lint
  can't encode"):
  - **Manual VoiceOver + TalkBack pass** — focus order, grouping, announcement quality.
  - **Touch-target minimums** — 44pt iOS / 48dp Android on every interactive control.
  - **Dynamic Type / font scaling** — never `allowFontScaling={false}`; check at large
    font sizes.
  - **Color contrast** — against the theme tokens (owned jointly with theming, step 10).
  - **Reduced motion** — animations honor `AccessibilityInfo.isReduceMotionEnabled`.
    The **splash (step 13) inherits this by name** — it is the first animation.
- [ ] **Native correctness** — correct iOS/Android idioms; **the platform is the design
  reference, not the Flutter app** (R-3); graceful degradation — **Liquid Glass below
  iOS 26 → non-glass fallback (baseline iOS 16.4–25)**, see
  [ADR 002](./decisions/002-minimum-os.md); both platforms visually reviewed against the
  *platform*.
- [ ] **Performance** — within budget; no jank on a low-end Android device; Reassure
  baseline for interaction-heavy screens.
- [ ] **Observability** — errors reach **Crashlytics**; key actions logged; **no PII
  leakage**. Wired via the `@/firebase` seam (Architecture Book "Firebase").
- [ ] **Product analytics** — meaningful events defined, fired, and **verified
  on-device** (Firebase DebugView for the event, Crashlytics dashboard for crashes — the
  manual half CI can't assert; Architecture Book "Firebase → What CI proves vs. manual").
- [ ] **Documentation** — reusable patterns documented; **ADR added if architectural**
  ([`decisions/`](./decisions/README.md)); **[Rule changelog](./architecture-changelog.md)
  updated if any rule changed**.

## What this DoD deliberately does not have

- **No runner / no automation.** It is a human checklist by nature — its encodable axes
  already point at live gates (tsc / lint / Jest / coverage / e2e), and the rest (manual
  screen-reader passes, visual platform review) are irreducibly human. A "DoD runner"
  would be cargo-cult tooling. The absence is correct, not debt.
