# Design — mobile a11y (the runtime half of step 7)

## Context

`mobile/` already enforces the **lint half** of accessibility: `react-native-a11y/has-accessibility-props`, `…/has-valid-accessibility-descriptors`, `…/has-valid-accessibility-role`, `…/no-nested-touchables` all run as `error`, and `i18next/no-literal-string` includes `accessibilityLabel`/`accessibilityHint` in its JSX-attribute list so a11y copy is translated too. These landed with `add-mobile-lint-format` (step 4), ahead of schedule. What is *not* present is any runtime proof that the accessibility tree resolves to something meaningful, and the skeleton's titles carry no heading semantics. This is foundation step 7 (migration-approach §1's vertical-slice order: UI → data → storage → i18n → **a11y**). It mirrors how `add-mobile-i18n` (step 6) closed out: lint half already live, this change adds the runtime semantics, the CI proof, the Architecture Book section, and marks the roadmap step done.

Constraints shaping the design:
- **The skeleton has no interactive controls.** No `Pressable`/`TouchableOpacity` exists anywhere in `mobile/src` — so the four `react-native-a11y` touchable rules currently have nothing to bite on. The first real touchable (a button in onboarding/Settings) will be their first live test. Inventing a touchable now to exercise them is speculative scaffolding (R-2).
- **The platform is the design reference (R-3).** iOS VoiceOver and Android TalkBack are the targets; `accessibilityRole`, `accessibilityState`, Dynamic Type, and the 44pt/48dp touch-target minimums are platform contracts, not Flutter-app ports.
- **R-1**: encode in tooling before prose. The a11y lint rules already exist. The new encoding lever this slice adds is the **`ThemedText` heading-role contract** — a component-level encoding, because lint cannot know which `<Text>` is a heading. Everything genuinely un-encodable (Dynamic Type, touch targets, manual screen-reader passes, reduced motion, contrast) is recorded as prose with its reason and owner.
- **R-2 / no speculative divergence**: no new lint rules, no font-scaling system, no touch-target helper, no reduced-motion hook this slice — each is recorded as deferred debt, earned by the step/feature that first needs it.

## Goals / Non-Goals

**Goals:**
- Screen titles carry `accessibilityRole="header"`, encoded in `ThemedText` (`type="title"`/`"subtitle"`), so heading navigation works for VoiceOver/TalkBack.
- The skeleton's surviving screens (schools, Home/Profile stubs) expose correct, meaningful semantics; loading/error states are announced as accessible status.
- One unit test proves an accessibility role/semantic resolves in the rendered tree (not merely that the lint rules are configured).
- The Architecture Book gains an a11y section: what lint enforces and where it bites, the heading contract, and the prose rules for everything lint can't encode — each with its reason and owner.
- The step-4 note ("the strings + a11y rules from steps 6–7 are already live") is resolved; roadmap step 7 marked done.
- `tsc`, `npm run lint` (zero warnings), `npm test` all green.

**Non-Goals:**
- **No new lint rules.** The four `react-native-a11y` rules + the i18n a11y-attribute coverage are sufficient for the current surface; a Dynamic-Type override guard is recorded as deferred debt, not built.
- **No invented touchables / interactive controls** to exercise the touchable rules — speculative (R-2). They go live with the first real control.
- **No a11y infrastructure**: no font-scaling system, no touch-target helper component, no reduced-motion hook — earned by the feature/step that needs them.
- **No manual screen-reader DoD checklist built here** — the DoD is one of the five living artifacts (roadmap step 12, not yet created); this change names a11y's place in it.
- **No theming/contrast work** — owned by theming (step 10) and the splash DoD (step 13).

## Decisions

### D1 — Heading semantics encoded in `ThemedText` (not a lint rule)
`ThemedText` maps `type="title"` and `type="subtitle"` to `accessibilityRole="header"`, merged with any caller-supplied props (an explicit `accessibilityRole` on the call site still wins). Lint cannot decide which `<Text>` is semantically a heading — that's authorial intent tied to the visual `type` — so the component is the R-1 enforcement point: choosing the heading *style* now also yields the heading *role*, and the two can't drift apart. *Alternative:* require every title call site to pass `accessibilityRole="header"` by hand — rejected: unenforceable (no lint can catch a *missing* header role on an arbitrary Text) and pure boilerplate. *Alternative:* a `no-restricted-syntax` lint rule keying on `type="title"` — rejected: brittle JSX-shape matching, and the component already owns the type→style mapping, so it should own type→role too.

### D2 — Accessible status for async states
The schools screen's loading and error text are transient status messages. They render through `ThemedText` and remain readable by the screen reader; where it adds real value without speculative scope, the status container is marked so assistive tech announces the state change (e.g. an accessible status/`accessibilityLiveRegion="polite"` on Android / `accessibilityRole` on the status text). Kept minimal — the schools screen dies when real onboarding lands (it's the test/e2e round-trip surface), so this is correctness, not investment.

