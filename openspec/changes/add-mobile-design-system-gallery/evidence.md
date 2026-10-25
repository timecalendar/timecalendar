# Evidence

All commands run in `mobile/`. Every injection was reverted; `git status` was clean of it
afterwards. Lint injections were piped through `npx eslint --stdin --stdin-filename <file>` so no
file on disk changed.

## 5.2 Lint gate for `@/design`

(a) `import { galleryModules } from "@/design/gallery/registry"` prepended to
`src/features/developer/ui/gallery-index-screen.tsx`:

```
1:1  error  '@/design/gallery/registry' import is restricted from being used by a pattern. Import the design system through the @/design barrel (design-system-proposal §3, lint-format.md → Design layer)  no-restricted-imports
```

(b) The same import prepended to `src/design/index.ts`: no `no-restricted-imports` error (only
`import/no-duplicates` / `import/first` warnings caused by the duplicated injected line).

(c) `import "@/features/settings"` prepended to `src/design/gallery/stories.ts`:

```
1:8  error  B-7: src/design/ may not import features, routes, @/api/generated or @/db — it consumes @/theme, @/components/chrome, @/i18n and @/hooks only (lint-format.md → Design layer)  boundaries/dependencies
```

(d) `import "@/app/about"` prepended to `src/design/gallery/stories.ts`:

```
1:1  error  '@/app/about' import is restricted from being used by a pattern. Route files under src/app/ are entrypoints — move shared code to a module and import that instead  no-restricted-imports
1:8  error  B-7: src/design/ may not import features, routes, @/api/generated or @/db — …  boundaries/dependencies
```

## 6.1 Registry test

(a) `src/components/chrome/scratch.gallery.tsx` (`export default { id: "scratch" }`), unregistered:

```
✕ registers every fixture file under src/ and nothing else
-   "components/chrome/scratch.gallery.tsx",
```

(b) A second export `rows` in `native-settings.gallery.tsx` (id `native-settings--rows`, colliding
with `Rows`):

```
✕ keeps meta ids, titles and story ids unique
+ Array [
+   "native-settings--rows",
+ ]
```

(c) `<Pressable testID="injected-unlabeled" onPress={() => undefined} />` added to
`DestructiveFixture`:

```
✕ gallery stories on ios › in light mode › renders native-settings--destructive with accessible controls
✕ gallery stories on ios › in dark mode › renders native-settings--destructive …
✕ gallery stories on android › in light mode › renders native-settings--destructive …
✕ gallery stories on android › in dark mode › renders native-settings--destructive …
+   "violations": Array [
+     "injected-unlabeled missing role and label",
+   ],
```

Mock fixes the matrix required (`jest/setup-expo-ui.ts`), each tracking the real control:

- Compose `ListItem` and `Row` render a plain `View` when no `clickable` / `selectable` /
  `toggleable` modifier is set: a Compose node without one is not a control. Value rows, the
  alert surface and the header row were reported as role-less controls before.
- Compose `OutlinedTextField` projects its `Label` slot text as the `TextInput`
  `accessibilityLabel`, which is what TalkBack announces.

- Compose `RadioButton` is a control only with `onClick` (Expo UI passes
  `clickable: onClick != null`). Compose `Switch` is always a control (Expo UI's `SwitchView`
  always passes a non-null `onCheckedChange`) unless it carries `clearAndSetSemantics()`.

The check covers nested controls: Compose merging stops at a child with its own click or toggle
semantics. Inject-and-revert: with `clearAndSetSemantics()` removed from the switch row's trailing
`Switch` in `native-settings.tsx`, `npx jest src/design/gallery/registry.test.ts` fails 4 tests
(Android light and dark × `native-settings--switches` and `native-settings--long-strings`), each
reporting `"undefined missing label"` for the bare switch; restored, all 44 pass. Whether the Kotlin
module compiles and TalkBack meets one stop per switch row is the Android device pass.

## 6.2 No-Storybook contract

`"@storybook/react-native": "10.0.0"` added to `package.json` `devDependencies` (no install):

```
✕ declares no Storybook or react-native-web package (ADR 064)
+ Array [
+   "@storybook/react-native",
+ ]
```

## 6.4 Developer-routes contract

The `isDeveloperSurfaceEnabled()` redirect line removed from `GalleryStoryScreen`:

```
✓ developer.tsx is a thin developer-ui export that redirects in production
✓ developer/gallery.tsx is a thin developer-ui export that redirects in production
✕ developer/gallery/[story].tsx is a thin developer-ui export that redirects in production
```

## 2.1 Typed story names

`const s: GalleryStory<object> = { name: "developer.title" }` in a scratch file:

```
error TS2322: Type '"developer.title"' is not assignable to type 'GalleryKey'.
```

## 8.4 iOS simulator smoke

iPhone 17 simulator (iOS 26.5), development build `fr.samuelprak.timecalendar.dev`, Metro on this
branch, backend capability `development`, app language English. Simulator reset to light / `large`
afterwards.

- Settings → Developer: the Design section shows "Component gallery" with a chevron; tapping it
  opens `/developer/gallery` with the native header "Component gallery" and back button
  "Developer".
- Index: two sections, "Native settings" and "Text entry dialog"; each row is one `AXButton` with
  its story name. Row order (meta `stories`) and the absence of the Android-only stories on iOS
  are pinned by `gallery-index-screen.test.tsx`; this pass does not cover them.
- `timecalendar-dev://developer/gallery/native-settings--switches` from a running app opens the
  story directly with the native header "Switches"; accessibility tree: `AXButton "Switch on"
  value="1"`, `AXButton "Switch off" value="0"`.
- `…/native-settings--long-strings`, light, default size: header, footer and section title wrap;
  each row is one `AXButton` carrying title, subtitle and value
  (`"Unconstitutionally strict verification, Last successful sync a few minutes ago from your
  institution's server" value="Higher education institution"`).
- Same story, dark, `accessibility-extra-extra-extra-large`, cold launch: header title and intro
  wrap without clipping.
- `…/native-text-entry-dialog--submit-disabled`, dark, default size: sheet titled "Rename the
  calendar", Cancel enabled, Save rendered disabled, field exposed as `"Calendar name"`.

Findings for the native-settings seam (outside this change, recorded in the inbox note):

1. At `accessibility-extra-extra-extra-large`, a row with a trailing value and a badge
   (long-strings story) keeps the title, value and badge side by side, so the title wraps two to
   three characters per line. iOS Settings stacks the value under the title at accessibility
   sizes.
2. Changing the content size while the long-strings story is on screen clips the header title and
   intro to their previous heights; a cold launch at the same size lays out correctly.
3. A story opened by deep link has no gallery index beneath it, so Back returns to the tab the app
   was on.
