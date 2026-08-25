# 2 — The options

*Everything on the market in August 2026, with a verdict on each. Money is in
[document 3](./03-costs.md); this document is about what each option **is**.*

---

## 2.0 The insight that makes this decision cheap

Before the list, the thing that de-risks the whole choice:

**Expo publishes the update mechanism as an open specification** — the *Expo Updates Protocol
v1*. Our app's native shell (`expo-updates`) speaks that protocol to a URL. Today that URL is
`https://u.expo.dev/3b427ef6-…`, which is Expo's hosted service. It could just as well be
`https://ota.timecalendar.fr`, run by us.

Which means:

> **Choosing Expo's hosted service does not lock us in.** Migrating to a self-hosted server
> later is a URL change in `mobile/app.config.ts` plus deploying a server — not an app
> rewrite, not a store release, not a new client library. Users don't notice.

That's why I'm comfortable recommending the pragmatic option now rather than agonising. The
expensive, irreversible choice would be adopting a vendor with a *proprietary client SDK*
(§2.4 below) — that one we should avoid.

The market splits into four families:

| Family | Who's in it | Client library | Lock-in |
| --- | --- | --- | --- |
| **A** — Expo hosted | EAS Update | `expo-updates` (ours today) | None — open protocol |
| **B** — Self-hosted, same protocol | xprem, Xavia OTA, Laravel expo-ota-server | `expo-updates` (unchanged) | None |
| **C** — Different open-source stack | Hot Updater, self-hosted CodePush | Its own native module | Moderate |
| **D** — Commercial third parties | Stallion, Revopush, AppsOnAir | Its own SDK, or CodePush-compatible | High |

---

## 2.1 Option A — EAS Update (Expo's hosted service)

**What it is.** The first-party service from Expo, the company that makes the framework our
app is built on. We publish with one command; they host the bundles on a global CDN and serve
them to phones.

**How ready are we?** Essentially done. `expo-updates` is installed, the EAS project exists
and its id is committed, `updates.url` is wired, the fingerprint safety policy is set, and
`preview`/`production` channels are defined in `eas.json`. **The remaining work is a plan
decision and a written process — I estimate half a day, not a project.**

**What you get:**
- Publishing in one command, integrated with the build tooling we already use.
- **Percentage rollouts** — ship to 10% of users, watch, then widen.
- **One-command rollback** (`eas update:rollback`), which also correctly returns users to the
  bundle that shipped in the store binary.
- A global CDN, so a student in Lille and a student on holiday in Réunion both get it fast.
- A web dashboard showing what's live on each channel — useful when *you* want to check
  something shipped without asking me.
- Bundle diffing on by default in SDK 56 (~75% smaller downloads).

**Honest downsides:**
- **It's priced per monthly active user**, so the bill scales with success. See
  [document 3](./03-costs.md).
- **The free tier is a trap for production use.** It hard-stops at 1,000 monthly active users
  with *no option to pay overage* — updates simply stop being served until the 1st of the next
  month. A cap that engages silently, during a September enrolment spike, in the exact week
  we'd want a hotfix, is not a cap I want between us and our users.
- US vendor. Device-level update checks (IP, install id, app version) are processed outside
  the EU. Materially the same posture as the Firebase Analytics/Crashlytics we already ship —
  but worth a conscious decision, which is one of my questions to you.

**Verdict: the default.** Lowest integration cost by a wide margin, best safety features, and
zero lock-in thanks to the open protocol.

---

## 2.2 Option B — Self-hosted, same protocol

Because the protocol is open, several projects implement an update server we could run
ourselves. **Our app wouldn't change at all** — only the URL it points at.

This is more attractive for us than it would be for most teams, because **we already run the
infrastructure**: a DigitalOcean Kubernetes cluster (`do-fra1-cluster01`) and an S3-compatible
bucket. Adding one more small service is a genuinely marginal cost.

### xprem (formerly `expo-open-ota`) — the serious one

- Single Go binary, deploys via Docker or a Helm chart — drops straight into our cluster.
- Storage on any S3-compatible bucket (we have one), served through a CDN. Crucially, **the
  bundles don't flow through the server** — it only serves a small JSON manifest and points
  the phone at the CDN. So the server stays tiny under load.
- Feature parity on the things that matter: percentage rollouts, instant rollback, multi-app
  dashboard, per-update crash and adoption metrics.
- Core is MIT-licensed and free. Some enterprise features (SSO, role-based access, branch
  protection) sit behind a commercial licence — none of which we need.
- Maturity: ~500 GitHub stars, actively maintained, and the maintainers state it has served
  production traffic since early 2025 to apps totalling **>1M monthly active users**.

