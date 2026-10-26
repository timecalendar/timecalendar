# Tasks

Run all commands in `mobile/` unless a task says otherwise. Decisions D1 to D6 are in `design.md`,
and the name map is D1. Use `git mv` for every rename so history follows the file. Keep the rename
commit to identifier, string and import edits only. Land the adapter removal (group 3) and the lint
rule (group 4) as separate commits. The contract does not change: no prop, style, geometry,
accessibility or consumer-testID change, and no `ListRow` work (that is slice 3.6). Await every
RNTL 14 helper and use no fake timers. No code comments except a non-obvious why. Docs describe the
current state only.

## 1. Rename the seam (D1)

- [x] 1.1 Record the baseline the rename must preserve:
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.-]+' .maestro | sort -u > /tmp/maestro-ids.before`. Then,
      from the repo root, run `grep -rn "native-settings\|NativeSettings\|nativeSettings"
      mobile/.maestro mobile/scripts .github` and confirm it returns nothing. Verify: the file is
      non-empty and the grep is empty.
- [x] 1.2 `git mv` the twelve chrome files: `native-settings{,.test,.gallery,.gallery.test}.tsx` →
      `native-list{…}.tsx`, `native-settings-header{,.test}.tsx` → `native-list-header{…}.tsx`,
      `native-settings-numeric-editor{,.test,.gallery,.gallery.test}.tsx` →
      `native-list-numeric-editor{…}.tsx`, `native-settings-host-context.ts` →
      `native-list-context.ts`, and `native-settings-icons.ts` → `native-list-icons.ts`. Verify:
      `ls src/components/chrome | grep native-settings` is empty.
- [x] 1.3 Inside the renamed files, apply the D1 identifier map. Exports: `NativeSettingsHost` →
      `NativeList`, `NativeSettingsHostProps` → `NativeListProps`, every other `NativeSettings<X>`
      → `NativeList<X>`. Context: `NativeListContext`, `useAssertOutsideNativeList`. Private
      helpers: `SwiftSettings*` → `SwiftList*`, `ComposeSettings*` → `ComposeList*`. Change the
      placement error to `` `${componentName} must render outside NativeList; place it after
      </NativeList>.` `` and update the comment in `native-list-context.ts` to say "list host".
      Point the import paths at the new files. Rewrite the `src/components/chrome/index.ts` exports
      to the new names and paths. Keep the barrel free of aliases. Verify: `grep -rn
      "NativeSettings\|SwiftSettings\|ComposeSettings\|native-settings" src/components/chrome`
      returns only fixture strings, which task 2.1 handles.
- [x] 1.4 Apply the map at every call site: `native-text-entry-dialog.tsx` (the guard hook) and
      its test (the placement error string); `native-list.test.tsx`,
      `native-list-header.test.tsx`, `native-list-numeric-editor.test.tsx` (`describe` titles that
      name the old components, the error strings, `jest.mock` paths); Settings
      (`settings-screen`, `appearance-`, `language-`, `timezone-settings-screen`), Notifications
      (`notification-settings`, `-frequency`, `-days-ahead`, `-days-custom`, `-sync-status`) and
      their tests; Calendar sources (`user-calendars-screen`, `user-calendar-detail-screen`) and
      their tests; `about-screen.tsx`; `developer-screen.tsx`; `gallery-index-screen.tsx`;
      `environment-selector-dialog.tsx`; the developer UI tests; and
      `notification-native-controls.contract.test.ts` (its `read(...)` path becomes
      `src/components/chrome/native-list-numeric-editor.tsx`). In
      `tools/eslint-rules/design-import-policy.test.js` the chrome runtime case reads
      `src/components/chrome/native-list.tsx`. In the two adapters
      (`src/features/settings/ui/settings-{row,section}.tsx`), switch only their imports and the
      icon type to the new names so the tree compiles; group 3 deletes them. Run `npx expo lint --fix` for import order and
      Prettier rewrapping. Verify: `npx tsc --noEmit` passes; `grep -rn
      "NativeSettings\|SwiftSettings\|ComposeSettings" src tools` returns nothing; `npx jest src/components/chrome src/features` passes.

## 2. Gallery renames (D4)

