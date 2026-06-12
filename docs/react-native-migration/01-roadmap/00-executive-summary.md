# TimeCalendar → React Native: development roadmap (executive summary)

> **What this is:** the progressive, end-to-end plan for *how we build the RN app* — every phase, in dependency order, from empty repo to store cutover. Rough by design; each phase gets a real task breakdown only when we reach it (we earn detail, we don't front-load it).
>
> **Reads on top of:** [`../00-exploration/migration-approach.md`](../00-exploration/migration-approach.md) (the method), [`reference-stack-grounded.md`](../00-exploration/reference-stack-grounded.md) (the stack), [`data-persistence-migration.md`](../00-exploration/data-persistence-migration.md) (the on-device data migration, already device-verified).
>
> Status: roadmap / approved direction. One file per phase: `01-…` through `10-…`.

---

## The shape of it

- **Solo**, so phases are **ordered by dependency with exit criteria — no time estimates.** A phase is done when every feature in it passes the [Definition of Done](../00-exploration/migration-approach.md#5-definition-of-done-dod). Sequential by design (R-6).
- **Clean cutover at full parity.** RN ships to production **once, replacing Flutter**, only when **all ~24 modules** are at parity. No staged public launch.
- **Therefore the runway to first user value is long — on purpose.** The mandatory mitigation: **we dogfood internal/TestFlight builds continuously from Phase 1 onward.** We are never building in the dark for months; we just don't *cut over* until parity. OTA can't help pre-launch, so internal distribution is our feedback loop.
- **Design reference:** native defaults (HIG / Material) for chrome; explicit designs only for **brand surfaces** (calendar, onboarding). "Native-correct," not "match the old Flutter pixels."
- **On-device data migration is a first-class phase** ([phase 09](./09-data-migration.md)), not an afterthought — there is **no server backup** for personal events / checklists / hidden events, so a migration bug = permanent user data loss.

## Phase map

| # | Phase | What it delivers | Key risk |
| --- | --- | --- | --- |
| **01** | [Foundation (walking skeleton)](./01-foundation.md) | Repo alive: monorepo, EAS, CI, lint + first custom rules, test + Maestro harness, i18n, Firebase, storage seams, the 5 living artifacts, **splash** through full DoD on both platforms. | Getting cross-cutting infra *right* (it's copied forever). |
| **02** | [Pattern establishment](./02-pattern-establishment.md) | The 3 deliberately-varied features (Settings → Personal events → School selection) + the **hardened golden-path template**. Earns the pattern. | Over-freezing a pattern too early. |
| **03** | [Onboarding & calendar sources](./03-onboarding-and-sources.md) | How users get a calendar: onboarding, add/select school, QR scan, iCal import → calendar tokens (= identity). | Identity-token persistence correctness. |
| **04** | [Calendar core](./04-calendar-core.md) | The heart: day/week/agenda timeline, sync, offline cache, event details (view), home. Opens with the **calendar spike**. | Custom dense-timeline at 120fps — the #1 risk. |
| **05** | [Personal data & interactions](./05-personal-data.md) | Personal events (full, incl. calendar overlay), hidden events, event checklists. | Local-first write correctness. |
| **06** | [Notifications](./06-notifications.md) | FCM push (via RNFirebase, server unchanged), subscription prefs, local reminders. | OEM throttling (unchanged from Flutter). |
| **07** | [Auxiliary features](./07-auxiliary-features.md) | Grades, activity, suggestions, profile, about, changelog, debug. | Low; volume of small screens. |
| **08** | [AI assistant](./08-assistant.md) | The assistant webview (server `@ai-sdk`). | The known local-dev cert/network gotcha. |
| **09** | [On-device data migration](./09-data-migration.md) | One-shot first-launch importer for the irreplaceable Flutter data. Built once all target schemas exist. | **Permanent data loss if wrong.** |
| **10** | [Parity, cutover & release](./10-parity-cutover-release.md) | Full DoD/parity sweep, Maestro parity suite, beta hardening, store cutover, OTA setup, monitoring, Flutter retirement. | The one-shot production cutover. |

## Cross-cutting (not phases — wired in Phase 01, enforced every phase via DoD)

i18n (FR+EN), accessibility, observability (Crashlytics), product analytics, performance budgets, native-correctness. These are **DoD checklist items on every feature**, not separate stages. The infra for them is stood up in Phase 01; thereafter they're non-optional per feature.

## Things deliberately pulled out of sequence

- **Calendar spike (de-risk):** the throwaway read-only render test ([K-5](../00-exploration/migration-approach.md#8-resolved-knobs-phase-0-kickoff-decisions)) can run as early as the end of **Phase 02**, decoupled from the full Phase 04 build — it's our single biggest unknown, so we look early.
- **Storage schema ↔ migration compatibility:** when we design the MMKV/SQLite schemas (Phases 02/03/05), we design them so the [Phase 09](./09-data-migration.md) importer can target them cleanly. The importer is *built* late; its *target shape* is considered early.
- **Android data-migration verification:** the one open item in the migration research (Android prefs backend + sembast path) should be confirmed on a real Android device before Phase 09, ideally during Phase 03 when we first touch storage on Android.

## What would make me say "slow down"

Nothing structurally — but two standing risks to watch: (1) the full-parity bar means **no user feedback until cutover**, so dogfooding discipline is the safety valve; (2) **Phase 04 (calendar) is load-bearing and uncertain** — if the spike says "custom," that single phase may dwarf several others. We treat its spike outcome as a potential roadmap-reshaping event, not a checkbox.
</content>