**Verdict: the credible self-hosted answer, and our escape hatch.** Not the day-one choice
only because it costs 1–2 days of setup and a permanent (if small) ownership tax — see
[document 4](./04-recommendation.md) for the trigger that would flip us to it.

### Xavia OTA

Next.js/TypeScript implementation of the same protocol. Familiar stack for us, smaller
community, fewer operational features than xprem. Fine, but xprem is the stronger pick.

### Laravel `expo-ota-server`

PHP/Laravel + Filament admin, aimed at shared hosting. Wrong stack for a team that runs
Kubernetes and TypeScript. Dismissed.

### Expo's own `custom-expo-updates-server`

Expo publishes a reference implementation on GitHub — **and explicitly says it is a
demonstration, "not guaranteed to be complete, stable, or performant enough to use as a
full-fledged backend."** Excellent for understanding the protocol; **not** something to put in
front of real users. Dismissed as a production option.

---

## 2.3 Option C — A different open-source stack

### Hot Updater

A well-regarded open-source OTA system with its own client library, backed by S3, Cloudflare
R2 or Supabase. Genuinely good software.

**But** it replaces `expo-updates` with its own native module. For us that means throwing away
a working, already-configured integration — including the fingerprint safety policy described
in [document 1](./01-what-is-ota.md) §1.4, which we'd have to re-establish in a different
form. We'd take on migration work and a new failure surface to save a subscription we could
also save by self-hosting *without* changing the app at all (§2.2).

**Verdict: no.** Right idea, wrong trade for a team already standardised on Expo.

### Self-hosted CodePush

Microsoft shut down App Center on **31 March 2025**, taking CodePush with it. They open-sourced
the server, then archived the repository. What remains is community-maintained, aimed at
classic (non-Expo) React Native apps.

**Verdict: no.** Abandoned upstream, wrong ecosystem. Mentioned only because "CodePush" is
still the name most people know, and you'll meet it if you search — it's history now.

---

## 2.4 Option D — Commercial third parties

**Stallion, Revopush, AppsOnAir**, and similar, appeared to catch teams stranded by CodePush's
shutdown. Most are CodePush-API-compatible, so migrating from CodePush is a one-line change —
which is their entire pitch.

We were never on CodePush. For us they offer nothing EAS Update doesn't, while requiring a
proprietary SDK swap (the *expensive, irreversible* kind of choice from §2.0) and adding a
smaller, younger vendor to our dependency list.

**Verdict: no.** Their value proposition is "escape from CodePush", and we have nothing to
escape from.

---

## 2.5 Option E — Do nothing (the baseline)

Worth stating explicitly, because "no OTA" is a legitimate choice and it's what we do today.

- **Cost:** €0.
- **Fix latency:** 1–3 days to availability, ~1 week to broad adoption (see
  [document 1](./01-what-is-ota.md) §1.1).
- **Risk:** a launch-week regression in the calendar is unfixable for days. During a
  Flutter→React Native cutover — where our entire user base migrates to a codebase that has
  never faced real users at scale — that's the highest-risk moment in this project's life.

**Verdict: not acceptable for the 3.0 cutover.** The cutover is precisely when a same-day fix
is worth the most, and the marginal cost of having the capability is $0–19/month.

---

## 2.6 A note on the Flutter app

The Flutter ecosystem has its own OTA product (**Shorebird**), which works on a similar
principle. It's a real option *for a Flutter app you intend to keep*.

We don't. The Flutter app is retired at the 3.0 cutover. Adding an OTA integration — and a
subscription — to a codebase with months to live is spending money to accelerate fixes we've
already decided to stop making. I did not price it.

**Exception worth flagging:** if the cutover slips by more than a couple of terms, or if a
severe bug appears in the Flutter app before cutover, this is worth revisiting. It's not the
current situation.

---

## 2.7 Summary

| Option | Integration cost | Ongoing cost | Lock-in | Verdict |
| --- | --- | --- | --- | --- |
| **A. EAS Update** | ~½ day (already wired) | $0–199/mo by user count | None | ✅ **Default** |
| **B. xprem (self-hosted)** | 1–2 days + ownership | ~$5/mo + our time | None | ✅ **Escape hatch** |
| B. Xavia / Laravel / Expo demo | 1–3 days | ~$5/mo | None | ⚠️ Weaker or non-production |
| **C. Hot Updater** | 2–3 days + rework | ~$5/mo | Moderate | ❌ Discards working setup |
| C. Self-hosted CodePush | Days | Our time | Moderate | ❌ Abandoned upstream |
| **D. Stallion / Revopush / …** | 1–2 days | Vendor pricing | High | ❌ Solves a problem we don't have |
| **E. Do nothing** | 0 | €0 | — | ❌ Unacceptable at cutover |

---

**Next:** [3 — What it costs](./03-costs.md).
