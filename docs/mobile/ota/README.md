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
| 4 | [Recommendation](./04-recommendation.md) | What I think we should do, and why | 6 min |
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

**What it costs.** Expo's hosted service (EAS Update) is **free up to 1,000 monthly active
users**, **$19/month up to 3,000**, and **$199/month up to 50,000**, with in-between overages
at $0.005 per user. Self-hosting on the DigitalOcean cluster we already run costs roughly
**$5/month** plus about **1–2 days of my time to set up** and a small permanent maintenance
tax. Full numbers, including the crossover point, in [document 3](./03-costs.md).

**My recommendation, in one line.** Ship 3.0 on **EAS Update on the paid Starter plan
($19/month)**, not the free plan — because the free plan *hard-stops* when you cross 1,000
users, with no option to pay your way out, and it would stop exactly during a September
enrolment spike when you most need a hotfix. Then keep self-hosting as a documented escape
hatch: **every self-hosted option speaks the same protocol as Expo's**, so switching later is
a config change, not a rewrite. This decision is cheap and reversible — that is the main thing
to understand about it. Reasoning in [document 4](./04-recommendation.md).

---

## What I need from you

I've put six questions in the issue thread (TIM-170). The one that actually moves the number
is **how many monthly active users the current Flutter app has at its September/January peak**
— every hosted vendor prices per active user, so that single figure decides between $0, $19
and $199 per month. If you don't know it offhand, it's in Firebase Analytics for
`timecalendar-samuelprak`, or in the Play Console "Statistics" page.

The other five: budget ceiling, current Expo plan, appetite for self-hosting, whether EU data
residency is a hard requirement, and whether you want OTA for emergencies only or for regular
weekly delivery.

These answers **refine** [document 4](./04-recommendation.md); they don't invalidate documents
1–3, which is why I wrote them now rather than waiting.

## What this pack deliberately does not do

- **It changes no code.** Nothing here alters the app. It's documentation for a decision.
- **It doesn't cover the Flutter app.** Flutter has its own OTA product (Shorebird), but the
  Flutter app is being retired at the 3.0 cutover, so paying to add OTA to it now would be
  spending money on a codebase with months to live. Noted and dismissed in
  [document 2](./02-options.md).
- **It doesn't set up billing.** No account changes, no plan upgrades — those are yours to
  approve.

---

*Prices and product facts in this pack were verified on 2026-08-25 and are dated inline.
Vendor pricing moves; re-check before we commit to a plan.*
