**For:** the planner of the next mobile accessibility or design-system change. No human action is
needed. This is a scoped follow-up, not a device task.

# Android confirmation dialogs render AppCompat, not Material 3

## What I need

A dedicated OpenSpec change that makes Android confirmations render as Material 3 dialogs seeded
with the brand pink, in light and dark. OpenSpec `fix-mobile-a11y-device-findings` (item 8)
deferred it.

**Current state.** React Native's `Alert.alert` on Android builds an AppCompat `AlertDialog` inside
`AlertFragment` (`react-native/ReactAndroid/.../modules/dialog/AlertFragment.kt`). It is themed by
`alertDialogTheme` under the CNG base theme `Theme.AppCompat.DayNight.NoActionBar`, which gives a
teal accent and ALL-CAPS buttons. There are six call sites, in three shapes:

| Call site                                                                  | Shape                        |
| -------------------------------------------------------------------------- | ---------------------------- |
| `features/personal-events/ui/use-personal-event-delete-confirmation.ts`    | Cancel + destructive confirm |
| `features/calendar-sources/ui/user-calendar-detail-screen.tsx`             | Cancel + destructive confirm |
| `features/environment/ui/use-environment-selector.ts` (confirm)            | Cancel + destructive confirm |
| `features/environment/ui/use-environment-selector.ts` (selector, iOS only) | N choices + Cancel           |
| `features/calendar/ui/event-details-actions.tsx` (hide)                    | two actions + Cancel         |
| `features/feedback/ui/feedback-screen.tsx`                                 | single-button notice         |

**Recommended design** (consistent with ADR 056 / ADR 060 and `theming.md`, where every Compose host
receives `seedColor = primary`):

- A chrome primitive (for example `chrome/native-confirm-dialog.tsx`) with a hook API that returns
  `{ present(options), element }`. On Android, `element` renders an `@expo/ui` Compose
  `AlertDialog` in its own seeded `Host`. It is a sibling after any `NativeList`, and the
  existing `useAssertOutsideNativeList` guard enforces that. Destructive actions use M3
  `error`. Back and outside taps dismiss as Cancel. On iOS, `present` calls `Alert.alert`
  (UIAlertController is already native-correct) and `element` is `null`.
- Compose `AlertDialog` has two button slots. The three-button hide chooser therefore stacks its
  actions in the text slot, or moves to a native menu on Android.
- Lint: ban `Alert` from `react-native` in `src/features/**` (a `no-restricted-imports`
  `importNames` entry), with an exemption for the chrome module. Write an ADR for the primitive.
- Tests: the primitive's Android and iOS branches, plus each migrated call site's existing
  behavior tests rewritten against the dialog's test IDs.

**Rejected:** a config plugin that points `alertDialogTheme` at a Material 3 overlay. It needs every
M3 color role as static XML for both schemes (generated from the seed). It depends on AppCompat
button inflation honoring M3 widget styles, keeps React Native's own `alert_title_layout`, and still
does not produce the 28dp M3 surface. None of it is observable in Jest, so the result can only be
judged on a device.

## Why

The change needs a new chrome primitive, an ADR and six call-site migrations with their tests. That
is larger than the device-findings fix set, and it would have tripled that PR.

## How to verify

On an Android device in light and dark, each of the six flows shows a rounded M3 dialog with
sentence-case pink (or error-red for destructive) text buttons. TalkBack reads the title, the
message and the buttons. iOS behavior is unchanged.

## Blocks

Nothing. The AppCompat dialogs work; they are off-brand on Android.