- [x] 2.1 In `native-list.gallery.tsx` and `native-list.gallery.test.tsx`: meta id `native-list`,
      fixture testIDs `gallery-native-settings-*` → `gallery-native-list-*`, translation keys
      `gallery.nativeSettings.*` → `gallery.nativeList.*`. In
      `native-list-numeric-editor.gallery.tsx`: meta id `native-list-numeric-editor` (keep
      `gallery.numericEditor.*` and `gallery-numeric-editor-*`). In `src/i18n/locales/en.json` and
      `fr.json`, rename the `gallery.nativeSettings` object to `gallery.nativeList`, values
      unchanged. First confirm that every `nativeSettings` key sits under `gallery` (`grep -n
      nativeSettings src/i18n/locales/*.json`). Verify: the i18n parity test passes and
      `npx tsc --noEmit` passes (typed keys).
- [x] 2.2 `src/design/gallery/registry.ts`: bindings `nativeList` and `nativeListNumericEditor` with
      the new paths, same position. In `src/design/gallery/stories.test.ts` and the developer UI tests
      (`gallery-index-screen.test.tsx`, `gallery-story-screen.test.tsx`,
      `developer-routes.contract.test.tsx`), change every `native-settings--*` /
      `native-settings-numeric-editor--*` story id and `gallery.nativeSettings.*` key to the new
      form. In `src/design/gallery/known-a11y-violations.ts`, change the three entries' `story` to
      `native-list--switches` / `native-list--long-strings` and `element` to
      `gallery-native-list-switch-on > switch`, `gallery-native-list-switch-off > switch` and
      `gallery-native-list-long-switch > switch`. Keep platform, problem, reason and inbox
      unchanged, and keep the list at exactly three entries. Verify: `npx jest src/design
      src/features/developer src/components/chrome` passes, including `registry.test.ts`'s render
      matrix (light/dark × iOS/Android), id uniqueness, orphan check and the known-violation
      stale/unlisted check; and `git diff main -- src/design/gallery/known-a11y-violations.ts`
      shows only string edits, with no added entry.

## 3. Retire the adapters (D3)

- [x] 3.1 `src/features/about/ui/about-screen.tsx`: import `NativeList`, `NativeListAlert`,
      `NativeListHeader`, `NativeListRow`, `type NativeListRowProps` and `NativeListSection` from
      `@/components/chrome`, and drop the `@/features/settings/ui` import. Type the section `rows`
      as `readonly NativeListRowProps[]`. In each row, change `variant: "action"` to
      `kind: "action"` and `variant: "router"` to `kind: "navigation"`, change `secondary` to
      `value`, and delete `first`. Render `<NativeListSection key title testID>` wrapping
      `<NativeListRow key={row.testID} {...row} />`. Keep every testID, icon, hint, label and handler.
      Verify: `npx jest src/features/about` passes unchanged. If the existing test does not already
      assert each row's hint (`accessibilityHint`) and the contact row's value on both platforms,
      add that assertion with `usePlatform`.
- [x] 3.2 `src/features/environment/ui/environment-settings-row.tsx`: import `NativeListRow` from
      `@/components/chrome` and render `<NativeListRow kind="action" icon={…} label={label}
      value={value} hint={…} onPress={selector.choose} testID="settings-environment" />`. Drop
      `first` and `accessibilityRole`. Verify: `npx jest src/features/environment
      src/features/developer` passes. `environment-selector.test.tsx` still asserts the `button`
      role, the "Environment" label and the `Preproduction` value.
- [x] 3.3 `git rm src/features/settings/ui/settings-row.tsx src/features/settings/ui/settings-section.tsx`
      and remove their two export lines from `src/features/settings/ui/index.ts`. Verify:
      `npx tsc --noEmit` passes; `grep -rnw "SettingsRow\|SettingsSection\|SettingsRowProps" src`
      returns nothing (`EnvironmentSettingsRow` does not match `-w`); `grep -rn
      "features/settings/ui" src/features/about src/features/environment` returns nothing.

## 4. Guard: `local/no-retired-list-names` (D5)

- [x] 4.1 Create `tools/eslint-rules/no-retired-list-names.js`. The header comment holds the
      rationale and a link to lint-format.md and ADR 072. Use `meta.type: "problem"`, no schema,
      and the message ids `retiredIdentifier`, `retiredString` and `retiredFile`, each naming
      `NativeList*` from `@/components/chrome` (ADR 072). The visitors are:
      - `Identifier` and `JSXIdentifier`: report a name matching
        `/NativeSettings|^(Swift|Compose)Settings/` or exactly `SettingsRow` / `SettingsRowProps` /
        `SettingsSection` / `SettingsSectionProps`. Report each node once. Imports, declarations,
        references, TS type names and JSX tags are all `Identifier`/`JSXIdentifier` nodes under
        `@typescript-eslint/parser`.
      - `Literal` with a string value, and `TemplateElement` (`value.cooked`): report when it contains
        `native-settings` or `nativeSettings`.
      - `Program`: report when `path.basename(context.filename)` starts with `native-settings` or
        its stem is `settings-row` / `settings-section`.

      Register it in `tools/eslint-rules/index.js`. Verify: `node -e
      "require('./tools/eslint-rules')"` succeeds.
