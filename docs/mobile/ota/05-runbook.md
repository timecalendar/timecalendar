# 5 — Day-one runbook

*How we'd actually operate OTA. Draft — it becomes the real release checklist once the server
is standing and the exact command syntax has been verified on a real device (tasks 4–6 in
[document 4](./04-recommendation.md) §4.7).*

The premise of this document: **the tool is easy, the discipline is the product.** Everything
here exists to stop the ability to ship in an hour from becoming the habit of shipping
carelessly.

Commands below use `eoas`, xprem's CLI ([document 4](./04-recommendation.md)). On the hosted
fallback the equivalents are `eas update`, `eas update:rollback` — same concepts, different
binary.

---

## 5.0 Two postures, not one process

You asked for OTA to serve two different phases, and they want different amounts of friction:

| | **Launch posture** (first ~6–8 weeks after 3.0) | **Steady posture** (after) |
| --- | --- | --- |
| Expectation | Frequent hotfixes; the RN port meets 60,000 real users for the first time | Store releases are the norm; OTA roughly bi-weekly |
| Publish days | Any weekday. Friday afternoon still requires a live incident | One fixed publish day. Never Friday afternoon |
| Rollout pauses | ~30 min between 10% → 50% → 100% | ≥1 hour, and overnight before 100% |
| Non-negotiable in both | **`preview` first. Staged rollout. Watch Crashlytics. Roll back rather than fix forward.** | ← same |

The launch posture buys speed by shortening the *pauses*, never by skipping the *steps*. The
step most likely to be dropped at 1am — rolling back instead of fixing forward — is the one
that matters most when 60,000 phones already have the bad bundle.

---

## 5.1 The channels

`preview` and `production` are already defined in `mobile/eas.json`;
[document 7](./07-environments-and-testing.md) proposes adding `beta`.

| Channel | Who's on it | How they installed it | Purpose |
| --- | --- | --- | --- |
| `preview` | Us, on our own phones | TestFlight internal / Play internal testing | Every update lands here first. Cannot reach real users. |
| `beta` *(proposed)* | Opted-in students | TestFlight external / Play closed testing | Real-world exposure before general release; also our fast lane past Beta App Review |
| `production` | Everyone with the store app | App Store / Play | Real students. Rollouts and monitoring mandatory. |

**Rule 1: nothing reaches `production` that hasn't run on `preview` first.** Not "usually" —
always. The whole point of the internal channel is that it costs us nothing and catches the
embarrassing class of mistake.

---

## 5.2 Before publishing: the checklist

1. **Is this OTA-able at all?** If the change touches `mobile/app.config.ts`'s plugin list, or
   adds a dependency with native code, it needs a store release. The fingerprint policy will
   enforce this whatever we believe — so check first rather than wondering later why nobody
   got the update. The EAS CLI can compare the fingerprint of the working tree against a
   published build; use it when in doubt.
2. **Is it allowed?** It must not change what the app fundamentally is, must not add a
   store-within-the-app, must not bypass OS security ([document 1](./01-what-is-ota.md) §1.5).
   For bug fixes and normal features this is a formality — but **never** use OTA to reinstate
   something App Review rejected. That's the one line that gets accounts terminated.
3. **Is CI green?** Types, lint, tests. OTA skips App Review — it must not also skip ours.
4. **Has it run on `preview`?** On a real device, not just a simulator.
5. **What time is it?** Never publish to `production` after 16:00 or on a Friday, unless it's
   an active incident. Someone has to be awake to watch it. (Launch posture relaxes the *day*,
   not the *someone awake* part — see §5.0.)

---

## 5.3 Publishing

### First: what an update actually contains

**An update is a snapshot of the entire JavaScript bundle, not a patch.** There is no way to
ship "just this one fix" — whatever is in the tree you publish from *is* the update. A typical
update therefore carries several fixes, and that's normal.

