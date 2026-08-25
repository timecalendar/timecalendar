# 5 — Day-one runbook

*How we'd actually operate OTA. Draft — it becomes the real release checklist once the
recommendation in [document 4](./04-recommendation.md) is confirmed, and the exact command
syntax is verified on a real device first (task 3 in §4.4).*

The premise of this document: **the tool is easy, the discipline is the product.** Everything
here exists to stop the ability to ship in an hour from becoming the habit of shipping
carelessly.

---

## 5.1 The two channels

Already defined in `mobile/eas.json`:

| Channel | Who's on it | Purpose |
| --- | --- | --- |
| `preview` | Us, internal dogfood builds | Every update lands here first. Cannot reach real users. |
| `production` | Everyone with the store app | Real students. Rollouts and monitoring mandatory. |

**Rule 1: nothing reaches `production` that hasn't run on `preview` first.** Not "usually" —
always. The whole point of the dogfood channel is that it costs us nothing and catches the
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
   an active incident. Someone has to be awake to watch it.

---

## 5.3 Publishing

```bash
# 1. Dogfood first. Always.
eas update --channel preview --message "TIM-xxx: fix duplicate events on week boundary"

# 2. Real device check on a preview build. Cold-start twice: once to download,
#    once to run the new bundle.

# 3. Production, to 10% of users.
eas update --channel production --rollout-percentage 10 \
  --message "TIM-xxx: fix duplicate events on week boundary"

# 4. Watch (see §5.4). Then widen.
#    → 50%, watch again, → 100%.
```

**Rule 2: staged rollout on `production` is mandatory.** 10% → 50% → 100%, with a real pause
between steps. A bad update caught at 10% is an inconvenience; the same update at 100% is an
incident. The cost of the discipline is a few hours of latency; the cost of skipping it is our
reputation with students during enrolment week.

**Message discipline:** always include the issue reference. In six months, `eas update:list`
is the only record of what shipped when — make it readable.

---

## 5.4 The monitoring window

After each rollout step, watch for **at least one hour** (overnight before going to 100%):

- **Crashlytics** (`timecalendar-samuelprak`) — a crash-free-rate dip is the signal. It's the
  reason we already ship Crashlytics.
- **Adoption** — the EAS dashboard shows how many devices took the update. Zero adoption after
  30 minutes usually means a fingerprint mismatch: the change needed a store release after all.
- **Server errors** — a JavaScript update that starts calling the API differently shows up in
  the NestJS logs before it shows up in a crash report.

**Rule 3: if the crash-free rate drops at all, roll back first and diagnose afterwards.** Never
debug forward on a live fleet.

---

## 5.5 Rolling back

```bash
eas update:rollback   # interactive: pick the channel and the update to revert to
```

Users return to the previous bundle on their next cold start — typically within a day, faster
for anyone actively using the app.

If no previous OTA update exists on that branch, the rollback returns users to the bundle
embedded in the store binary — the version App Review approved. **There is always a floor to
fall back to.** That's the safety property that makes OTA acceptable at all.

**Rule 4: rehearse this on `preview` before we ever need it on `production`.** The first
`eas update:rollback` we run must not be at 23:00 during an incident. (Task 4 in §4.4.)

---

## 5.6 The failure modes, and what each one means

| Symptom | Almost certainly | Do this |
| --- | --- | --- |
| Update published, **nobody receives it** | Fingerprint mismatch — the change touched native code | Ship it as a store release. This is the safety net working, not a bug |
| Update received, **app crashes on launch** | Bad bundle | Roll back (§5.5). `expo-updates` also auto-falls-back to the embedded bundle after repeated launch failures |
| **Some** users get it, others don't | Rollout percentage isn't at 100 yet, or they're on an older store binary with a different fingerprint | Check the rollout state; check which store versions are live |
| Updates stop working entirely, mid-month | Free-plan MAU cap ([document 3](./03-costs.md) §3.2) | Upgrade the plan. The reason [document 4](./04-recommendation.md) recommends paying from day one |
| Update works on iOS, breaks on Android | A platform-specific JS path — OTA is cross-platform by default | Roll back; fix; re-test on both before republishing |

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

1. **Dogfood first** — `preview` before `production`, always, on a real device.
2. **Roll out in stages** — 10% → 50% → 100%, with a real pause between each.
3. **Watch, then widen** — a crash-free-rate dip means roll back first, diagnose second.
4. **Rehearse the rollback** — before we need it, not during.

---

## 5.9 Open items to settle when we implement this

- **Update-check UX.** Today only `updates.url` is configured; the check-on-launch behaviour
  and startup timeout are inherited defaults. Sane defaults, but we should choose them
  deliberately: how long may launch wait for the server on a bad connection, and do we ever
  prompt "an update is ready — restart?" or always apply silently on next cold start?
  (Task 2 in §4.4.)
- **Channel stamping for locally-built binaries.** `eas build` writes the channel into the
  binary automatically. We build locally for E2E, so we must verify how the channel is set on
  a locally-produced release build — cheap to check, annoying to discover late. (Task 3.)
- **Update code signing.** Deferred with a recorded trigger — see
  [document 4](./04-recommendation.md) §4.4.
- **An ADR** in `docs/mobile/architecture-book/decisions/` recording the final choice, so this
  investigation folder can become history rather than the source of truth.

---

*Back to the [index](./README.md).*