- [x] 4.2 `tools/eslint-rules/no-retired-list-names.test.js`, a RuleTester suite in the same style
      as `no-raw-text-input.test.js`, with `tsParser` and JSX enabled.
      - valid: `NativeListRow`, `NativeList`, `EnvironmentSettingsRow`, `SettingsScreen`,
        `useAssertOutsideNativeList`, the strings `"native-list--switches"` and
        `"gallery.nativeList.title"`, and a `filename` of
        `src/features/environment/ui/environment-settings-row.tsx`.
      - invalid: `import { NativeSettingsRow } from "@/components/chrome"`,
        `type P = NativeSettingsRowProps`, `<NativeSettingsHost />`, `function SettingsRow() {}`,
        `const SettingsSection = 1`, `function ComposeSettingsHost() {}`,
        `import x from "@/components/chrome/native-settings"`, `jest.mock("./native-settings-icons")`,
        `` const id = `gallery-native-settings-${v}` ``, `t("gallery.nativeSettings.title")`, and the
        filenames `src/components/chrome/native-settings.tsx` and
        `src/features/settings/ui/settings-row.tsx`.

      Verify: `npx jest tools/eslint-rules` passes.
- [x] 4.3 `eslint.config.js`: add a block named `timecalendar/retired-list-names` with
      `files: ["src/**/*.{ts,tsx}"]`, no `ignores`, `plugins: { local: localRules }` and
      `rules: { "local/no-retired-list-names": "error" }`. Put a one-line comment above it saying
      why (ADR 072). Verify: `npm run lint` passes with zero warnings over the renamed tree.
- [x] 4.4 Inject and revert, recording each result for the PR body:
      (a) add `export const NativeSettingsRow = NativeListRow` to `src/components/chrome/index.ts`;
      (b) add `testID="gallery-native-settings-rows"` to a row in `native-list.gallery.tsx`;
      (c) recreate an empty `src/features/settings/ui/settings-section.tsx` (`export {}`).
      Each must make `npm run lint` fail, naming the file and the rule. Revert all three and confirm
      `git status` is clean.

## 5. Architecture Book and ADRs (`docs/mobile/architecture-book/`)

- [x] 5.1 Create `decisions/072-native-list-seam.md` from `TEMPLATE.md`. Status: accepted.
      Context: the misnomer and the inverted ownership (assessment §4). Decision: the D1 name
      family (host = `NativeList`), no aliases (D2), one list API with no feature-owned row
      wrappers (D3), and the `local/no-retired-list-names` gate (D5). Rejected: aliases with or
      without a deprecation lint, moving the adapters to `components/`, `NativeListHost`, and a
      grep contract test. Consequences: slice 3.6 matches `ListRow` against `NativeListRow`; the
      rule's blind spots (JSON, YAML, Markdown, computed strings). Revisit if a second composed
      native list technology appears, or if 3.6's `ListRow` makes the seam's row redundant. Add the
      `072` row to `decisions/README.md`. Verify: `rg -n "072" docs/mobile/architecture-book`
      (from the repo root) shows the index row and every new link.
- [x] 5.2 Amend `decisions/060-platform-native-settings-composition.md` (file name unchanged) in
      present tense. The Decision names `src/components/chrome/native-list.tsx` and the
      `NativeList*` contracts, replaces the `SettingsRow`/`SettingsSection` sentence with "Features
      render the seam directly ([072](./072-native-list-seam.md))", and "settings" becomes "list"
      wherever it names the seam rather than the Settings feature. Verify: `rg -n
      "SettingsRow|NativeSettings" docs/mobile/architecture-book/decisions/060*` returns nothing.
