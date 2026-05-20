## Context

The Phase 2 B1 audit ([TIM-36](/TIM/issues/TIM-36), Group B) listed
B7 ([TIM-49](/TIM/issues/TIM-49)) as a 19→21 major migration for
`flutter_local_notifications` plus four plus-plugin / icon / lint
bumps. The TIM-95 re-audit disproved the migration premise:

- `grep -rn "package:flutter_local_notifications/\|FlutterLocalNotifications" app/lib app/test app/integration_test`
  returns nothing.
- All push notification handling goes through `firebase_messaging`'s
  FCM foreground handler at
  `app/lib/modules/firebase/services/notification/notification.dart`.
  No local scheduling exists.
- The plugin's iOS side ships exactly one framework
  (`flutter_local_notifications.framework`) and ships nothing extra on
  Info.plist (no URL schemes, no notification background mode — the
  existing `remote-notification` `UIBackgroundModes` entry is for FCM
  and stays).
- The plugin's Android side requires Java desugaring; the
  `app/android/app/build.gradle` carries a comment naming it as the
  reason for `coreLibraryDesugaringEnabled true`.

Removing the dep cleans up dependency-graph debt, app binary size, and
one native framework. The change is small and well-scoped: one pubspec
edit (for fln) plus four version-line bumps (for the plus plugins, icon
pack, and lints), two lines deleted from the iOS pbxproj, two comment
lines removed from `build.gradle`. Dart edits are expected to be zero
for the deletion and the plus-plugin bumps; the `font_awesome_flutter`
bump may touch icon call sites only if v11 renames a constant currently
in use.

The safety net is the same as B3
([TIM-38](/TIM/issues/TIM-38)), B4 ([TIM-87](/TIM/issues/TIM-87)), and
B6 ([TIM-91](/TIM/issues/TIM-91)): the unit/widget suite
(`flutter test`) and the Phase 1 E2E smoke suite
(`app/integration_test/`, run in CI). The iOS build is verified by
CI's iOS build job — the Linux Applier host has no Ruby/CocoaPods/Mac,
so `pod install` is deferred to CI (precedent from TIM-88).

## Goals / Non-Goals

**Goals:**

- `flutter_local_notifications` is gone from `app/pubspec.yaml` and the
  resolved `pubspec.lock`.
- The iOS pbxproj no longer carries stale Pods-script-phase entries
  for the `flutter_local_notifications.framework` pair, so the CI iOS
  build resolves without missing-input-file errors after `pod install`
  regenerates the Pods folder.
- `device_info_plus` is at `^13`, `package_info_plus` is at `^10`,
  `font_awesome_flutter` is at `^11`, `flutter_lints` is at `^6`.
- All Dart call sites under `app/lib/modules/suggestion/`,
  `app/lib/modules/settings/`, the ~15 icon call sites, and
  `app/test/support/settings_provider.dart` keep their behaviour. Any
  rename or breaking-change surface is handled inside the same change.
- `flutter analyze` clean, `flutter test` green, Phase 1 E2E smoke
  green in CI.

**Non-Goals:**

- Any new notification feature, any switch to a different local
  notifications plugin, any `firebase_messaging` refactor.
- Removal of `coreLibraryDesugaringEnabled` / `desugar_jdk_libs` from
  the Android build. The desugaring was added for fln but is a safe
  conservative default; removing it is a separate decision tied to
  min-SDK and Java-API audit work. The comment line that names fln as
  the reason is removed (it would otherwise lie).
- Any Android Gradle min-SDK or compileSdk bump, any Java-compat bump.
  Those belong to a future platform-minimum decision (see B4 /
  [TIM-87](/TIM/issues/TIM-87) precedent for how a real platform-min
  bump is gated).
- Removal of any other dependency, even if it appears stale.
- Refactors beyond what the dep removal and the four bumps strictly
  require.

## Decisions

### Couple the deletion and the four bumps in one change

The original B7 audit row listed all five items together as Wave 3 of
Phase 2. They share the same regression gate (Phase 1 E2E smoke) and
the same merge story. Keeping them in one OpenSpec change and one PR:

- avoids a four-PR shuffle of mechanical bumps;
- lets the Reviewer gate the wave on a single CI run;
- matches the precedent set by B3
  ([TIM-38](/TIM/issues/TIM-38)) and B4
  ([TIM-87](/TIM/issues/TIM-87)), which both bundled multiple dep
  changes under one capability delta.

