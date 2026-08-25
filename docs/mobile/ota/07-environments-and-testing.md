# 7 — Environments, builds and testers

*You asked a question bigger than OTA: how do internal devs get builds, how do public beta
testers get new features, and does a hidden preprod/production switch inside the app make
sense? This document answers all three. OTA channels fall out of it naturally at the end.*

---

## 7.1 The three things people conflate

Almost every confusion in this area comes from treating one question as three, or three as one.
They are genuinely independent:

| # | Question | Decided by | Changeable after install? |
| --- | --- | --- | --- |
| 1 | **Which app binary do I have?** | How it was built and distributed | No — reinstall |
| 2 | **Which OTA channel does it listen to?** | A label baked in at build time | No — reinstall |
| 3 | **Which backend does it talk to?** | Runtime configuration | **Yes**, if we build a switch |

The store-distribution question (1) and the OTA question (2) are two different systems that we
line up deliberately. The backend question (3) is ours alone, and it's the one you have the
most freedom on — which is why it's the one worth designing carefully (§7.5).

---

## 7.2 The four audiences

| Audience | Who | What they need |
| --- | --- | --- |
| **Developers** | You and me, at a laptop | Instant reload, no build step, ability to point anywhere |
| **Internal testers** | Us, on real phones, away from a laptop | Real release build, quick to install, safe to break |
| **Beta testers** | Students who opted in | Real data, real backend, new features early, willing to hit bugs |
| **Everyone** | 60,000 students | Nothing broken, ever |

Each one gets its own row in the table below. That table is the whole answer.

---

## 7.3 The proposed matrix

| Audience | Distribution | EAS build profile | Bundle ID | OTA channel | Backend |
| --- | --- | --- | --- | --- | --- |
| Developers | Metro on your machine + development build | `development` | `…timecalendar.dev` | **none** — OTA inactive | switchable (local / preprod / prod) |
| Internal testers | **TestFlight internal** / **Play internal testing** | `preview` | `…timecalendar` | `preview` | preprod by default, **switchable** |
| Beta testers | **TestFlight external** / **Play closed testing** | `beta` *(new)* | `…timecalendar` | `beta` | **production** |
| Everyone | App Store / Play production | `production` | `…timecalendar` | `production` | production, not switchable |

Four things in that table deserve explanation.

### Beta testers get the *production* backend

This surprises people, so: **yes, deliberately.** Beta testers are real students with real
timetables who agreed to try new features. Point them at preprod and they see fake or stale
university data, the app becomes useless to them, and they stop opening it — at which point
they aren't testers, they're a mailing list. Real data is the entire reason their feedback is
worth having.

What makes it safe is that they're on a **separate OTA channel**, so we can push a
beta-only JavaScript build to them without touching the 60,000. That's the isolation that
matters; a separate database is not.

### `preview` and `production` share a bundle ID — and can't coexist

TestFlight and Play's test tracks distribute the **same app record** as production, so they
necessarily carry the same bundle ID (`fr.samuelprak.timecalendar`). Consequence: **on one
phone you cannot have both a preview build and the store build.** Installing one replaces the
other.

The `development` variant is different — it has its own `.dev` bundle ID, so it *does* install
alongside. That asymmetry is already in `app.config.ts` and it's the right one; just know that
"I'll keep prod on my phone and test the preview build next to it" doesn't work without a
second device.

### The `beta` profile doesn't exist yet

Today `eas.json` has `development`, `preview` and `production`, and `preview` is
`distribution: "internal"` — an ad-hoc build or a raw APK we install from a link. That's
perfect for *us*, and it's not how you reach TestFlight external or a Play closed track, which
need a store-distributed build submitted to a track.

So if we want public beta testers, we add a `beta` profile: `distribution: "store"`, `channel:
"beta"`, submitted to TestFlight external / Play closed testing. **That's the only new build
configuration in this whole document.**

### Development gets no channel at all

