# Navigation & route structure

Expo Router is the navigation backbone and the **only** navigation API: `@react-navigation/*` imports are banned (lint-enforced). Import `DefaultTheme` / `DarkTheme` / `ThemeProvider` etc. from `expo-router`, which re-exports them.

The two route-structure rules below are recorded as prose because their load-bearing half can't be encoded as a lint rule (R-1).

## Compact root Stack classification

The root Stack uses `buildCompactRootScreenOptions` from `@/components/chrome`: user-facing
non-tab siblings inherit a visible compact header, no large title, and
`headerBackButtonDisplayMode: "minimal"`. The bar itself is platform-native. On iOS it is
transparent and content scrolls under it. On iOS 26+ `headerBlurEffect` is `"none"`: the system
scroll-edge effect is the only bar surface, as in Settings and Mail, because any blur material
stacks on it as an opaque slab. On iOS 16.4–25 it is the `systemChromeMaterial` blur, blurred from
scroll top (never the appear-on-scroll edge). On Android it is a flat Material 3 top app
bar: page `background`, no shadow, `text` title and back arrow, no lift-on-scroll. On both
platforms `headerTintColor` is `text`, so back buttons and bar button items use the primary label
color, never brand pink. Screens never set `headerStyle`, `headerShadowVisible`,
`headerTransparent`, or a tint on header items themselves; the onboarding Stack uses the same
builder.

Header actions are declared through `useHeaderActions` from `@/components/chrome`, spread into the
screen's one `Stack.Screen options`: native bar button items on iOS, Material 3 top-app-bar icon
and text buttons on Android, tinted `text` by the chrome. Screens set no `headerRight`,
`headerLeft`, `unstable_headerRightItems`, `unstable_headerLeftItems` or navigation-bar
`Stack.Toolbar` themselves (`local/no-ad-hoc-header-action`, one allowlisted file: the calendar
view menu). See [theming.md → Header and floating actions](./theming.md#header-and-floating-actions--useheaderactions-floatingaction-srccomponentschrome)
and ADR [075](./decisions/075-header-and-floating-actions.md).

iOS reads a minimal back button's accessible label from the previous screen's title, which falls
back to the route name. The `(tabs)` registration therefore carries `title: t("common.back")`, so
every sibling pushed from a tab announces "Back" / "Retour", never "(tabs)", while the chevron
stays text-free. Enforced by `src/components/settings-route-structure.test.ts` (R-1).

Under the transparent iOS bar every page must inset itself: scroll roots set
`contentInsetAdjustmentBehavior="automatic"` and mark `RootPage scrollsUnderHeader`
(`KeyboardSafeActionLayout` sets the inset on its own scroller); every other `RootPage` pads by
`useHeaderOverlapInset()`; the SwiftUI Form in `NativeList` insets natively. Content that
fills the viewport (`flexGrow: 1` — a `StatusView presentation="screen"`, a centred form, a full-page
error) never scrolls under the bar: the automatic inset on top of a viewport-tall content makes it
scroll by the header height. Such a page drops `scrollsUnderHeader` and its scroller spreads
`headerScrollProps(false)` (inset `never`, no bounce); a list toggles both on whether it has rows
(`headerScrollProps(hasRows)`); `KeyboardSafeActionLayout` takes `scrollsUnderHeader={false}`. `(tabs)`, `onboarding`, `profile`, `more`,
`dev-import` and `calendar-import-result` are explicit headerless exceptions. The route-structure test enumerates top-level
siblings so a new route cannot inherit either posture accidentally. Features own localized
`Stack.Screen` titles and declare header actions through `useHeaderActions`. See ADR [054](./decisions/054-shared-root-page-semantics.md).

Root content uses `RootPage` for safe areas, the header overlap inset, vertical rhythm, and a
measured lane.
It never wraps a virtualized list in another scroller. `PageIntro` may be caption-only when the
native header is the route heading.

The Settings tab root is the one titled-tab exception: its nested Stack shows a native large title
(`headerLargeTitle: true`) that collapses into the compact bar on scroll. Every Settings destination
pushed on the root Stack stays compact.

**Developer page.** `/developer` is a root Stack sibling with the compact header, reached from the
Settings hub's Developer section (the hub's last section, rendered only when the backend capability
is not `production`). It redirects to `/settings` when the capability is `production`. It hosts
three sections: Backend (the environment row, the only place the environment selector is
mounted; its dialog renders after the native host), Test data (import a calendar by token through the native text-entry dialog, which pushes
`/dev-import?token=…`; rendered only on the development variant, where that screen acts; on
success `/dev-import` returns with `dismissTo("/calendar")`, since the root Stack's
`initialRouteName: "(tabs)"` puts the tabs beneath it in-app and on a cold deep link alike, and
falls back to `replace` only when nothing is beneath, so the root Stack never holds a second
`(tabs)`), and
Design (the component gallery entry, `/developer/gallery`). The environment selector's home is enforced by the
`banDeveloperTools` flag of `restrictedImports` and its `timecalendar/developer-tools-home` opt-out
block in `mobile/eslint.config.js`.

