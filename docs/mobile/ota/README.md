# OTA updates for the TimeCalendar React Native app

**Status:** investigation (TIM-170) · **Written:** 2026-08-25 · **Audience:** the CEO, then the team
**Decision needed by:** the 3.0 store cutover (roadmap step 10 — *Parity, cutover & release*)

This folder answers one question: **when we ship the React Native app as version 3.0, how do
we push a fix to users without waiting for the App Store?**

You said you know nothing about OTA. So this pack starts from zero and builds up. Read it in
order — each document assumes the one before it.

| # | Document | What it answers | Read time |
| --- | --- | --- | --- |
| 1 | [What OTA actually is](./01-what-is-ota.md) | What it is, why it exists, what it can and can't do, is it even allowed by Apple? | 10 min |
| 2 | [The options](./02-options.md) | Every solution on the market in 2026, with an honest verdict on each | 12 min |
| 3 | [What it costs](./03-costs.md) | Real numbers, at our scale, including the self-hosted path | 8 min |
| 4 | [Recommendation](./04-recommendation.md) | What we should do, why, and what it takes | 8 min |
| 5 | [Day-one runbook](./05-runbook.md) | How we'd actually ship, roll back, and stay safe | 8 min |

---

## The 90-second version

**What OTA is.** Our app is two things bolted together: a *native shell* (the thing the App
Store reviews and installs) and a *JavaScript bundle* (essentially all of our actual product —
screens, logic, text, layout). OTA — "over the air" — means shipping a new JavaScript bundle
straight to phones that already have the app, skipping the store entirely. Users get the fix
on their next app launch instead of in three days. Roughly **90–95% of the bugs we will
realistically ship are fixable this way.**

**Is it allowed?** Yes. Apple's developer agreement explicitly permits downloading interpreted
code, with three conditions (don't change what the app fundamentally is, don't build an app
store inside your app, don't bypass OS security). Google Play is likewise fine with it. This
isn't a grey area — React Native, Flutter and Ionic apps have shipped this way for a decade.
Details in [document 1](./01-what-is-ota.md).

**Where we already stand.** This is the good news: **we are already 90% set up.** The RN app
runs on Expo SDK 56, `expo-updates` is already installed and configured, the EAS project
exists (`3b427ef6-…`, committed in `mobile/app.config.ts`), and `mobile/eas.json` already
defines two delivery channels (`preview` for dogfooding, `production` for the store). The
previous work also picked the *safe* setting for the single most dangerous OTA failure mode
(see "the fingerprint policy" in [document 1](./01-what-is-ota.md)). We are not starting from
zero — we are choosing a supplier and writing down a discipline.

**What it costs — and why our size decides it.** Every hosted vendor bills per *monthly active
user*. You told me we have **~60,000, and growing**. At that scale Expo's hosted service (EAS
Update) is the **$199/month Production plan plus overage — about $249/month, ~$2,990/year**,
and it grows every September. Running the same thing ourselves, on the Kubernetes cluster we
already operate, is **about $0/month**, because the bundles go on Cloudflare R2 and R2 doesn't
charge for bandwidth. Full numbers in [document 3](./03-costs.md).

**The recommendation, in one line.** **Self-host the update server (xprem) from day one, with
the bundles on Cloudflare R2** — ~$0/month against ~$249, for 1–2 days of setup, paying itself
back in about three days. Crucially, **build it now rather than at the cutover**: the app isn't
in the stores yet, so we get months of dogfooding on our own server before a single student
depends on it. That timing is what makes self-hosting the safe option rather than the brave
one. Reasoning in [document 4](./04-recommendation.md).

**And if we get it wrong?** Switching between hosted and self-hosted is a one-line URL change
in `mobile/app.config.ts` — the app itself is identical either way, because Expo publishes the
update protocol as an open spec. **This is not a one-way door in either direction.**

---

## Decision record

The recommendation in [document 4](./04-recommendation.md) was originally *hosted, $19/month*,
provisional on our user count. Your answers on 2026-08-25 inverted it:

| Question | Your answer | Effect |
| --- | --- | --- |
| Peak monthly active users | **60,000 and growing** | **Decisive** — flipped hosted → self-hosted |
| Budget | *"$200/mo for 50k MAU is crazy"* | Confirms the flip |
| Current Expo plan | Free | Nothing to unwind; free plan stays for build tooling |
| Self-hosting appetite | *"You decide … so self-hosted?"* | Taken as delegated; §4.2 is the justification |
| EU data residency | No constraint | Frees us to use Cloudflare R2 |
| What OTA is for | Hotfix-heavy launch, then bi-weekly | Produced the two-posture runbook, [doc 5](./05-runbook.md) §5.0 |

[Document 4](./04-recommendation.md) §4.6 records the reversal in full — including what would
change my mind back (if the 60k turns out to be *installs* rather than *monthly actives* and
the real figure is under ~5,000).

## What this pack deliberately does not do

- **It changes no code.** Nothing here alters the app. It's documentation for a decision.
- **It doesn't cover the Flutter app.** Flutter has its own OTA product (Shorebird), but the
  Flutter app is being retired at the 3.0 cutover, so paying to add OTA to it now would be
  spending money on a codebase with months to live. Noted and dismissed in
  [document 2](./02-options.md).
- **It doesn't set up billing or infrastructure.** No account changes, no plan upgrades, no
  servers deployed. The implementation is a separate issue (child of TIM-170) covering roughly
  2.5 days of work, listed in [document 4](./04-recommendation.md) §4.7.

---

*Prices and product facts in this pack were verified on 2026-08-25 and are dated inline.
Vendor pricing moves; re-check before we commit to a plan.*
