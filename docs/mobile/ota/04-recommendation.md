# 4 — Recommendation

*Final. The earlier draft of this document recommended Expo's hosted service on the $19 plan,
provisional on one unknown: our monthly active user count. You answered **60,000 and growing**.
That answer inverts the recommendation, and §4.6 records exactly why — I'd rather you see the
reversal than a document that pretends it was always obvious.*

---

## 4.1 The recommendation

**Self-host the update server (xprem) on infrastructure we already run, from day one. Build it
now — months before the 3.0 cutover — and dogfood it on the `preview` channel for the whole
remaining porting period.**

Cost: **~$0–5/month** against **~$249/month** for the hosted equivalent at our scale. Setup:
**1–2 days**. Ongoing: **~1–2 hours a quarter**, plus owning an outage we'd otherwise have
outsourced.

Five parts:

1. **Run xprem** — the mature self-hosted implementation of the Expo Updates Protocol
   ([document 2](./02-options.md) §2.2). Our app does not change: `expo-updates` stays, the
   fingerprint policy stays, only the URL it points at changes.
2. **Put the bundles on Cloudflare R2**, not on our DigitalOcean bucket. R2 charges **nothing
   for egress** — which at 60k users and growing turns the one line item that would otherwise
   scale with our success into a permanent zero (§4.3).
3. **Build it now, not at the cutover.** This is the part that makes self-hosting safe. See
   §4.4.
4. **Keep the Expo account on the free plan.** We build locally (Architecture Book, ADR 006),
   so we lose nothing by not paying Expo. Self-hosting updates does not mean leaving Expo.
5. **Record the reverse trigger too.** If the dogfood period shows we're bad at owning this,
   flipping to EAS Update Production is the same one-line URL change in the other direction.
   The reversibility runs both ways, and that is what makes this decision cheap.

---

## 4.2 Why the answer changed: the arithmetic at 60,000 MAU