Covered in [document 6 §6.10](./06-your-questions-answered.md): development builds load
JavaScript from Metro and `expo-updates` doesn't run its automatic check. Your daily loop never
touches OTA.

---

## 7.4 What the store test tracks actually give us

Worth knowing precisely, because the two platforms differ in ways that shape the process.

### iOS — TestFlight

| | Internal | External |
| --- | --- | --- |
| Who | Up to **100** people with App Store Connect access | Up to **10,000**, by email or a public link |
| Review | **None.** Available minutes after processing | **Beta App Review** on the *first* build of each version |
| Turnaround | Minutes | First build: **days** in 2026 (Beta App Review backlogs have been running ~2–7 days). Subsequent builds of the same version: minutes |
| Builds expire | 90 days | 90 days |

**The operational implication is significant:** external TestFlight is *not* a fast lane. If a
public beta tester finds a bad bug, waiting for Beta App Review to fix it defeats the point.
**This is precisely what the `beta` OTA channel is for** — we push the JavaScript fix straight
to them and skip the review entirely. Beta testers are, if anything, a stronger argument for
OTA than production users are.

### Android — Play

| Track | Who | Speed |
| --- | --- | --- |
| **Internal testing** | Up to 100 testers | Available in minutes |
| **Closed testing** | Email lists / Google Groups, large | Hours (review, but lighter) |
| **Open testing** | Anyone; shows on the store listing | Hours |
| **Production** | Everyone | Full review |

**One rule worth explicitly clearing:** Google requires personal developer accounts created
after 13 November 2023 to run a closed test with **12 testers for 14 consecutive days** before
they can ship to production. **This does not apply to us** — the rule is per-app and applies to
gaining production access, and TimeCalendar already has a production app under this package
name. Version 3.0 is an *update* to that existing listing, not a new app, so it inherits
production access. **Worth confirming in the Play Console before we plan the 3.0 timeline**,
because if I'm wrong about the account's status, it's a 14-day item on the critical path and I
would very much rather find that out now than in launch week.

---

## 7.5 Switching backends inside the app

> *"I plan to add a hidden way in the app to switch between preprod and production backend
> servers (like pressing 7 times on Android to access developer mode) — does it make sense?"*

**The capability makes complete sense. The hidden-easter-egg part I'd drop, and I think you'll
prefer the alternative.**

### Why you want it — and you're right to

Without it, testing against preprod means a separate build with the URL compiled in. That means
a build cycle for every "can you check this against preprod?", which is exactly the friction
that makes people stop testing. A runtime switch turns a 20-minute round trip into 5 seconds.
That's real.

### Why I'd not do the seven-taps thing

Three reasons, in descending order of how much they'd actually bite:

1. **Support tickets you cannot reproduce.** A user who discovers the switch — and someone
   always does, because these get posted on Reddit — ends up on preprod, sees wrong or missing
   timetable data, and files a bug against production. You'd spend an afternoon on it. At
   60,000 users, "nobody will find it" is not a real assumption.
2. **App Review.** Apple's guideline 2.3.1 bans hidden or undocumented features. A tap ritual
   that unlocks a menu is close enough to the described shape that it's a coin flip with a
   reviewer, and losing the flip costs a rejection cycle during a cutover week. Low probability,
   bad timing.
3. **Attack surface, if it ever becomes free-text.** These always start as a two-option toggle
   and end as a text field so someone can point at a laptop. At that point the app will connect
   to, and send its auth token to, any host a user can be talked into typing.

### What I'd do instead

**Make it visible and ordinary — in builds where it belongs — and make it not exist at all in
the production binary.**

We already have exactly the right seam for this. `extra.appVariant` in `app.config.ts` is a
named, explicit runtime flag, and it already gates the dev-only import deep link (ADR 030) for
precisely this reason: the route file ships in every bundle, so an explicit field — not
`__DEV__`, which is false in a release-config dev build — is the actual security boundary.

Applied here:

- In `development`, `preview` and `beta` builds: a plain **"Environment" row in Settings**, or a
  small debug screen. No tapping ritual, no secret. Anyone testing can find it in two seconds,
  which is the point.
