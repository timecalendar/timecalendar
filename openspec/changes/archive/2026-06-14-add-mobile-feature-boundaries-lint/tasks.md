# Tasks — feature-module boundary lint

All work is in `mobile/`. No `src/` behavior change; no `app.config.ts` / babel /
metro / native / `jest.config.js` / OpenAPI / `server` / `web` / `app` change.

## 1. Add the rule

- [x] 1.1 Add `eslint-plugin-boundaries` (`^6.0.2`) and
      `eslint-import-resolver-typescript` (`^3.10.1`) as devDependencies in
      `mobile/package.json` (the resolver is explicit, not transitive — design D5);
      regenerate `mobile/package-lock.json`.
- [x] 1.2 Add a new `timecalendar/feature-boundaries` block to
      `mobile/eslint.config.js` (mirroring the existing `timecalendar/*`
      named-block style + heavy explanatory comments — the file is the rule's
      documentation, R-1). It SHALL:
      - register the `boundaries` plugin and set `settings['boundaries/elements']`
        to the taxonomy in design D2 (feature-sublayer / feature-barrel /
        generated-api / db-seam / route / component / infra-color-scheme / infra-i18n;
        `feature-sublayer` listed before `feature-barrel`);
      - set `settings['import/resolver'] = { typescript: { project: "./tsconfig.json" }, node: {...} }`
        so the `@/` alias resolves (design D5);
      - apply to `src/**/*.{js,jsx,ts,tsx}`, ignoring `src/api/generated/**` and
        `**/*.test.{ts,tsx}` (tests import freely);
      - enable **`boundaries/dependencies`** (the v6 non-deprecated rule — NOT
        `element-types`/`entry-point`, which warn under `--max-warnings 0`) with
        `default: "allow"` and the three disallow rules for B-1/B-2/B-3 from
        design D3, each with a `message` naming its boundary;
      - leave `boundaries/no-unknown` and `boundaries/no-unknown-files` **off**
        (design D4);
      - **not** touch the existing `no-restricted-imports` / `no-restricted-globals`
        seam bans — boundaries layers on top (design D3/proposal).
- [x] 1.3 Confirm the config is **deprecation-warning clean**: `npm run lint`
      emits no `[boundaries]` deprecation warning (uses `boundaries/dependencies` +
      object selectors + `{{ }}` message templates, not the legacy surface).

## 2. Verify the tree is compliant (lands green)

- [x] 2.1 `npm run lint` (`--max-warnings 0`) green on the current tree — the four
      boundaries hold today (design D6); no `src/` edit is needed.
- [x] 2.2 Re-confirm by grep that the import edges are as design D6 records: only
      `*/data/*` imports `@/api/generated` / `@/db`; no sublayer imports its own
      feature barrel; no screen/route imports the seam; the infra edge is exactly
      `use-color-scheme → @/features/settings/prefs` and
      `i18n/index.ts → @/features/settings/prefs/store`.

## 3. Prove the rule bites (inject-and-revert — the R-1 gate, no Jest test)

A lint rule's enforcement IS its proof (R-1); there is no proof test. Instead,
verify each boundary fires, then revert (leave the tree clean):

- [x] 3.1 **B-3** — temporarily add `import { db } from "@/db"` to a screen under
      `src/components/` (e.g. a scratch line in `personal-events-list.tsx`); run
      `npm run lint`; confirm it ERRORS with the B-3 message. Revert.
- [x] 3.2 **B-1** — temporarily add `import { db } from "@/db"` to a `form/`
      sublayer file (e.g. `src/features/personal-events/form/build.ts`); confirm
      `npm run lint` ERRORS with the B-1 message. Revert.
- [x] 3.3 **B-2** — temporarily add an import of the feature barrel
      `@/features/personal-events` into a `form/`/`data/` sublayer file; confirm
      `npm run lint` ERRORS with the B-2 (cycle) message. Revert.
- [x] 3.4 **B-4 (negative)** — confirm the existing infra imports
      (`use-color-scheme` → `@/features/settings/prefs`, `i18n/index.ts` →
      `@/features/settings/prefs/store`) produce NO boundaries error (they are
      allowed by default). No edit needed — this is the green baseline.
- [x] 3.5 After all reverts, `git status` shows only `eslint.config.js`,
      `package.json`, `package-lock.json` (+ the docs from §4) changed — no
      stray probe edits in `src/`.

## 4. Docs (the five living artifacts — R-1)

- [x] 4.1 `.claude/rules/mobile/architecture.md` "Lint & format → Rule inventory":
      flip the "**Encoding** them as a lint rule is the still-pending
      `eslint-plugin-boundaries` upgrade (TIM-135)…" line to "**now encoded**"; add
      a rule-inventory bullet describing the boundaries plugin, the four boundaries
      (B-1…B-4), the allowed infra edge, and that it layers on the existing seam
      bans + needs the TS resolver. Keep the R-1 pointer style (the config is the
      source of truth; the prose points at it).
- [x] 4.2 `.claude/rules/mobile/golden-path.md`: flip the two "review-enforced
      today; encoding … is the pending TIM-135 slice" notes (in "Seam conventions"
      and the ADR-014 pointer / "Pending lint") to "now encoded by
      `eslint-plugin-boundaries`".
- [x] 4.3 `.claude/rules/mobile/decisions/009-settings-feature-prefs.md`: record the
      **fired revisit** in Status (dated 2026-06-14) and the chosen resolution —
      **allow the infra→feature edge as a documented seam** (design D7); update the
      Consequences "TIM-135 must decide…" paragraph to "resolved: allowed" and
      narrow the Revisit-if to "a *second* feature needs cross-cutting prefs".
- [x] 4.4 `.claude/rules/mobile/decisions/014-layered-feature-module-pattern.md`:
      flip the Decision/closing "encoding … is the separate pending TIM-135 slice"
      and the Consequences "feature-boundary lint (TIM-135) is the encodable
      follow-up" to "**landed** (TIM-135, `add-mobile-feature-boundaries-lint`)";
      record that the boundaries (B-1…B-4) are now CI-enforced and ADR 009's
      infra-edge is resolved as allowed.
- [x] 4.5 `.claude/rules/mobile/decisions/README.md`: update the ADR 009 status /
      revisit-trigger cell (revisit fired, resolved-allow; new trigger = a 2nd
      cross-cutting-prefs feature) and the ADR 014 revisit-trigger cell (the
      `eslint-plugin-boundaries`/TIM-135 follow-up landed). No ADR 015 row (design
      D8).
- [x] 4.6 `.claude/rules/mobile/architecture-changelog.md`: append a `### Live`
      entry dated 2026-06-14 in the established voice (what rule moved: the
      feature-module boundaries are now encoded; the ADR-009 edge resolved; no new
      rule beyond the boundaries lint; → Architecture Book "Lint & format", ADRs
      009/014).

## 5. Verify (DoD)

- [x] 5.1 `npx tsc --noEmit` clean (config-only; no type surface change).
- [x] 5.2 `npm run lint` (`--max-warnings 0`) green AND deprecation-warning clean.
- [x] 5.3 `npm test` green (no `src/` change; K-3 coverage gate unaffected).
- [x] 5.4 `openspec validate add-mobile-feature-boundaries-lint --strict` passes.