| | EAS Update (hosted) | Self-hosted xprem |
| --- | --- | --- |
| Plan / infra | Production, $199/mo (50k MAU included) | Go pod in `do-fra1-cluster01` |
| MAU overage | 10,000 × $0.005 = **$50** | — |
| Bandwidth | within the 1 TiB allowance | **$0** on R2 (zero egress) |
| Storage | included | **$0** (under R2's 10 GB free tier) |
| **Total / month** | **≈ $249** | **≈ $0–5** |
| **Total / year** | **≈ $2,990** | **≈ $0–60** |
| At 100k MAU (plausible in 2 years) | ≈ $449/mo, **$5,390/yr** | **unchanged** |

Setup is 1–2 days of my time. At $2,930/year saved, **the payback is about three days.** At
2,000 users the same setup took *years* to pay back, which is exactly why the draft said the
opposite. At 60,000 it isn't a close call.

You wrote that $199/month for 50k MAU is absurd given the backend fits on a $5 VPS. On the
narrow point you're right, and the table above is the proof: what EAS Update actually does for
us — serve a small JSON manifest and hand the phone a CDN link — genuinely is $5-VPS work. In
fairness to Expo, the $199 also buys a global CDN, a dashboard, and somebody else being on call
at 3am; for a funded team burning $50k/month on payroll that's an obvious trade. For us it
isn't. **The pricing isn't unreasonable, it's just priced for someone who isn't us.**

---

## 4.3 Why Cloudflare R2 rather than our existing DigitalOcean bucket

This is the one genuinely new decision in this document, and it's worth 30 seconds.

At 60k users the update bundles are the only thing in this system that scales with growth.
Rough sizing: a full JavaScript bundle is ~5 MB, bundle diffing (on by default in SDK 56) makes
a typical incremental download ~1.25 MB. During the hotfix-heavy launch period at ~8 updates a
month that's ~10 MB per user per month → **~600 GB/month**. In the steady bi-weekly state it's
~150 GB/month.

| Bucket + CDN | Cost at 600 GB/mo | Cost at 2 TB/mo | Scaling behaviour |
| --- | --- | --- | --- |
| DigitalOcean Spaces | **$5** (1 TiB transfer included) | ~$15 | Linear in bandwidth past 1 TiB |
| **Cloudflare R2** | **$0** | **$0** | **Flat — egress is free, always** |

R2's free tier is 10 GB of storage, 1M writes and 10M reads per month. Our retained bundle
history is on the order of 1–2 GB, and 60k devices pulling 8 updates is roughly 2–3M reads.
**We fit inside the free tier at today's scale and stay inside it for a long while.** Even when
we outgrow it, storage is $0.015/GB-month and egress stays free — the bill grows with our
*bundle history*, not with our *user count*, which is the right axis to be billed on.

DigitalOcean Spaces is a perfectly good fallback if you'd rather not add a fourth vendor; it
costs $5/month and re-introduces a bandwidth line that grows with growth. xprem supports both,
so this is reversible too. **I'd take R2.**

---

## 4.4 The risk I raised against self-hosting, and how we kill it

My draft's strongest argument against self-hosting was not the money — it was timing:

> *"The 3.0 cutover is the highest-risk moment in this project's life. On that day I want our
> emergency mechanism to be the boring, battle-tested one that someone else is on call for."*

That argument is still correct, and it is **entirely defused by building this now.** The app
isn't in the stores. The port is still in progress. We have months.

So the plan is not "self-host during the cutover" — it's:

| When | What |
| --- | --- |
| **Now** (this sprint or the next) | Stand the server up. Point `preview` at it. |
| **The whole remaining port** | Every dogfood build we install is served by our own server. Dozens of real updates to real devices before a single student is on it. |
| **Two weeks before submission** | Rehearse the incident: publish a deliberately broken update to `preview`, roll it back, time it. |
| **At the cutover** | The mechanism is months old and boring. Exactly the property I wanted. |

By the time it matters, "battle-tested" describes our server too. **The only reason to prefer
hosted was that we'd be adopting it under time pressure — so we won't.**

The residual risk is honest and I'm not going to dress it up: **if our update server is down
during an emergency, that is now our problem at 3am.** Three things make it tolerable. The
server is stateless and serves only manifests — if it's down, phones simply keep running the
bundle they already have, so an outage delays a fix rather than breaking the app. The bundles
themselves sit on Cloudflare's CDN, not on our server. And we already run and page on a
NestJS backend for the same users; this is a smaller service than the one we already own.

---

## 4.5 What this means for how we ship

You said: **heavy hotfixing through the Flutter→RN launch, then store releases plus roughly
bi-weekly OTA once it settles.** That's the right instinct, and it maps onto two explicit
postures rather than one process. [Document 5](./05-runbook.md) §5.0 defines both:

- **Launch posture (first ~6–8 weeks).** Fast lane. Staged rollout is still mandatory —
  10% → 50% → 100% — but the pauses shrink to ~30 minutes and we accept publishing on more
  days of the week. The discipline that survives is *dogfood first* and *watch Crashlytics*,
  because those are the two that actually catch things.
- **Steady posture (after).** Bi-weekly publish window, one fixed day, never a Friday
  afternoon, full monitoring pauses between rollout steps.

The trap in a hotfix-heavy launch isn't the tooling, it's fixing forward at 1am on a fleet of
60,000 phones. **Rule 3 in the runbook — roll back first, diagnose second — matters more during
launch than at any other time**, and it is the rule most likely to be broken under pressure.

---

## 4.6 Decision record: your answers and what each one moved

| Question | Your answer | Effect on the recommendation |
| --- | --- | --- |
| Peak MAU | **60,000 and growing** | **Decisive.** Hosted costs ~$2,990/yr vs ~$60. Flipped from EAS to self-hosted |
| Budget | *"$200/mo for 50k MAU is crazy"* | Confirms the flip. Also rules out the $199 plan as a stopgap |
| Expo plan today | **Free** | No billing to unwind; free plan stays for local-build tooling |
| Self-hosting appetite | *"You decide … so self-hosted?"* | Taken as delegated. §4.2 is my justification; challenge it if you disagree |
| Data residency | **No constraint** | Frees us to use R2 (Cloudflare, US) rather than forcing EU-only storage |
| What OTA is for | **Both** — hotfix-heavy launch, then bi-weekly | Produced the two-posture runbook in §4.5 |

**What would change my mind:** if the 60k figure turns out to be *installs* rather than
*monthly actives* and the real number is under ~5,000, the arithmetic reverts and hosted wins
again. Worth a 5-minute sanity check in Firebase Analytics before I start building — but at
anything above ~15,000 the conclusion holds.

---

## 4.7 What actually needs doing

Tracked as a child issue of TIM-170. None of it blocks feature work on the port.

| # | Task | Effort |
| --- | --- | --- |
| 1 | Deploy xprem to `do-fra1-cluster01` (Helm chart), TLS on `ota.timecalendar.fr`, Cloudflare R2 bucket + custom domain, secrets in the existing sealed-secrets setup | 1 day |
| 2 | `npx eoas init` in `mobile/`, repoint `updates.url` in `app.config.ts`, wire the `preview` channel | 2 h |
| 3 | Make the `expo-updates` runtime policy an explicit, documented choice — check-on-launch behaviour, startup timeout budget, and whether we ever prompt the user. Today only the URL is set; the defaults are sane but inherited | ½ day |
| 4 | Verify end-to-end on a real device: publish to `preview`, confirm pickup, confirm a fingerprint-changing build correctly does **not** pick it up | ½ day |
| 5 | Rehearse a rollback on `preview`. The first `eoas rollback` we run must not be during an incident | 1 h |
| 6 | Turn [document 5](./05-runbook.md) into the release checklist; write an ADR in the Architecture Book recording this decision | ½ day |
| 7 | Load-sanity-check the manifest endpoint (§4.8) | 1 h |

**Total: ~2.5 days, spread over the remaining port.**

### Deliberately deferred, with reasons

- **The xprem observability stack.** Its per-device crash/metric feature wants ClickHouse
  alongside Postgres. We already ship Crashlytics and it answers the same question. Run xprem
  in the mode that doesn't need ClickHouse; revisit only if Crashlytics proves insufficient.
- **Update code signing.** `expo-updates` can cryptographically sign updates so a compromised
  server can't push malicious JavaScript. My draft deferred this on the grounds that the server
  was Expo's problem. **Self-hosting weakens that reasoning** — the server is now our attack
  surface, and it's a server that can execute arbitrary code on 60,000 phones. I still think
  it's not a launch blocker (the same key hygiene that protects our cluster protects this), but
  it is now **a genuine follow-up rather than a shrug**, and it goes in the backlog attached to
  the implementation issue rather than being waved away here.
- **Automated publishing from CI.** A human should decide when 60,000 people get a surprise
  update. Revisit if manual publishing becomes the bottleneck.

---

## 4.8 The one thing at 60k that doesn't exist at 2k

Scale changes one technical detail worth checking rather than assuming: **the morning
thundering herd.** A timetable app is opened by most of its users in the same 90 minutes —
roughly 07:30 to 09:00 on a school day. Every one of those cold starts asks our server "is
there an update?"

Order of magnitude: 60,000 devices, most checking once in that window → **~10–15 requests per
second average, with a peak in the low hundreds.** For a Go binary answering with a small
signed JSON manifest that is genuinely unremarkable — but it is the number that decides pod
sizing, and it's the difference between our own OTA server and our own OTA *incident*. Task 7
above is a load sanity check before we point real users at it, not after.

The bundle downloads themselves never touch our server — they go to R2's CDN — so the herd
only ever hits the cheap endpoint.

---

## 4.9 What I'd like from you

1. **Read this and push back if you disagree** — particularly on §4.2. You delegated the call,
   I've made it, and reversing it later costs a URL change, not a rewrite.
2. **Sanity-check the 60k** (§4.6) if it was from memory rather than a dashboard.
3. **Nothing is blocked on this.** The work slots into the remaining port; the app isn't in the
   stores.

---

**Next:** [5 — Day-one runbook](./05-runbook.md) — how we'd actually operate this without
hurting anyone.
