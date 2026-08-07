# Settings hub Definition of Done evidence

## Automated evidence

- Architecture: feature-owned data/UI, thin nested route, ADR 034, and route-structure tests.
- Types: `npx tsc --noEmit` passes.
- Lint: `npm run lint` passes, including boundaries, accessibility, i18n, and formatting.
- Tests: 93 suites and 621 tests pass with coverage; Settings selector lines/branches exceed 90% and Settings presentation exceeds 70%.
- E2E: `.maestro/settings.yaml` covers tab entry, live groups, calendar management, Appearance & language, and return navigation. It still needs execution on both platforms.
- i18n: typed EN/FR catalogs contain complete Settings keys.
- Observability: N/A. Settings performs no writes, network requests, or fallible actions of its own.
- Product analytics: N/A. The navigation hub introduces no new analytics contract.
- Documentation: ADR, navigation, feature map, migration references, and Architecture Book changelog are current.

## Manual-only evidence still required

- iOS: tab selection/icon, large-title collapse, content insets, pressed treatment, dark mode, VoiceOver order, accessibility text sizes, and zero/one/multiple-school fixtures.
- Android: tab selection/icon, header/scroll behavior, ripple, dark mode, TalkBack order, large font/display scaling, zero/one/multiple-school fixtures, and low-end-device responsiveness.
- Both: cold-launch `/profile` redirect and every canonical destination/deep link.

The connected Android device contains the pre-change build, and no TimeCalendar build is installed on the available iOS simulator, so these checks cannot be claimed from automated source verification.