*Alternative considered:* split into two changes (fln deletion + plus
bumps). Rejected — the only argument for splitting is "smaller diff",
but the deletion half is already small (pubspec + pbxproj + comment),
and a separate change pays the overhead of a second proposal / spec
delta / Apply / Simplify / Review chain for no engineering win. If
during apply the `font_awesome_flutter` rename surface turns out to be
massive (>5 icon constants need renames + cascading widget changes),
the Applier escalates to FoundingEngineer to consider a split.

### Modify `flutter-dependency-hygiene`, do not create a new capability

The B3 wave created `flutter-dependency-hygiene` for "no dead direct
dependencies, swaps preserve behaviour". B6 extended it for zombie
plugins with iOS native artifacts. B7 lands two new requirements
under the same capability: one for the fln zombie deletion (mirror of
B6's google_sign_in deletion, scoped to fln's specific artifacts) and
one for the plus-plugin / icon / lint majors that share B7's regression
gate. Stacking these under one capability keeps the spec surface tight
and the precedent obvious.

*Alternative considered:* a new `mobile-major-dep-bumps` capability for
the four plus / icon / lint bumps. Rejected — the bumps fit
"dependency hygiene" (keep versions current, ensure no analyzer
debt). A separate capability would only be warranted if the bumps
introduced new functional requirements, which they do not.

### Hand-edit the pbxproj (2 lines)

The 2 Pods-managed input/output paths in
`app/ios/Runner.xcodeproj/project.pbxproj` would normally be rewritten
by `pod install` on a Mac after the pubspec change. The Linux Applier
host cannot run `pod install` (no Ruby/CocoaPods, no Mac). CI runs
`pod install` from a clean checkout in the iOS build job, but CI
builds in a sandbox and does **not** commit pbxproj changes back. So
if the committed pbxproj keeps the stale entries, the CI iOS Xcode
build will validate the `inputPaths` of the `[CP] Embed Pods
Frameworks` script phase against the freshly-regenerated `Pods/`
folder, find
`${BUILT_PRODUCTS_DIR}/flutter_local_notifications/flutter_local_notifications.framework`
missing, and fail.

The fix is a mechanical 2-line delete on the Applier host:

- 1 line in `[CP] Embed Pods Frameworks` `inputPaths`
  (`${BUILT_PRODUCTS_DIR}/flutter_local_notifications/flutter_local_notifications.framework`)
- 1 line in `[CP] Embed Pods Frameworks` `outputPaths`
  (`${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/flutter_local_notifications.framework`)

The Applier identifies the lines via the exact grep in `tasks.md` and
deletes them, preserving comma placement of the surrounding entries.
Re-grep after the edit MUST return zero matches for
`flutter_local_notifications` inside the pbxproj. This is idempotent
and reversible (revert the PR to restore). It is the same risk class
and same Mac-deferred verification as B6's pbxproj edits — see
[TIM-91](/TIM/issues/TIM-91)'s design doc for the worked precedent.

*Alternative considered:* defer the whole PR until someone with a Mac
can run `pod install`. Rejected — the personal-project autonomy memo
says pure-eng tradeoffs land autonomously, and the edit is mechanical.
CI iOS build is the verification of record.

### Keep Android desugaring, remove only the stale comment

`app/android/app/build.gradle` enables `coreLibraryDesugaringEnabled
true` and pulls `com.android.tools:desugar_jdk_libs:2.1.4`. A comment
above the `compileOptions` block reads
`// flutter_local_notifications requires desugaring` /
`// https://pub.dev/packages/flutter_local_notifications#gradle-setup`.
With fln removed, the comment becomes a lie — it justifies a setting
based on a plugin the project no longer depends on.

The desugaring setting itself stays:

- it is safe; it adds a small amount of build time and no runtime
  cost;
- it lets the app target lower Android API levels without losing
  modern Java APIs (`java.time`, etc.);
- any future plugin that requires desugaring (`workmanager`,
  `geofence_service`, etc.) would re-introduce the requirement, and
  removing the setting now would mean re-adding it later under churn.

Removing the comment is a one-line edit. Removing the desugaring setup
is a separate platform-cleanup decision tracked in
[TIM-3](/TIM/issues/TIM-3)'s residual sweep — not in B7.

*Alternative considered:* remove desugaring entirely along with the
plugin. Rejected — the dependency-graph cost of leaving the setting
is near-zero, the cost of being wrong (a transitive plugin still
needs it on min-SDK < 26) is a broken Android release build. The
conservative default wins.

### Defer iOS native-side verification to CI

