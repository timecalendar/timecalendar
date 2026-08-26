# Onboarding carousel — manual on-device Definition-of-Done items

**Updated:** 2026-08-25

**Surface:** welcome → agenda → notifications carousel, then `/onboarding/school`

**Automation already owned by CI:** types, lint, component behavior/coverage, FR/EN parity, reduced-motion branches, and the shared Maestro definition.

These checks are `(HUMAN: on-device)` evidence, not implementation blockers. Use a fresh development/EAS binary because `react-native-pager-view` changes the native fingerprint. Cold-open `timecalendar-dev://onboarding` with the E2E server available for the downstream live school read.

## (HUMAN: visual design in both schemes and widths)

- On iOS and Android, inspect all three pages in light and dark mode. Confirm neutral `background` surfaces, deliberate `backgroundElement` illustration cards, readable title/body pairs, pink limited to actions/active state, and the `primaryStrong`/`onPrimary` final CTA.
- Repeat at large Dynamic Type and on a tablet/wide window. Content must remain centered within the width cap, raster art must stay contained rather than crop, and the stable top bar/pager/indicator/footer regions must not jump or overlap safe areas.

## (HUMAN: VoiceOver and TalkBack)

- Traverse each page with VoiceOver, then TalkBack. Confirm one heading and body per page, decorative illustration and arrow excluded from focus, and one grouped indicator announcement such as “Page 2 of 3” rather than three focusable dots.
- Swipe pages and use Next. Confirm both paths update the page announcement/indicator coherently; Skip is reachable on pages 1–2 only, while the final CTA is reachable on page 3 with its translated label.

## (HUMAN: native paging, motion, and touch)

- Compare a native swipe with Next on both platforms: each advances exactly one page, settles on the same page state, and preserves native gesture feel.
- Enable Reduce Motion before launch and again while the screen is mounted. Next must snap without a programmatic transition; entrance opacity and indicator width must not animate.
- Tap Skip, Next, and the final CTA at their edges. Verify ≥44pt on iOS / ≥48dp on Android and confirm Skip/final CTA both open the school picker.

## (HUMAN: fresh-binary Maestro proof)

- Build/install a fresh development or EAS binary; an OTA to a pre-pager binary is intentionally incompatible under fingerprint runtime isolation.
- Run `mobile/.maestro/onboarding.yaml` on both iOS and Android. It must assert the `TimeCalendar` welcome title, tap Next twice, assert the notifications title, activate `onboarding-welcome-cta`, and retain the seeded live `GET /schools` plus search assertions.

Record platform, OS, device class, scheme, assistive-technology state, binary/build identifier, and result when these axes are executed.
