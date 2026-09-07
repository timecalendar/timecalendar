# 04 — Flutter → React Native in-place upgrade QA playbook

> **What this proves:** a student who updates TimeCalendar in place — Flutter `3.1.0+134`
> replaced by the React Native `4.x` binary through TestFlight / the App Store or Google Play —
> **does not lose the work they created on their device**.
>
> **Audience:** a QA engineer. Every document here is executable without reading application
> code. Source references are given so a finding can be escalated precisely, not so QA has to
> follow them.
>
> **Status:** documentation only. The importer is specified but not yet implemented, and no signed
> physical-device migration pass has been recorded.

---

## The one thing to read first

The **on-device importer** that moves Flutter's data into the React Native stores is Phase 09 of
the migration roadmap. Its authoritative behavior is the
[data-migration specification](../05-tech-specs/data-migration.md). **It is not yet present in
`mobile/`** — see
[§Build precondition B-3](./01-scope-prerequisites-and-execution-order.md#b-3--does-the-build-contain-the-importer)
and [Q-01](./09-open-engineering-questions.md#q-01--is-the-phase-09-importer-in-the-build-under-test).

That does **not** make this playbook premature — it is exactly the acceptance suite the importer
must pass, and it is what a tester runs on the first build that claims to have one. But it does
change how you record a run: if the build under test has no importer, every device-owned
expectation below is **N/A — not implemented**, not `FAIL`. The playbook tells you how to tell
the two apart before you start.

This section does **not** decide whether any gap blocks a release. Severity and go/no-go are out
of scope by design (see [Non-goals](#non-goals)).

---

## Document index

| # | Document | What it gives you |
| --- | --- | --- |
| 01 | [Scope, prerequisites & execution order](./01-scope-prerequisites-and-execution-order.md) | What is and isn't tested, the builds and devices you need, the build preconditions, and the canonical 11-step run order every pass follows |
| 02 | [Persisted data inventory](./02-persisted-data-inventory.md) | Every persisted or recoverable datum, source-backed: where Flutter stores it, where RN expects it, whether it must migrate, what should be visible offline, and which scenarios verify it |
| 03 | [Flutter seed packs](./03-flutter-seed-packs.md) | The two deterministic datasets (`SEED-A` compact, `SEED-B` large) with exact creation steps, exact values, and the baseline record sheet |
| 04 | [iOS in-place update execution](./04-ios-in-place-update.md) | Installing the released Flutter build, then replacing it in place via TestFlight / the App Store without wiping the container |
| 05 | [Android in-place update execution](./05-android-in-place-update.md) | The same, via Google Play internal/closed testing, plus the `adb` evidence commands |
| 06 | [Offline & online verification scenarios](./06-offline-and-online-verification-scenarios.md) | `OFF-01…OFF-21` (offline, immediately after update) and `ON-01…ON-06` (after network is restored) |
| 07 | [Failure, restart & recovery scenarios](./07-failure-restart-and-recovery-scenarios.md) | `REC-01…REC-09` — first launch without network, crash-boundary retry, malformed/truncated fixtures, indefinite retention, and report-outbox delivery |
| 08 | [QA execution report](./08-qa-execution-report-template.md) | The reusable report: run header, per-scenario pass/fail rows, evidence placeholders, and the sign-off block |
| 09 | [Resolved decisions & remaining evidence](./09-open-engineering-questions.md) | `Q-01…Q-12` — the frozen product decisions plus signed-device and build evidence still required |

## How the identifiers work

| Prefix | Meaning | Defined in |
| --- | --- | --- |
| `D-nn` | A persisted datum in the inventory | [02](./02-persisted-data-inventory.md) |
| `B-n` | A build/environment precondition | [01](./01-scope-prerequisites-and-execution-order.md) |
| `SEED-A` / `SEED-B` | A seed pack; `SEED-A-nn` is one setup step inside it | [03](./03-flutter-seed-packs.md) |
| `BASE-nn` | A baseline value recorded before the update | [03](./03-flutter-seed-packs.md) |
| `MIG-IOS-nn` / `MIG-AND-nn` | A platform update-execution step | [04](./04-ios-in-place-update.md) / [05](./05-android-in-place-update.md) |
| `OFF-nn` | An offline post-update verification scenario | [06](./06-offline-and-online-verification-scenarios.md) |
| `ON-nn` | An online / refetch verification scenario | [06](./06-offline-and-online-verification-scenarios.md) |
| `REC-nn` | A failure / restart / recovery scenario | [07](./07-failure-restart-and-recovery-scenarios.md) |
| `Q-nn` | A stable decision/evidence identifier | [09](./09-open-engineering-questions.md) |

Every inventory row names the scenarios that verify it, and every scenario names the inventory
rows it covers. The coverage cross-check lives at the end of
[02](./02-persisted-data-inventory.md#3-coverage-cross-check).

## Non-goals

Explicitly **not** part of this section:

- Visual-parity or design-review passes.
- A broad device-compatibility matrix beyond the supported-platform and required low-end slots.
- General application performance certification. `OFF-19` still records migration duration and
  peak memory because those are release gates for the importer.
- Inventing a release policy during execution; the stop/hold conditions are defined by the
  canonical migration specification.
- Exhaustive create/edit/delete lifecycle coverage of every entity — representative edits and
  restarts are used to prove that migrated records are genuinely usable, not to re-test the
  features themselves.
- Any Flutter, React Native, native, database, or migration implementation change.

## Related material

- [`../05-tech-specs/data-migration.md`](../05-tech-specs/data-migration.md) — the canonical source,
  target, parser, state-machine, startup, privacy, rollout, and test contract.
- [`../00-exploration/data-persistence-migration.md`](../00-exploration/data-persistence-migration.md)
  — the historical research this inventory is built on.
- [`../01-roadmap/09-data-migration.md`](../01-roadmap/09-data-migration.md) — the importer's
  intended behavior (the contract the scenarios below assert).
- [`../01-roadmap/10-parity-cutover-release.md`](../01-roadmap/10-parity-cutover-release.md) —
  the cutover, which requires "real upgrades from a Flutter install" during internal hardening.
- [`../inbox/2026-06-15-android-storage-verification.md`](../inbox/2026-06-15-android-storage-verification.md)
  — the physical Android path, survival, and backup evidence still required by
  [Q-02/Q-03](./09-open-engineering-questions.md#q-02--which-shared_preferences-backend-does-android-use).
- [`../../mobile/releases/README.md`](../../mobile/releases/README.md) — signing custody, store
  preview, and what remains owner-only. Read it before requesting builds.
