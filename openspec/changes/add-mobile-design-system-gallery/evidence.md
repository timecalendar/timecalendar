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

The check treats a control nested inside another control as part of the outer node (SwiftUI
Button content and Compose `mergeDescendants`). This covers the trailing Material `RadioButton`
and `Switch` inside the choice and switch rows. Whether TalkBack gives the trailing `Switch`
(which has `onCheckedChange` set) a focus stop of its own stays a question for the 8.5 device pass.

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

Pending (conductor device pass).
