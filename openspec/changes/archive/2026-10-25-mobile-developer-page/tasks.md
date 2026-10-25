# Tasks

All commands run in `mobile/` unless stated. Design decisions are D1–D6 in `design.md`. One
commit (`feat(mobile): developer page for dev tools`) unless a split helps review.

## 1. Icons and strings

- [x] 1.1 Add `src/assets/icons/material/developer_mode.xml` and `download.xml`: Material Symbols
      Outlined 24px vectors from google/material-design-icons
      (`symbols/android/<name>/materialsymbolsoutlined/<name>_24px.xml`), normalised to the shape of
      `dns.xml` (24dp, 960 viewport, `android:tint="?attr/colorControlNormal"`, white fill).
      Register both in `materialSymbols` in `src/components/chrome/native-settings-icons.ts`
      (alphabetical). Verify: `npx tsc --noEmit` accepts `{ ios: "hammer", android: "developer_mode" }`
      and `{ ios: "square.and.arrow.down", android: "download" }` as `NativeSettingsIcon`.
- [x] 1.2 In `src/i18n/locales/en.json` and `fr.json`: add every `developer.*`,
      `settingsHub.section.developer` and `settingsHub.developer.*` key with the D4 strings
      (`developer.gallery.*` take the current `settingsHub.gallery.*` values verbatim); remove
      `settingsHub.gallery.label`, `settingsHub.gallery.hint` and `environment.selector.section`.
      Verify: `npx tsc --noEmit` (typed bidirectional parity) passes once §2–§3 stop using the
      removed keys; `grep -rn "settingsHub.gallery\|environment.selector.section" src` returns nothing.

## 2. Developer feature and route

- [x] 2.1 Create `src/features/developer/index.ts` (`export * from "./ui"`) and
      `src/features/developer/ui/index.ts` (`export { DeveloperScreen } from "./developer-screen"`).
- [x] 2.2 Create `src/features/developer/ui/developer-screen.tsx` per D1, D3, D4:
      production capability → `<Redirect href="/settings" />` before any other render;
      otherwise `<Stack.Screen options={{ title: t("developer.title") }} />` and a
      `NativeSettingsHost` with the backend section (`<EnvironmentSettingsControl />` from
      `@/features/environment`), the test-data section only when `isDevVariant()`
      (`@/config/variant`) holding the `developer-dev-import` action row, and the design section
      with the `developer-gallery` navigation row (`href="/settings-gallery"`). The dev import row
      opens `NativeTextEntryDialog` (ids from a static `testID` selector object as in
      `rename-calendar-dialog.tsx`, `initialValue=""`, `message={null}`, `pending={false}`,
      `submitDisabled` while the tracked trimmed value is empty); `onSubmit` re-checks the trimmed
      value, closes the dialog and calls
      `router.push({ pathname: "/dev-import", params: { token } })`; `onCancel` closes it. Use theme
      tokens only; no raw `TextInput`, no `allowFontScaling`, no hex. Verify: `npx tsc --noEmit`.
- [x] 2.3 Create `src/app/developer.tsx` containing exactly
      `export { DeveloperScreen as default } from "@/features/developer/ui"` and register
      `<Stack.Screen name="developer" />` in `src/app/_layout.tsx` directly after
      `settings-gallery` (compact default header). Verify: the route-structure test (§4.2) passes.

## 3. Settings keeps one developer row

- [x] 3.1 In `src/features/settings/ui/settings-screen.tsx`: delete the
      `settings-section-environment` section and the `EnvironmentSettingsControl` import; add, as the
      last section and only when `getBackendEnvironmentCapability() !== "production"`, a
      `NativeSettingsSection` titled `t("settingsHub.section.developer")`
      (testID `settings-section-developer`) with one navigation row
      (`href="/developer"`, label/hint `settingsHub.developer.*`,
      icon `{ ios: "hammer", android: "developer_mode" }`, testID `settings-developer`).
      Verify: `npx tsc --noEmit`.

## 4. Tests

- [x] 4.1 Create `src/features/developer/ui/developer-screen.test.tsx`, mirroring
      `settings-gallery-screen.test.tsx`'s mocks (`expo-router` `Redirect`/`Stack`/`router.push`,
      `@/features/environment` with a mutable capability and `EnvironmentSettingsControl` stub
      rendering a `settings-environment` testID, `@/config/variant` with a mutable `isDevVariant`).
      Cover: production → redirect text `/settings` and none of the developer testIDs;
      `describe.each(["ios","android"])` with `usePlatform`: development variant renders
      `developer-section-backend`, `-test-data`, `-design` in that order; preview capability with a
      non-development variant renders no `developer-dev-import`; pressing `developer-gallery` pushes
      `/settings-gallery`; pressing `developer-dev-import` shows `developer-dev-import-dialog`;
      entering `"  abc123 "` and submitting pushes
      `{ pathname: "/dev-import", params: { token: "abc123" } }` and closes the dialog; whitespace-only
      input leaves submit disabled and pushes nothing; cancel closes with no push. Await `render`
      and `fireEvent` (RNTL 14); no fake timers. Verify:
      `npx jest src/features/developer --coverage --collectCoverageFrom='src/features/developer/**'`
      passes with ≥ 90% branches on `developer-screen.tsx`.
