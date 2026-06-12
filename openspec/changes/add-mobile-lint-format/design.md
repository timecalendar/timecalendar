# Design — add-mobile-lint-format

## Context

`mobile/` is a standalone npm project (scaffold design D7) on Expo SDK 56 / ESLint 9 flat config era. Today it has zero lint: `"lint": "expo lint"` exists but no config file and no eslint dependency. Prettier is the template's `{"singleQuote": true}` while web and server share `{"singleQuote": false, "trailingComma": "all", "semi": false}` enforced through `eslint-plugin-prettier`. Pre-commit is a root husky hook running `npx lint-staged`, which resolves the nearest `lint-staged` block per staged file — web and server each carry their own. CI has a `test-mobile` job (codegen drift gate + typecheck) with no lint step.

The Architecture Book carries one explicit debt assigned to this step: *"hand-written `fetch` calls bypassing the client are not yet lint-gated — prose rule until an ESLint boundary rule exists (R-1 debt, owned by the lint foundation step)."* It also states **"No axios in mobile"** as prose.

Scoping decisions made with the user up front: strings rule live as `error` now with suppressions on template screens; off-the-shelf plugins preferred, custom rules only for gaps; boundaries encode **today's layout only**; Prettier config duplicated into `mobile/` verbatim (no root hoist).

Indicative future direction (Lyro Lab frontend rules, explicitly non-binding): feature modules with `data/queries` wrappers as the only consumers of generated hooks, mappers at the DTO edge, thin route files. Not encoded now — but the boundary mechanism chosen here must be able to grow into per-module rules without being replaced.

## Goals / Non-Goals

**Goals:**
- ESLint 9 flat config on `eslint-config-expo/flat`, clean on the current tree, enforced in CI at zero warnings.
- The four roadmap rules + the no-raw-fetch debt, each encoded at the cheapest layer that holds.
- Prettier identical to web/server; formatting enforced the same way web/server do it (via `eslint-plugin-prettier`, so one gate covers both).
- Pre-commit lint on staged mobile files through the existing root husky hook.
- Architecture Book updated: prose caveats replaced by pointers to enforcing rules (R-1).

**Non-Goals:**
- No feature-folder/module boundary rules — no features exist; the first feature earns its boundaries (migration principle 5). The Lyro-style module layering is a recorded direction, not a rule.
- No i18n wiring (step 6) — the strings rule lands without a `t()` to fix violations with; suppressed template screens carry the debt visibly.
- No Jest/RNTL lint presets (step 5 owns the test harness; test-file lint overrides land with it).
- No re-litigation of web/server lint configs; their files are untouched.

## Decisions

### D1 — Base: `eslint-config-expo/flat`, not a hand-built config
`npx expo lint` is the blessed SDK 56 path and the config ships React/React-Native/TS/expo-router awareness we'd otherwise reassemble. Our rules layer on top in `eslint.config.js`. Alternative (hand-built from `typescript-eslint` like the server) rejected: the server config encodes Nest idioms, not RN ones, and we'd own the RN plugin matrix ourselves.

### D2 — Formatting enforced via `eslint-plugin-prettier`, mirroring web/server
One mechanism repo-wide: format drift is a lint error, `eslint --fix` repairs it, no separate `prettier --check` CI step, lint-staged stays a single command. The known cost (Prettier-as-lint-rule is slower than `prettier --check`) is acceptable at mobile's size and buys consistency with the two existing setups. `mobile/.prettierrc` becomes a byte-for-byte copy of web/server's. The whole tree reformats once, **including `src/api/generated/`** — Orval pipes output through Prettier (`afterAllFilesWrite: 'prettier --write'`), so the client is regenerated in this change and the CI drift gate stays green.

### D3 — No hardcoded strings: `eslint-plugin-i18next` (v6, flat-config native), `error` from day one
`no-literal-string` configured for JSX text and the user-facing attribute set (RN: `accessibilityLabel`, `accessibilityHint`, `placeholder`, `title`...; `testID` exempt). Existing template screens/components get file-level `eslint-disable` comments with a `TODO(step-6/step-13)` marker — they are scaffold debris that dies when the splash screen lands, and the disables make the debt grep-able. Any new string in new code is blocked immediately; step 6 (i18n) provides the fix path and removes the suppressions. Alternative (warn-until-step-6) rejected by user: warnings rot.