- [x] 5.3 `theming.md` → Native-chrome wrapper seam: rewrite the `chrome/native-settings.tsx`
      bullet and its sub-bullets (floating action, placement, alert, identifiers, header, icons,
      numeric editor) to the `NativeList*` names and `native-list*` paths, calling it the bounded
      native-list composition exception (ADR 060, 072). Add the seam's exports to the barrel bullet.
      Point "What CI proves" at `native-list.test.tsx`, `native-list-numeric-editor.test.tsx` and
      `NativeList`. Verify: `rg -n "NativeSettings|native-settings" docs/mobile/architecture-book/theming.md`
      returns nothing.
- [x] 5.4 Update the remaining Book files: `accessibility.md` (test path, `NativeListAlert`,
      `NativeListHeader`, known-violation story ids `native-list--switches` /
      `native-list--long-strings`); `navigation.md` (`NativeList` owns the Form insets; leave the
      ADR 060 link paths as they are); `features.md` (gallery registry rows
      `components/chrome/native-list.gallery.tsx` → `native-list` and
      `components/chrome/native-list-numeric-editor.gallery.tsx` → `native-list-numeric-editor`;
      `NativeListAlert` in the user-calendars and About notes; "native-list pages"; About renders
      the seam directly); `lint-format.md` (add `timecalendar/retired-list-names` to the block
      list at the top, and add a rule-inventory entry next to the Fields rule with its scope, the
      four checks, the absence of an allowlist, the caveats from D5, and the 4.4 inject-and-revert
      proof). Verify: from the repo root, `rg -n "NativeSettings|native-settings--|SettingsRow\b|SettingsSection"
      docs/mobile/architecture-book --glob '!CHANGELOG.md'` returns only the ADR 060 file-name
      links, `EnvironmentSettingsRow`, the `docs/projects/native-settings/` project links
      (firebase.md, ADR 035), and the retired names quoted in the lint-format rule entry and in
      ADR 072.
- [x] 5.5 `CHANGELOG.md`: add `## 2026-10-26 — NativeList seam` at the top. Bullets: the seam is
      `NativeList*` in `src/components/chrome/native-list*` with no aliases
      ([theming.md](./theming.md) → Native-chrome wrapper seam, ADR [072](./decisions/072-native-list-seam.md));
      About and the environment row render `NativeListRow` and `NativeListSection`, and Settings
      exports no row adapter; the gallery ids are `native-list--*` and `native-list-numeric-editor--*`;
      `local/no-retired-list-names` gates the retired names ([lint-format.md](./lint-format.md)).
      Leave earlier entries as they are. Verify: the entry is first and every link resolves.
- [x] 5.6 Outside the Book (identifiers and ids only, present tense):
      `mobile/assets/icons/material/README.md` (`native-list-icons.ts`), `docs/mobile/react-doctor.md`
      (ledger path), and the inbox notes `2026-10-25-mobile-design-system-gallery-device-pass.md`,
      `2026-10-25-mobile-gallery-fixtures-findings.md`, `2026-10-25-mobile-android-m3-alerts.md` and
      `2026-10-26-mobile-a11y-residuals.md` (story ids, fixture testIDs and component names).
      Leave `docs/mobile/design-system-audit/**` and `docs/projects/native-settings/**` as they are.
      Verify: from the repo root, `rg -n "native-settings--|NativeSettings" docs/react-native-migration/inbox
      mobile/assets` returns nothing.

## 6. Verification

- [x] 6.1 `npx tsc --noEmit` passes.
- [x] 6.2 `npm run lint` passes with `--max-warnings 0` (the script's flag).
- [x] 6.3 `npm test -- --coverage` passes, including the 90% per-file branch threshold, the
      registry matrix, the known-violation check, `tools/eslint-rules` (new suite included) and the
      design import-policy and import-graph contract tests. Record the suite and test counts for
      the PR.
- [x] 6.4 Maestro selectors are unchanged:
      `grep -rhoE 'id: *"?[A-Za-z0-9_${}.-]+' .maestro | sort -u | diff /tmp/maestro-ids.before -`
      is empty, and `git diff --stat main -- .maestro` is empty. Then check that every
      consumer-supplied testID the flows use still appears in source:
      `rg -n '"user-calendar-row-|"user-calendar-visibility-|user-calendar-row-\$|user-calendar-visibility-\$' src/features/calendar-sources/ui`.
- [x] 6.5 Residue sweep from the repo root: `rg -n "NativeSettings|native-settings|nativeSettings"
      mobile/src mobile/tools mobile/eslint.config.js` returns only the old names quoted inside
      `tools/eslint-rules/no-retired-list-names{,.test}.js`, and
      `openspec validate mobile-ds-native-list` passes.