### D3 — The CI proof asserts a *role*, not just text
The i18n proof asserted a translated string renders; the a11y proof asserts an accessibility *semantic* resolves. A unit test renders a title-bearing component through the real i18n instance (the Jest suite already initializes i18n via `jest/setup-i18n.ts`) and queries the accessibility tree by role — `getByRole('header')` must find the title node. This proves the `ThemedText` header contract reaches the rendered a11y tree end to end, the layer lint can't see. RNTL 14's `render`/queries are used as established by the test harness (RNTL `render` is awaited per the harness conventions). *Alternative:* assert on the raw `accessibilityRole` prop — rejected: tests the prop, not the resolved tree; `getByRole` exercises the same path a screen reader does.

### D4 — Touchable a11y rules stay live but unexercised; recorded, not faked
The four `react-native-a11y` touchable rules remain `error`. With no touchable in the skeleton they currently guard an empty surface — that is honest and correct (they catch the *first* control the day it's added, which is the point of wiring cross-cutting systems before features). The Architecture Book records this explicitly: the rules are live, their first real test is the first interactive control (onboarding/Settings). No touchable is invented to "prove" them (R-2). *Alternative:* add a throwaway accessible button to a stub — rejected as speculative scaffolding that dies at the next feature.

### D5 — What lint can't encode → prose in the Architecture Book (R-1), each with reason + owner
The a11y section records, as prose because none is a sound lint rule:
- **Dynamic Type / font scaling** — RN `Text` scales with the OS font size by default; the posture is simply *never* pass `allowFontScaling={false}`. Not encoded as a lint rule this slice (no offender exists); a `no-restricted-syntax` guard is recorded as deferred debt to add the day someone reaches for it.
- **Touch-target minimums (44pt iOS / 48dp Android)** — a runtime layout property, not statically checkable; no touchable exists yet. Owned by the first interactive control and the DoD a11y checklist.
- **Meaningful labels** — lint guarantees a label *exists* on a touchable, never that it's *meaningful* or correctly translated; human review + the translated-copy rule cover semantics.
- **Manual screen-reader passes (VoiceOver / TalkBack)** — runtime behavior (focus order, grouping, announcement quality) no static tool can assert; owned by the DoD (roadmap step 12), which this change names a11y's slot in.
- **Reduced motion** — no animations exist now (the Expo splash animation was deleted in step 6); the real splash (step 13) and any future animation must honor `AccessibilityInfo.isReduceMotionEnabled`. Recorded so step 13 inherits the obligation.
- **Color contrast** — a theme-token property, not lint-encodable; owned by theming (step 10) and the splash DoD.

### D6 — No spec change to `mobile-lint-format`
This change adds the new `mobile-a11y` capability and points back at the existing a11y lint rules; it does not alter their spec-level requirements. The rules' mode and options are untouched. The Architecture Book a11y section is new prose, normal book evolution — not a requirement change to `mobile-architecture-book`.

## Risks / Trade-offs

- **Touchable rules guard an empty surface** → accepted and documented (D4); wiring the rule before the feature is the foundation philosophy, and the first control is its first real test. Not a gap, a deliberate ordering.
- **Heading role merged in `ThemedText` could collide with a caller's explicit `accessibilityRole`** → the caller's explicit prop wins (props spread last / role only defaulted when unset); covered by keeping the merge order explicit and a test for the default-path.
- **The a11y proof tests a thin surface (one role)** → accepted: it proves the encoded contract reaches the resolved tree, which is exactly the layer lint can't see; depth grows with the first real feature's own a11y tests, not with invented skeleton coverage.
- **Dynamic Type not encoded as a lint rule** → low risk today (no `allowFontScaling={false}` anywhere); recorded as deferred debt so it's added the moment an offender could appear.
- **`getByRole('header')` depends on RNTL/jest-expo resolving `accessibilityRole` to a role** → standard RNTL behavior; the proof test itself is the verification, and the existing harness conventions (awaited `render`) apply.

## Migration Plan

Additive, no runtime data, server, or native-config impact; rollback = revert the change. Order: encode the header role in `ThemedText` → verify/correct the schools + stub screen semantics (headers; accessible async status) → add the a11y proof test → update the Architecture Book (a11y section + resolve the step-4 note) → mark roadmap step 7 done. Gate locally and in CI on `tsc`, `npm run lint` (`--max-warnings 0`), `npm test`.

## Open Questions

None blocking. Deferred (recorded, not built): a Dynamic-Type override-guard lint rule; a touch-target minimum helper; a reduced-motion hook; contrast checks; the manual screen-reader DoD checklist (lands with the DoD artifact, roadmap step 12). Each is earned by the step/feature that first needs it.