The failure this creates: publish from `main` to fix one crash, and you also ship every feature
that merged that morning — half-finished, never run on a device, now on 60,000 phones. The fix
was urgent; its cargo wasn't.

**So we publish from a release branch, never from `main`.** Work merges to `main`; anything
destined for users is cherry-picked to `release/3.0`; we publish `release/3.0`. The same branch
is what makes hotfixing an older line straightforward
([document 6 §6.2](./06-your-questions-answered.md)) — one mechanism, two problems solved.

### The sequence

```bash
# 0. Assemble the update on the release branch, then tag it.
git switch release/3.0
git cherry-pick <sha>...          # the fixes going out, and only those
git tag ota/3.0.4 && git push --tags

# 1. `preview` first. Always.
npx eoas publish --branch preview \
  --message "3.0.4 — TIM-201 duplicate events on week boundary, TIM-205 FR month names, TIM-208 crash on empty week"

# 2. Real device check on a preview build. Cold-start twice: once to download,
#    once to run the new bundle.

# 3. Production, to 10% of users.
npx eoas publish --branch production --message "3.0.4 — TIM-201, TIM-205, TIM-208"
#    then set the rollout to 10% (CLI flag or the xprem dashboard — exact syntax
#    pinned down in task 4 of document 4 §4.7, before this becomes the real checklist)

# 4. Watch (see §5.4). Then widen.
#    → 50%, watch again, → 100%.
```

Once task 10 in [document 4](./04-recommendation.md) §4.7 lands, steps 1 and 3 are a CI
workflow triggered by that tag, with an approval gate on `production` — same sequence, run by a
machine, with the credentials off anyone's laptop.

**Rule 2: staged rollout on `production` is mandatory.** 10% → 50% → 100%, with a real pause
between steps. The split is decided server-side and is deterministic — a given phone is
consistently inside or outside the 10%, it doesn't re-roll on each launch
([document 6 §6.12](./06-your-questions-answered.md)). A bad update caught at 10% is an
inconvenience; the same update at 100% is an incident.

Note the constraint: **only one update per branch can be rolling out at a time** for a given
runtime version. Finish or revert the current rollout before publishing the next one. That's
deliberate — it stops two half-rolled-out changes overlapping so you can't tell which one broke
things.

**Message discipline:** a version-ish title plus the issue references, and a matching git tag.
In six months the update list in the xprem dashboard is the only record of what shipped when —
make it readable, and make every entry traceable to a SHA.

---

## 5.4 The monitoring window

After each rollout step, watch for **at least one hour** (overnight before going to 100%):

- **Crashlytics** (`timecalendar-samuelprak`) — a crash-free-rate dip is the signal. It's the
  reason we already ship Crashlytics, and the reason we don't need xprem's ClickHouse-backed
  metrics stack ([document 4](./04-recommendation.md) §4.7). **This only works once we tag
  reports with the OTA update id** — Crashlytics groups by *native* build, so without the tag a
  post-OTA crash appears under the build that was healthy yesterday. Task 9 in
  [document 4](./04-recommendation.md) §4.7; mechanism in
  [document 6 §6.14](./06-your-questions-answered.md).
- **Adoption** — the xprem dashboard shows how many devices took the update. Zero adoption
  after 30 minutes usually means a fingerprint mismatch: the change needed a store release
  after all.
- **Our own OTA server** — new on the self-hosted path. If the manifest endpoint is erroring or
  saturated, nobody gets the update and adoption looks identical to a fingerprint mismatch.
  Check it before concluding anything from a flat adoption curve.
- **Server errors** — a JavaScript update that starts calling the API differently shows up in
  the NestJS logs before it shows up in a crash report.

**Rule 3: if the crash-free rate drops at all, roll back first and diagnose afterwards.** Never
debug forward on a live fleet.

---

## 5.5 Rolling back

```bash
npx eoas rollback   # pick the branch and the update to revert to
```

Users return to the previous bundle on their next cold start — typically within a day, faster
for anyone actively using the app.