**Component gallery.** `/developer/gallery` (`src/app/developer/gallery.tsx`) lists every
registered fixture as a native settings section with one navigation row per story, in the order
the fixture meta's `stories` array declares. A story whose `platforms` excludes the running OS is
not listed, and its deep link redirects to the index like an unknown id.
`/developer/gallery/[story]` (`src/app/developer/gallery/[story].tsx`) renders one story as the
whole screen under the compact native header titled with the story's translated name, with no
gallery chrome around it, so focus order and Back are what ships. Story ids are
`<meta id>--<kebab-case export name>` and deep-link as
`timecalendar-dev://developer/gallery/<id>` (`timecalendar://…` on preview builds); an unknown id
redirects to the index. A story opened by a cold or warm deep link puts the gallery index beneath
itself (`useGalleryIndexAnchor`, `src/features/developer/ui/gallery-anchor.ts`): on mount and on
every root Stack `state` event while the story is focused with no index anywhere below it, it resets the
Stack with the same routes and keys plus `developer/gallery` under the story, so Back returns to
the index and then to where the app was. The listener is load-bearing: on a cold link the
container commits its initial state just after the story's first effect and reverts that reset. A
story with the index anywhere below it (opened from the index, or linked above another story)
leaves the stack alone. `gallery-anchor.test.ts` covers the cold,
warm, reverted and already-anchored stacks, and `gallery-story-screen.test.tsx` asserts no reset
on a redirect. Both routes are layout-less root Stack siblings of `developer.tsx`, the `user-calendars`
shape: never add `developer/_layout.tsx` or `developer/gallery/index.tsx`.

**One gate for the `/developer` subtree.** Every screen of the subtree starts with
`isDeveloperSurfaceEnabled()` (`src/features/developer/ui/developer-access.ts`, capability not
`production`) and redirects to `/settings` otherwise.
`src/features/developer/ui/developer-routes.contract.test.tsx` discovers `developer.tsx` and every
route under `src/app/developer/`, requires each to be a thin re-export from
`@/features/developer/ui`, and renders each with the `production` capability expecting the
redirect and no content. See ADR [064](./decisions/064-in-house-component-gallery.md).

Settings pages are the native-list exception defined by ADR
[060](./decisions/060-platform-native-settings-composition.md): Expo Router still owns the root
header and `/language-settings` push, while the page's SwiftUI Form or Material LazyColumn owns the
only content scroll/insets. No nested native navigation container is allowed.

Notification settings follows that exception completely. On iOS, `/notification-frequency` and
`/notification-days-ahead` are Router pushes and `/notification-days-custom` is a Router-owned
form sheet; each thin route renders exactly one SwiftUI Form. Android keeps the same parent route
and presents chrome-owned Material dialogs. Feature code owns choices, validation, and commits,
while Router remains the sole navigation/presentation owner and native chrome the sole scroll and
inset owner (ADRs [056](./decisions/056-compose-native-dialog-behind-chrome.md) and
[060](./decisions/060-platform-native-settings-composition.md)).

`/timezone-settings` remains the deep-linkable native automatic/manual mode owner.
`/timezone-chooser` is its thin root sibling: iOS uses a tall Router form sheet with native
toolbar/header search adaptation, while Android uses a full-screen modal with native back. The
chooser has no nested navigator; one inset-aware `FlatList` owns all result scrolling.

The nested onboarding Stack follows the same compact defaults while its root container stays
headerless. Its explicit inventory is `index`, `school`, `institution-name`, `programme`,
`connect`, `export-guide/providers`, `export-guide/[pageIndex]`, `import`, `qr-scan`, `ical-url`,
and `groups`; only the branded `index` landing is
headerless. Feature screens own every localized title and platform action. The QR camera remains
full-bleed content below its visible header. The route-structure suite recursively compares both
the root and onboarding files with these registrations so auto-discovered routes cannot acquire an
implicit header posture.

## Route screens that need a test are thin entrypoints over a feature `ui/` module (or a shared `@/components` module for shell screens)

Expo Router's `require.context` bundles **every** `*.tsx` under `src/app/` as a route — a colocated `*.test.tsx` drags `@testing-library/react-native` (Node-only `console`/`picocolors`) into the Metro bundle and breaks it. The `routes-not-importable` lint then forbids importing the route from a test elsewhere.

So the screen lives outside `src/app/` (tested there), and `src/app/<name>.tsx` is a one-line re-export. A feature screen lives in its feature's `ui/` sublayer — `src/features/<feature>/ui/<name>-screen.tsx` — and the route is `export { <Name>Screen as default } from "@/features/<feature>/ui"` (through the `ui/` sub-barrel); a shared shell screen (the tab bar) stays in `src/components/`. `ui/` is under `src/features/`, not `src/app/`, so it's a valid home for the colocated test, same as `src/components/`. Enforced indirectly by the lint boundary; the Metro-bundling half can't be a lint rule, hence this prose.

## Non-tab routes require a root `Stack` with the tabs in a `(tabs)` group

