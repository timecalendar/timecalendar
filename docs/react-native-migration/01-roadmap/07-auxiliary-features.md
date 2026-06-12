# Phase 07 — Auxiliary features

> **Goal:** the remaining smaller modules needed for **full parity**. Individually light, collectively real work.
>
> **Depends on:** the established template (Phase 02). **Modules:** `add_grade`/grades, `activity`, `suggestion`, `profile`, `about`, `changelog`, `debug`.

## Rough steps

1. **Grades** (`add_grade`) — grade entry/display (check current server vs. local-only nature when reached).
2. **Activity** — sync/calendar activity log view.
3. **Suggestions** — user suggestion/feedback flow.
4. **Profile / About / Changelog** — mostly static screens.
5. **Debug** — internal debug menu (dev-only surface).

## Exit criteria

- Each module at parity with Flutter behavior and passing full DoD (`debug` held to a lighter, internal bar).

## Risks & decisions

- Low individual risk; the risk is **volume** — many small screens, each still DoD-gated. Lean hard on the golden-path scaffolding to keep them cheap.
- Confirm per-module whether data is server-backed or device-local when reached (affects storage + migration relevance).
</content>