If no previous OTA update exists on that branch, the rollback returns users to the bundle
embedded in the store binary — the version App Review approved. **There is always a floor to
fall back to.** That's the safety property that makes OTA acceptable at all.

**Rule 4: rehearse this on `preview` before we ever need it on `production`.** The first
`eoas rollback` we run must not be at 23:00 during an incident.
(Task 5 in [document 4](./04-recommendation.md) §4.7.)

---

## 5.6 The failure modes, and what each one means

| Symptom | Almost certainly | Do this |
| --- | --- | --- |
| Update published, **nobody receives it** | Fingerprint mismatch — the change touched native code | Ship it as a store release. This is the safety net working, not a bug |
| Update received, **app crashes on launch** | Bad bundle | Roll back (§5.5). `expo-updates` also auto-falls-back to the embedded bundle after repeated launch failures |
| **Some** users get it, others don't | Rollout percentage isn't at 100 yet, or they're on an older store binary with a different fingerprint | Check the rollout state; check which store versions are live |
| Updates stop working entirely, mid-month | *Only on the hosted fallback:* the free-plan MAU cap ([document 3](./03-costs.md) §3.2). Doesn't exist on self-hosted — there is no meter | Upgrade the plan |
| Update works on iOS, breaks on Android | A platform-specific JS path — OTA is cross-platform by default | Roll back; fix; re-test on both before republishing |
| **Nobody receives it, and the fingerprint is fine** | Our own OTA server is down or erroring — the self-hosted failure mode | Check the pod and the manifest endpoint. Phones keep running their current bundle meanwhile, so this delays a fix; it doesn't break the app |

---

## 5.7 What still requires a store release

The list from [document 1](./01-what-is-ota.md) §1.3, restated as a hard gate. **All of these
need a full build, submission and review — no exceptions, and the fingerprint policy will
enforce it whether or not we remember:**

- Expo SDK or React Native version bumps
- Any new native dependency, or removing one
- Changes to `app.config.ts`'s `plugins`, `ios`, or `android` sections
- New OS permissions
- App icon, name, splash screen
- Minimum iOS/Android version changes
- Anything the store listing shows (screenshots, description, price)

---

## 5.8 The four rules, on one line each

1. **`preview` first** — before `production`, always, on a real device.
2. **Roll out in stages** — 10% → 50% → 100%, with a real pause between each.
3. **Watch, then widen** — a crash-free-rate dip means roll back first, diagnose second.
4. **Rehearse the rollback** — before we need it, not during.

---

## 5.9 Open items to settle when we implement this

- **Update-check UX.** Today only `updates.url` is configured; the check-on-launch behaviour and
  startup timeout are inherited defaults. The recommendation is now written down —
  don't block the splash, apply on return-to-foreground, never prompt — in
  [document 6 §6.16](./06-your-questions-answered.md). Still needs implementing and measuring
  against a real adoption curve. (Task 3 in [document 4](./04-recommendation.md) §4.7.)
- **Channel stamping for locally-built binaries.** A channel is a label baked into the binary at
  build time and sent as the `expo-channel-name` header; `eas build` writes it from `eas.json`,
  but a local build doesn't read `eas.json` and would silently receive **no updates at all**.
  The fix is to set it in `app.config.ts` via `updates.requestHeaders` — with one subtlety about
  whether that feeds the fingerprint, to verify on a device.
  [Document 6 §6.17](./06-your-questions-answered.md). (Task 4.)
- **Exact rollout-percentage syntax** in the `eoas` CLI, pinned during task 4. Deliberately not
  guessed here — this document gets followed during incidents.
- **An ADR** in `docs/mobile/architecture-book/decisions/` recording the final choice, so this
  investigation folder can become history rather than the source of truth.

*No longer open:* update code signing and CI publishing were listed here as deferred. Both moved
into the implementation batch after the round-2 questions — tasks 8 and 10 in
[document 4](./04-recommendation.md) §4.7.

---

*Back to the [index](./README.md).*