### D4 — A11y on touchables: `eslint-plugin-react-native-a11y` through `@eslint/compat`
The plugin is the only maintained RN a11y ruleset but peers at `eslint ≤8` and ships eslintrc-style presets. Wrap with `fixupPluginRules` from `@eslint/compat` and enable the touchable-relevant rules explicitly (`has-accessibility-hint`, `has-accessibility-props`, `has-valid-accessibility-role`, ...) rather than pulling its presets. **Fallback (pre-agreed):** if the fixup path proves broken under ESLint 9, hand-roll a minimal local rule for "touchable/pressable requires accessibility props" — that's the "custom for gaps" escape hatch, and the design accepts swapping D4's mechanism without re-opening the requirement.

### D5 — Navigation + boundaries: core `no-restricted-imports`/`no-restricted-globals`, no boundary plugin yet
The parent-relative import ban (`../*`, matching the server) is the keystone: with it, every cross-directory import must use the `@/` alias, which makes path-pattern rules reliable. On top of that, all of today's boundaries are expressible with core rules scoped by `files` blocks:
- `@react-navigation/*` import ban everywhere (Expo Router is the API; message names the replacement).
- `axios` import ban (Book prose → encoded).
- Files outside `src/app/` may not import `@/app/*` (routes are entrypoints, not modules).
- `fetch` banned via `no-restricted-globals` everywhere except `src/api/mutator.ts` (the R-1 debt, paid).
- `src/api/generated/**` is exempted from hand-written-code rules (it's codegen-owned) but still formatted.

Alternatives: `eslint-plugin-boundaries` or `import/no-restricted-paths` rejected *for now* — three zone rules don't justify a dependency with its own resolver config. **Growth path:** when feature modules arrive, `eslint-plugin-boundaries` (element types: route/module/shared) is the expected upgrade; nothing in this layering blocks it because the rules live in clearly-marked config blocks that can be deleted wholesale.

### D6 — No local plugin scaffolding yet
Every rule in scope lands via core rules or existing plugins, so we do **not** create `eslint-plugin-timecalendar`/local-rules infrastructure speculatively. The first genuine gap (possibly D4's fallback, or a future no-direct-generated-hooks rule when modules exist) creates it. This is R-1 applied to our own tooling: don't build machinery before a rule needs it.

### D7 — Pre-commit and CI shapes copy the existing patterns exactly
`mobile/package.json` gains the same `lint-staged` block as web/server (`eslint --cache --fix` on staged JS/TS; `.eslintcache` gitignored). The root husky hook needs no changes — lint-staged ≥13 resolves per-file configs, proven in-repo by web/server. CI adds one step to `test-mobile` after typecheck: lint with `--max-warnings 0` (zero-warning policy from day one, so `warn` severity can't silently accumulate).

## Risks / Trade-offs

- **[react-native-a11y is ESLint-8-era]** → `@eslint/compat` fixup, rules enabled individually (no preset import), D4 fallback to a local rule pre-agreed. *(Implementation correction: npm ≥7 hard-errors on the unresolvable eslint peer, so an npm `overrides` entry pinning the plugin's eslint peer to `$eslint` was required — the "warning only" assumption was wrong. Fixup path itself works; fallback not needed.)*
- **[Mass reformat pollutes blame]** → unavoidable cost of alignment, taken now while mobile is ~30 files; a single formatting-only commit keeps it isolated (and could be added to `.git-blame-ignore-revs` if it ever matters).
- **[Strings-rule suppressions normalize disabling]** → suppressions are file-level, comment-tagged, and on files already scheduled for deletion; the lint section in the Book states they are debt, and step 6's DoD includes their removal.
- **[`no-restricted-globals: fetch` misses `globalThis.fetch`/`global.fetch`]** → accepted: the rule targets accidental bypass, not adversarial evasion; review catches the rest. Noted in the Book next to the rule pointer.
- **[Path-pattern boundaries are alias-dependent]** → the `../*` ban is what makes them sound; both rules ship in the same config block with a comment stating the dependency.
- **[expo lint wrapper drift]** → CI invokes the same `npm run lint` developers use (with `--max-warnings 0`), so local and CI can't diverge on entry point.

## Open Questions

- None blocking. The exact a11y rule list (which `react-native-a11y` rules beyond the touchable ones are signal vs noise for this codebase) is finalized during implementation against the real tree.
