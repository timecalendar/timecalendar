# Tasks — import-order lint rule

## 1. Add the rule

- [x] 1.1 Add `eslint-plugin-simple-import-sort` as a devDependency in `mobile/`.
- [x] 1.2 Register the plugin and add `simple-import-sort/imports` +
      `simple-import-sort/exports` (both `error`) to the
      `timecalendar/architecture` block in `mobile/eslint.config.js`, with the
      group order from design D2 (side-effect → builtins+third-party → `@/` →
      relative). Keep the generated-code exemption intact.

## 2. Sweep the tree

- [x] 2.1 Run `npm run lint -- --fix` in `mobile/`; review the import-block diff.
- [x] 2.2 Confirm `import "@/i18n"` (and any other side-effect import) kept its
      relative order and its leading comment.

## 3. Docs (living artifacts)

- [x] 3.1 Add the import-order rule to the Architecture Book "Lint & format" rule
      inventory (`.claude/rules/mobile/architecture.md`).
- [x] 3.2 Append a Rule changelog entry
      (`.claude/rules/mobile/architecture-changelog.md`).
- [x] 3.3 Add the ADDED requirement to the `mobile-lint-format` spec delta.

## 4. Verify (DoD)

- [x] 4.1 `npx tsc --noEmit` clean.
- [x] 4.2 `npm run lint` (`--max-warnings 0`) green.
- [x] 4.3 `npm test` green.