- In `production` builds: the switch is **inert** — the setting doesn't render and the
  alternative URL is never used. Same boundary as the dev import, same mechanism, already
  reviewed and understood by the team.
- Never a free-text URL field. A fixed list: `production`, `preprod`, and `local` in development
  builds only.

You get the whole benefit. You lose the App Review question, the support tickets, and the
open-redirect shape. And it's *less* code than the tap counter.

### If you still want it in production builds

Reasonable position — some teams do it so they can debug on a customer's actual phone. Then I'd
want three guardrails:

- **A fixed allowlist of hosts.** Never free-text.
- **A permanent, ugly banner** across the top while off production, so any screenshot in a
  support ticket self-identifies immediately.
- **An Analytics event** on switch, so we can see if it's being found in the wild.

### The part that's actually hard

Not the UI. **The state.** The app holds a local SQLite database, an auth token, cached
calendars and MMKV preferences — all of which belong to *one* backend. Switching environments
without clearing them gives you preprod events rendered next to production events, a token that
authenticates against neither, and a bug report that makes no sense.

So the switch has to: clear the auth token, wipe the local database, reset the query cache, and
restart the app. That's a deliberate, tested code path — an hour or two of work and a test, not
a toggle. **It's the real cost of this feature and it's worth paying**, but it should be
scoped as such rather than as "add a switch".

---

## 7.6 How this maps back to OTA

Three channels, which is what [document 6 §6.1](./06-your-questions-answered.md) proposed:

| Channel | Reached by | Purpose |
| --- | --- | --- |
| `preview` | Us, on our own phones, via TestFlight internal / Play internal | **Every update lands here first.** Cannot reach a real user |
| `beta` | Opted-in students, via TestFlight external / Play closed testing | Features and fixes that want real-world exposure before general release. Also our fast lane past Beta App Review |
| `production` | Everyone | Staged rollout and monitoring mandatory |

And the flow for anything non-trivial:

```
merge to main
   → publish to `preview`      → we run it on our own phones for a day
   → publish to `beta`         → a few hundred students, a few days
   → publish to `production`   → 10% → watch → 50% → watch → 100%
```

For an urgent hotfix, `beta` is skipped and the pauses shrink — but **`preview` never is**.
That's rule 1 of the runbook and it's the one that has saved every team that kept it.

---

## 7.7 What this costs to set up

| Item | Effort |
| --- | --- |
| `beta` build profile in `eas.json` + submit config | 1 h |
| Channel stamped from app config ([doc 6 §6.17](./06-your-questions-answered.md)) | ½ day incl. device verification |
| TestFlight internal group + external group with a public link | 1 h in App Store Connect |
| Play internal + closed testing tracks | 1 h in Play Console |
| Environment switch: UI, `appVariant` gate, and the state-reset path | ½–1 day |
| **Total** | **~2 days**, none of it on the critical path |

Most of it is console clicking rather than code, and it can happen any time before the 3.0
submission.

---

## 7.8 Open questions — two of three answered

1. ~~**Do we want a public beta programme for 3.0 at all?**~~ **Yes** — two populations, so
   three channels. The names we'll use for them, and the practical mechanics of running each
   programme, are in [doc 8 §8.7](./08-infrastructure-answers.md).
2. **Do we want the environment switch in production builds?** Still open. My recommendation is
   no (§7.5), with the visible-in-preview alternative. Say the word if you'd rather have it
   everywhere and I'll build it with the three guardrails.
3. ~~**Play production access**~~ **Confirmed** — 3.0 ships as an update to the existing
   listing, so the 12-testers-for-14-days rule doesn't apply. That was the one item that could
   have put a two-week delay on the cutover; it's off the critical path.

---

**Next:** [8 — Your answers, locked](./08-infrastructure-answers.md) — Terraform, DNS, Argo,
Postgres and tester naming.
*Back to the [index](./README.md) · previous: [6 — Your questions answered](./06-your-questions-answered.md).*