Under a root `NativeTabs` layout, only declared `NativeTabs.Trigger` routes are reachable — a bare sibling route is registered but **cannot** be navigated to (`hidden` triggers are unreachable too).

The layout is therefore:

- `src/app/_layout.tsx` = root `Stack` (+ the QueryClient/Theme providers).
- `src/app/(tabs)/_layout.tsx` = the native tabs; tab screens under `(tabs)/`.
- Non-tab routes (deep-link / modal / onboarding targets) as `Stack` siblings of `(tabs)`.

The stable tab hierarchy is Home · Calendar · Settings (ADR
[034](./decisions/034-settings-third-tab-identity.md)). Calendar and Settings each own a
nested native Stack while retaining `/calendar` and `/settings` as their canonical
tab routes. `src/app/(tabs)/settings/index.tsx` is a thin export from
`@/features/settings/ui`; derivation and tested presentation stay in the feature.
The root `/profile` route is a compatibility redirect to `/settings` for one released
React Native version, and is not an internal navigation target.

`/about` is a root Stack sibling with a visible localized header and a one-line route export
from `@/features/about/ui`. The Settings hub's explicit App section owns the `/about` entry;
the feature owns the content and consumes Settings' exported grouped-list primitives.

Root `/feedback` is a header-capable Stack sibling reached from Settings or a recorded
iCal import failure. Its optional route parameters are limited to `calendarUrl`,
`schoolId`, `schoolName`, and `calendarName` (the normalized programme name from the
import draft, omitted when empty); the route is a thin re-export from the feedback feature.

`/activity` is a visible-header root Stack sibling reached from the Settings Events section and
deep-linkable as `timecalendar-dev://activity`. `src/app/activity.tsx` is a one-line re-export
from `@/features/activity/ui`; grouping, pagination, errors, and accessibility remain feature-owned.

`/changelog` is a visible-header regular root Stack destination reached from About and
renders every bundled release. `/changelog-sheet` is a visible-header root modal: an iOS
form sheet with a large detent/grabber and an Android full-screen modal. Both are thin route
exports over `features/changelog/ui`. The automatic `ChangelogGate` mounts only inside the
`(tabs)` layout, never the root or onboarding Stack, so tabs arrival is the first eligible
presentation point and cold onboarding cannot be covered.

The nested `onboarding` group is **welcome-first** (ADR [015](./decisions/015-onboarding-flow-shape.md)): `onboarding/index` = the welcome surface (`timecalendar-dev://onboarding`), `onboarding/school` = the school picker (`…/onboarding/school`). Its index is the first-run deep-link surface, not the bare list; adding calendars from Settings continues through calendar management's native header action.

From the school step the group carries the **import journey** (ADR [047](./decisions/047-ephemeral-calendar-import-draft.md)). Listed schools visit only their server-required Programme and safe Connect gates, then resolve their exact guide version at `onboarding/export-guide/0`. Unlisted schools visit the skippable Programme step, never Connect, and choose from the active catalogue at `onboarding/export-guide/providers`. `onboarding/export-guide/[pageIndex]` pushes one Stack entry per validated page; final Next records in-memory completion and pushes `onboarding/import`, which offers the existing `onboarding/qr-scan` and `onboarding/ical-url` siblings. Both export-guide routes are one-line exports from `@/features/export-guides/ui`; the remaining journey routes stay thin exports from their owning feature.

Durable QR/iCal completion targets the headerless root sibling
`/calendar-import-result` with `router.dismissTo`, removing the onboarding Stack while retaining the
existing `(tabs)` anchor below it. The result owns the fresh event-sync pass and carries no import
parameters. Its failure Continue and success action both use `dismissTo("/calendar")`, which pops
to the existing tabs entry and selects Calendar rather than adding another tabs entry. QR's
**Change method** dismisses to the existing import chooser, preserving the completed draft.
Selecting iCal opens its input directly; source switching does not grow native history. These contracts are recorded in ADR
[059](./decisions/059-calendar-import-finalization.md).

`onboarding/groups` (`…/onboarding/groups?schoolId=<id>`) is **off the normal path** — it persists a selection and dismisses without creating a calendar. It keeps its route and stays deep-linkable; deleting it is a separate cleanup.

`src/app/onboarding/_layout.tsx` mounts `ImportDraftProvider` around the nested `Stack`, so one discriminated journey state wraps every route in the group. The state pins validated guide pages, locale, catalogue version, provider, draft revision, visited bound, completion, and guarded manual handoff only in branches where those values are legal. It survives backgrounding while the process and Stack stay mounted, but is never persisted. Completed guide pages remain navigable after Back; advancing them preserves completion and emits no duplicate completion event. Manual import requires current completion; QR and iCal additionally require the matching manual-selector handoff. Only the focused protected source route performs recovery. Completed journeys recover to their selected QR/iCal handoff (or the import chooser before selection), so changing source never restarts the guide. The chooser commits the selected handoff before opening the corresponding source. For incomplete journeys, illegal direct or restored routes replace themselves with provider selection for a complete unlisted draft, page 0 for a complete listed draft, or School otherwise. A recovery target equal to the current route renders closed recovery instead of replacing itself.