The Linux Applier host cannot validate the pbxproj edit via Xcode or
`pod install`. The Applier verifies syntactically (re-grep returns
zero matches; `git diff` is exactly the expected 2-line removal). The
binding verification of record is CI's iOS build job, which runs `pod
install --repo-update` against the cleaned pubspec and pbxproj. If CI
fails with a missing-framework or missing-input-file error, the
Reviewer's first hypothesis is a stray entry the Applier missed; second
hypothesis is the framework name format changed; escalate to
FoundingEngineer before speculative-deleting more lines.

### font_awesome_flutter v11 — verify-then-rename, do not pre-rename

The plan does not pre-bake a mapping from v10 → v11 icon names. The
Applier MUST:

1. Update `pubspec.yaml` to `^11`.
2. Run `flutter pub get`.
3. Run `flutter analyze` and capture every unresolved-symbol error
   referencing a `FontAwesomeIcons` constant.
4. For each, look up the v11 equivalent and update the single call
   site. If the v11 mapping is non-obvious or the constant is dropped
   without a replacement, escalate to FoundingEngineer rather than
   guess.

This avoids the trap of pre-baking a wrong rename map. The full list
of in-use constants — `calendar`, `calendarDays`, `eyeSlash`, `gear`,
`graduationCap`, `house`, `info`, `list`, `magnifyingGlass`,
`paperPlane`, `pencil`, `plus`, `squareCheck`, `toggleOn`,
`upRightFromSquare`, `user`, `xmark` — is in `tasks.md` for grep-back
verification.

## Risks / Trade-offs

- **pbxproj hand-edit breaks Xcode parser** → Mitigation: only line
  deletions; whitespace and comma placement of adjacent lines
  preserved; CI iOS build job is the verification gate. If CI rejects,
  the Reviewer reverts in-PR. Same mitigation as B6 / TIM-88.
- **Hidden Dart consumer of `FlutterLocalNotificationsPlugin`** →
  Mitigation: the audit grep
  (`grep -rn "flutter_local_notifications\|FlutterLocalNotifications" app/lib app/test app/integration_test`)
  returned zero matches. Re-run in pre-flight; if it ever returns a
  hit, escalate.
- **device_info_plus v12/v13 changes `BaseDeviceInfo.data` shape** →
  Mitigation: the 2 call sites in `suggestion/` use `.data` as a
  `Map<String, dynamic>`; if v12 or v13 changes the shape, `flutter
  analyze` surfaces it and the Applier updates the call site in the
  same change. Escalate if the shape change is non-trivial.
- **package_info_plus v9/v10 drops a method used by the app** →
  Mitigation: `fromPlatform()`, `.version`, `.buildNumber`, and
  `setMockInitialValues(...)` are the only API surface used (verified
  by grep). All four are highly likely to be stable across the bump,
  but `flutter analyze` is the verification of record.
- **font_awesome_flutter v11 renames more than expected** →
  Mitigation: the verify-then-rename loop in Decisions captures every
  rename in `flutter analyze` output. If the rename count exceeds 5 or
  touches subtle widget composition, the Applier escalates and
  FoundingEngineer decides whether to split the change.
- **flutter_lints v6 surfaces a flood of new lints** → Mitigation:
  v6's headline lints are well-known and small in number for a Flutter
  3.9 codebase; the Applier addresses them in the same change. If the
  lint count exceeds ~30 unique issues or any individual rule needs
  silenced project-wide, escalate to FoundingEngineer for a scoping
  call.
- **AppCheckCore / FirebaseMessaging Pods rely on
  flutter_local_notifications transitively** → Mitigation: highly
  unlikely (Firebase iOS SDK is self-contained); the CI iOS build is
  the verification of record. If a missing-framework error mentions a
  non-Firebase framework, the Reviewer escalates.
- **Comment-only edit to build.gradle is overlooked at review time** →
  Mitigation: the task explicitly enumerates the comment lines and the
  grep that proves no `flutter_local_notifications` references remain
  in the file.

## Migration Plan

Single PR, applied in the order of `tasks.md`. Rollback is a straight
revert — no data migration, no persisted format change, no
user-visible behaviour change. The deleted plugin had zero call sites,
and the four bumped plugins retain their public surface (or get
rename-mapped in this same change).

## Open Questions

- Does `font_awesome_flutter` v11 rename any of the 17 in-use
  constants? The Applier resolves this via `flutter analyze` after the
  bump; the Plan does not pre-bake an answer.
- Should `coreLibraryDesugaringEnabled` be removed in a follow-up?
  Out of scope here; tracked under [TIM-3](/TIM/issues/TIM-3) residual
  sweep.
