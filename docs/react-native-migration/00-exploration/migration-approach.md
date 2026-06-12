# TimeCalendar → React Native: migration approach

> **This is the meta-plan: *how* we run the migration, not the migration plan itself.** It defines our philosophy, the artifacts we maintain, the Definition of Done, the phase sequence, and the working rules. It is a **living document** — see [§7 Changing the rules](#7-changing-the-rules).
>
> Companion docs: [`reference-stack-grounded.md`](./reference-stack-grounded.md) (what we build with), [`perplexity-research.md`](./perplexity-research.md) (generic baseline).
>
> Status: exploration / approved direction.

---

## 1. Philosophy

We are rebuilding a mature app. The old one works. So our only justification for the rewrite is to do it **excellently** — and excellence is set by the *foundation*, because everything else is built on top of it and copies it.

1. **Vertical slices, not horizontal layers.** We ship one small feature fully through every layer (UI → data → storage → i18n → a11y → tests → e2e → observability → analytics) before starting the next. No "build all the data layer first."
2. **Foundation quality compounds.** A sloppy cross-cutting choice made early metastasizes across every feature built after it. We pay the quality cost up front, while it's cheap.
3. **No concessions — but perfection is *finite*.** "Perfect" is not a feeling; it's the [Definition of Done checklist](#5-definition-of-done-dod) fully satisfied. A feature is done when every box is checked or explicitly marked N/A. This makes "no workarounds" *bounded* instead of an infinite black hole.
4. **Document by default; encode where possible.** Decisions, rules, and the *reasons* behind them are written down. Wherever a rule *can* be enforced by tooling (ESLint, types, CI), it **must** be — prose rules rot, executable rules don't.
5. **Earn the pattern; don't freeze it on feature #1.** The first feature is when we know the *least*. We extract our golden-path pattern over the first few features, then harden it — we do not declare it from a sample size of one.
6. **Platform-appropriate UX is the goal. Small team is not an excuse for lowest-common-denominator.** We will not restrict ourselves to a single shared UX just because we're a small team. Where the iOS and Android idioms genuinely differ, we build two layouts. (Cost-discipline in [Rule R-2](#6-working-rules-seed-of-the-architecture-book).)

The visible result for users: a faster app, real native components instead of Flutter rendering, better accessibility, platform-correct feel. **The reference for "correct" is the platform — not the old Flutter UI.** Users *will* see visual change; that's the upgrade, by design.

---

## 2. The artifacts we maintain

Five living artifacts. Each has an owner-of-record (us) and a clear trigger for updating.

| Artifact | What it is | Updated when |
| --- | --- | --- |
| **Architecture Book** (**`.claude/rules/mobile/`** — that directory IS the book) | The living set of rules that drive development — only rules that *can't* be encoded in tooling. | A new load-bearing pattern is established or changed. |
| **ADR log** (`decisions/NNN-*.md`) | One short record per architectural decision: context, choice, alternatives, "revisit if…". | Any load-bearing decision is made (see triage, [R-4](#6-working-rules-seed-of-the-architecture-book)). |
| **Definition of Done** (`definition-of-done.md`) | The per-feature checklist below. | We add/remove a quality axis. |
| **Rule changelog** (`architecture-changelog.md`) | The meta-doc: a dated log of *every change to the rules*, with why. **The act of documenting is itself documented here.** | The Architecture Book or DoD changes. |
| **Golden-path exemplar** | The reference feature others copy, + scaffolding. | Hardened after Phase 1 ([§4](#4-phases)). |

**Executable rules live in code, not here:** ESLint config (incl. **mandatory custom rules** — no hardcoded strings, a11y props on touchables, no direct `@react-navigation/*` imports, enforced import boundaries, etc.), `tsconfig` strict flags, CI gates, codegen. The Architecture Book documents only what tooling can't express, and links to the lint rule that enforces each rule that *can* be.

---

## 3. What "the foundation" includes (must exist before feature work)

Wired and *green in CI* before we build real features:

- `mobile/` exists as a **standalone npm project** (own lockfile, sibling of `server/` and `app/` — *not* a root-workspace member; revised at scaffold time: Expo's exact `react` pin conflicts permanently with Next's floating range under npm hoisting, see the scaffold change's design D7); Orval generates an RN-owned client from the OpenAPI spec file.
- EAS Build/Submit/Update + `expo-dev-client`; app installs on a real device.
- TypeScript strict; ESLint 9 + Prettier + **the first custom lint rules**; pre-commit + CI enforcement.
- Test harness: Jest + RNTL green; **Maestro e2e green on both iOS and Android**.
- i18n framework wired (FR + EN), with the no-hardcoded-strings lint rule live.
- a11y lint rules live.
- Firebase (`@react-native-firebase/*`): Crashlytics + Analytics reporting verified end-to-end.
- Design tokens + theming baseline; the native-chrome wrappers (Expo UI / native tabs) stubbed behind our own abstractions.
- Local storage seams: MMKV + expo-sqlite/Drizzle initialized with a migration runner.
- The five artifacts in [§2](#2-the-artifacts-we-maintain) created (even if mostly empty).

---

## 4. Phases

### Phase 0 — Walking skeleton (the splash screen + setup)
**Not a feature — the codebase coming alive.** Everything in [§3](#3-what-the-foundation-includes-must-exist-before-feature-work), plus the **splash screen** taken pixel-perfect / native-correct through *every* DoD axis. It's deliberately trivial so the polish we do *is* the foundation, not feature-fighting. Exit criteria: app builds, ships to device via EAS, splash passes the full DoD on both platforms, all five artifacts exist, CI is green.

### Phase 1 — Three deliberately-varied features
Chosen to stress **different architectural axes** so the pattern is validated against variety before we bless it. Explicitly **not the calendar.**
1. **Settings** — local prefs (MMKV), simple native controls, i18n surface.
2. **A device-local CRUD feature** (e.g. hidden events or personal events) — Drizzle/SQLite, offline writes, list rendering.
3. **A server-data read flow** (e.g. school selection / onboarding) — TanStack Query, sync, offline cache, nested navigation.

Each one passes the full DoD. Every novel decision → ADR. Every new rule → Architecture Book + changelog.

### Phase 1.5 — Harden the template
Extract the **golden-path exemplar** and reusable scaffolding from what features 1–3 taught us. *This* is when the pattern is frozen-enough to copy — earned, not declared. Update the Architecture Book to reflect reality.

### Phase 2+ — The hard surfaces
The calendar timeline (custom; see stack doc §8) and the assistant webview, built on a *validated* foundation, following the proven template. De-risk the calendar with a time-boxed read-only spike before committing to custom vs. library.

> **Accepted tradeoff (documented, not hidden):** this approach is deliberately slow, and the Flutter app keeps needing maintenance across a long runway — two live codebases for a while. That's a conscious choice. We keep a *loose* internal parity marker and a rule on how much energy Flutter maintenance gets during the migration ([R-5](#6-working-rules-seed-of-the-architecture-book)).

---

## 5. Definition of Done (DoD)

A feature is **done** when every item is **✅ Done** or **➖ N/A + one-line reason**. No third state. ("N/A with a reason" is what keeps the checklist honest and finite — we don't fire a pointless analytics event just to tick a box.)

- [ ] **Architecture** — follows the Architecture Book; novel decisions recorded as ADRs; respects import/module boundaries.
- [ ] **Types** — zero LSP/type errors; no `any` escapes without justification.
- [ ] **Lint** — passes ESLint incl. all custom rules; Prettier clean.
- [ ] **Unit/component tests** — meaningful coverage of logic and component behavior; green.
- [ ] **E2E** — at least one Maestro happy-path flow (+ key edge cases) **on iOS and Android**.
- [ ] **i18n** — zero hardcoded strings (lint-enforced); FR + EN complete.
- [ ] **Accessibility** — a11y props on interactive elements; passes a11y lint; **manual VoiceOver + TalkBack pass**; large-font / dynamic-type check.
- [ ] **Native correctness** — uses the correct iOS/Android idioms; graceful degradation (e.g. Liquid Glass below iOS 26); both platforms visually reviewed against the *platform*, not the old Flutter app.
- [ ] **Performance** — within budget; no jank on a low-end Android device; Reassure baseline for interaction-heavy screens.
- [ ] **Observability** — errors reach Crashlytics; key actions logged; no PII leakage.
- [ ] **Product analytics** — meaningful events defined, fired, and verified.
- [ ] **Documentation** — reusable patterns documented; ADR added if architectural; **Rule changelog updated if any rule changed**.

---

## 6. Working rules (seed of the Architecture Book)

The first entries of the living book. Each will, where possible, be backed by a custom ESLint rule or CI gate.

- **R-1 — Encode before you document.** If a rule can be a lint rule, a type, or a CI gate, it must be — prose is the last resort. Every prose rule links to its enforcing rule (or notes "not encodable, why").
- **R-2 — Platform-appropriate by intent, shared by convenience, never LCD by laziness.** Default to shared implementation when the iOS/Android idioms align. Diverge into two layouts when they genuinely differ (chrome, navigation, system controls) — and the ADR states why. We do **not** ship a lowest-common-denominator UX to save effort. We also do **not** over-abstract on speculative divergence: build shared until divergence is real, then split via composition.
- **R-3 — The platform is the design reference, not the Flutter app.** Visual change is expected and intended.
- **R-4 — Blockage triage.** When blocked, classify: **load-bearing** (affects patterns reused across features) → deep-dive + ADR + Architecture Book; **leaf** (local bug/one-off) → fix locally, no ceremony. Don't architecturally over-invest in leaf problems; don't workaround load-bearing ones.
- **R-5 — Bounded Flutter maintenance during migration.** The Flutter app gets security/critical fixes only; no new features. (Revisit if the runway extends materially.)
- **R-6 — No feature starts until the previous one is DoD-complete.** Quality gate is serial by design in Phases 0–1.

---

## 7. Changing the rules

The book is **living, not graved.** Changing it is a first-class, documented action:

1. Propose the change (what rule, why, what it replaces).
2. If load-bearing, write/_update_ an ADR.
3. Update the Architecture Book (and the enforcing lint rule, per R-1).
4. **Append a dated entry to the Rule changelog** explaining the change and its reason — *the act of changing the rules is itself recorded.*

We *expect* to revise. Seeing a pattern fail and correcting it is success, not failure — the whole point of earning patterns over Phases 0–1.5 rather than freezing them on day one.

---

## 8. Resolved knobs (Phase 0 kickoff decisions)

These are decided. Each is a proto-ADR (becomes a real ADR when `mobile` is scaffolded). Format: **decision · why · revisit if**.

### K-1 — SDK target: latest **stable** Expo SDK at scaffold time
- **Decision:** Scaffold on the latest *stable* SDK. If **SDK 56** is stable by then, use it; otherwise start on **SDK 55** and treat the SDK 56 upgrade as a tracked ADR that **must land before Phase 2** (calendar / Expo UI GA).
- **Why:** A solid foundation must not sit on a beta SDK — that violates our own no-concessions principle. SDK 55 already gives New Arch + Hermes, native tabs (alpha, 54+), and `expo-glass-effect`, which is enough for Phases 0–1. SDK 56 GAs Expo UI (SwiftUI/Compose), which matters most for the *calendar* and rich native chrome in Phase 2.
- **Revisit if:** SDK 56 ships stable before Phase 0 completes → start directly on 56 and skip the interim upgrade.

### K-2 — Minimum OS: **iOS 15.1**, **Android API 24 (7.0)**
- **Decision:** iOS 15.1 floor, Android `minSdk 24`. Liquid Glass degradation baseline: **iOS 15.1–25 → non-glass fallback** (blur/solid surfaces), **iOS 26+ → Liquid Glass**. Android uses Material 3 throughout.
- **Why:** Matches Expo's own minimums and barely moves from Flutter (iOS 15.0→15.1 loses ~no devices; Android effective floor was ~API 23 via Firebase, so API 24 drops only Android 6.0, a sub-1% sliver in 2026). No meaningful user regression.
- **Revisit if:** analytics show a non-trivial install base below these floors, or a chosen SDK raises its own minimum.
- **⚠️ Revisit fired (2026-06-12, scaffold time):** Expo SDK 56's own minimum iOS deployment target is **16.4** (> 15.1), so the **effective floors are iOS 16.4 / Android API 24** (Android unchanged; SDK 56's Android minimum is 21). Practical impact: devices capped at iOS 15.x (iPhone 6s/7/SE 1st gen class) fall below the floor. The Liquid Glass degradation baseline becomes **iOS 16.4–25 → non-glass fallback**. Recorded in the Architecture Book; check install-base analytics before release if this sliver matters.

### K-3 — Coverage: **90% on logic, 70% global floor**, CI-enforced
- **Decision:** Per-path Jest `coverageThreshold`: **90% lines+branches** on domain/logic (hooks, stores, `db`/Drizzle, mappers, utils); **70% global** floor; presentational components covered by **RNTL behavior tests** but exempt from the 90% gate. CI fails below threshold.
- **Why:** Put the high bar where bugs actually hide (logic), not in chasing a vanity percentage across UI glue. Finite and enforceable — fits R-1.
- **Revisit if:** the 90% gate starts driving cargo-cult tests rather than catching real regressions.

### K-4 — Phase 1 feature order: **Settings → Personal events → School selection**
- **Decision:** (1) **Settings** — MMKV prefs, native controls, i18n surface. (2) **Personal events** — device-local CRUD: Drizzle/SQLite, forms, native date/time pickers. (3) **School selection / onboarding** — TanStack Query server read, offline cache, nested navigation.
- **Why:** Ascending complexity; each feature adds exactly **one** new architectural axis, so a failing pattern is easy to attribute. Personal events is chosen over hidden events for the CRUD slot because it's **self-contained** (user creates from scratch; doesn't depend on synced events existing — its calendar overlay lands in Phase 2 via a clean seam).
- **Revisit if:** a dependency forces a different order, or one feature proves too thin to exercise its axis.

### K-5 — Calendar spike: **first task of Phase 2, time-boxed 3 working days**
- **Decision:** Open Phase 2 with a **3-day** read-only spike rendering a real dense university week on `@howljs/calendar-kit` v2 (our brand styling, overlaps, 120fps target). Decision gate at the end: **adopt / fork / build custom**. Optional lightweight pre-read during Phase 1.5 if there's slack.
- **Why:** Highest-uncertainty item in the whole migration; de-risk with a bounded experiment before committing to the (likely) custom build.
- **Revisit if:** the spike clearly succeeds or fails early — end it early either way.
</content>