- [x] 4.2 In `src/components/settings-route-structure.test.ts`: add a test asserting
      `route("developer.tsx").trim()` equals the thin re-export, `_layout.tsx` contains
      `<Stack.Screen name="developer" />`, and `developer-screen.tsx` contains
      `title: t("developer.title")`. Keep the `settings-gallery` test (the route does not move).
      Verify: `npx jest src/components/settings-route-structure.test.ts` passes, including the
      "classifies every root route" test.
- [x] 4.3 In `src/features/settings/ui/settings-screen.test.tsx`: drop `EnvironmentSettingsControl`
      from the `@/features/environment` mock; in the icon test replace `square.grid.2x2` with
      `hammer` (Compose icon count stays 11); in the states test assert under development capability
      that `settings-section-developer` and `settings-developer` render, pressing `settings-developer`
      pushes `/developer`, and `settings-section-environment`, `settings-environment` and
      `settings-gallery` are absent; add a preview-capability case that also shows the row, and keep
      the production case asserting no `settings-section-developer`. Verify:
      `npx jest src/features/settings` passes.
- [x] 4.4 Confirm no E2E selector points at a removed Settings row:
      `grep -rn "settings-environment\|settings-gallery\|settings-section-environment" .maestro e2e`
      returns nothing, and `npx jest e2e/maestro-selectors.test.ts` passes (the `/dev-import`
      deep link is unchanged).

## 5. Lint gate (Principle 1, D5)

- [x] 5.1 In `eslint.config.js`: add `developerToolsImportPath` and
      `developerToolsDeepImportPattern` with the D5 message, a `banDeveloperTools = true` flag in
      `restrictedImports` (pattern into `patterns`, path into `paths`), and the block
      `timecalendar/developer-tools-home` (`files: ["src/features/developer/**", "src/features/environment/**"]`,
      `restrictedImports([routeEntrypointImportPattern], { banDeveloperTools: false })`) after
      `timecalendar/routes-not-importable`, with a one-line comment on why the route pattern is
      re-included. Verify: `npm run lint` is clean with zero warnings.
- [x] 5.2 Inject-and-revert: (a) add
      `import { EnvironmentSettingsControl } from "@/features/environment"` to `settings-screen.tsx`
      → `npx eslint src/features/settings/ui/settings-screen.tsx` reports `no-restricted-imports`
      with the D5 message; (b) add `import { EnvironmentSettingsControl } from "@/features/environment/ui/environment-settings-control"`
      to `src/app/developer.tsx` → error; (c) confirm `developer-screen.tsx` lints clean and still
      reports the `@/app` ban when `import "@/app/about"` is injected (route pattern carried
      forward). Revert all injections. Record the commands and trimmed outputs in
      `openspec/changes/mobile-developer-page/evidence.md`.

## 6. Architecture Book

- [x] 6.1 `docs/mobile/architecture-book/navigation.md`: add a "Developer page" paragraph —
      `/developer` is a root Stack sibling with the compact header, reached from the Settings hub's
      Developer section; it redirects to `/settings` when the backend capability is `production`;
      it hosts the environment entry, the dev import by token (development variant only, pushing
      `/dev-import`) and the `/settings-gallery` entry; the environment control's home is enforced
      by `timecalendar/developer-tools-home` / `banDeveloperTools` in `eslint.config.js`. Rewrite
      the `/settings-gallery` paragraph to say it is reached from the developer page. Current state
      only, no history wording.
- [x] 6.2 `docs/mobile/architecture-book/features.md`: add a `developer` row (capability-gated
      developer page hosting environment switch, dev import entry and gallery entry; persists no
      state; reads `@/features/environment` and `@/config/variant`, links `/dev-import` and
      `/settings-gallery`); change the `environment` row to "the developer-page entry that is the
      sole environment indicator"; keep the `settings` row accurate (one gated Developer row).
- [x] 6.3 `docs/mobile/architecture-book/lint-format.md`: add the developer-tools import ban to the
      rule inventory next to the other `restrictedImports` flags, naming the opt-out block.
- [x] 6.4 `docs/mobile/architecture-book/CHANGELOG.md`: add a `## 2026-10-25 — Developer page`
      entry at the top listing `/developer`, its gate, its three sections, the single Settings row,
      the lint ban and the updated files. Verify: `npx prettier --check` on the four files (from
      the repo root or via `mobile`'s Prettier) passes.

## 7. Local verification

- [x] 7.1 `npx tsc --noEmit` passes.
- [x] 7.2 `npm run lint` passes with zero warnings.
- [x] 7.3 `npm test -- --coverage` passes, including the 90% per-file branch gate for every touched
      file (`developer-screen.tsx`, `settings-screen.tsx`, `native-settings-icons.ts`).
